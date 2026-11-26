import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { deriveVoiceAgentSecret, hashVoiceAgentSecret } from './voice-webhook.crypto';

type SignedVoiceRequest = Request & {
  rawBody?: Buffer;
  voiceTenantId?: string;
  voiceAgentConfigId?: string;
};

@Injectable()
export class VoiceWebhookGuard implements CanActivate {
  private checksSinceCleanup = 0;

  constructor(private readonly config: ConfigService, private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<SignedVoiceRequest>();
    const agentConfigId = this.header(request, 'x-voice-agent-id');
    const timestampHeader = this.header(request, 'x-voice-timestamp');
    const nonce = this.header(request, 'x-voice-nonce');
    const signatureHeader = this.header(request, 'x-voice-signature');
    const secret = this.config.get<string>('VOICE_AGENT_WEBHOOK_SECRET') || '';

    if (!secret || Buffer.byteLength(secret) < 32) {
      throw new ServiceUnavailableException('Voice webhook signing is not configured');
    }
    if (!agentConfigId || !/^\d{10,13}$/.test(timestampHeader) || !/^[a-f0-9-]{20,80}$/i.test(nonce) || !/^[a-f0-9]{64}$/i.test(signatureHeader)) {
      throw new UnauthorizedException('Invalid voice webhook signature headers');
    }

    const timestamp = Number(timestampHeader);
    const timestampMs = timestampHeader.length === 10 ? timestamp * 1000 : timestamp;
    if (!Number.isFinite(timestampMs) || Math.abs(Date.now() - timestampMs) > 5 * 60 * 1000) {
      throw new UnauthorizedException('Voice webhook timestamp expired');
    }

    const rawBody = request.rawBody;
    if (!rawBody || !request.originalUrl) throw new UnauthorizedException('Voice webhook raw request is unavailable');

    const configRows = await this.prisma.$queryRaw<Array<{ id: string; tenantId: string; isEnabled: boolean; agentSecretHash: string | null }>>`
      SELECT "id", "tenantId", "isEnabled", "agentSecretHash"
      FROM "voice_agent_configs" WHERE "id" = ${agentConfigId} LIMIT 1
    `;
    const agentConfig = configRows[0];
    const agentSecret = deriveVoiceAgentSecret(secret, agentConfigId);
    const secretHash = hashVoiceAgentSecret(agentSecret);
    if (!agentConfig || !agentConfig.agentSecretHash || !this.safeEqual(agentConfig.agentSecretHash, secretHash)) {
      throw new UnauthorizedException('Voice agent signing key is not provisioned');
    }

    const signedPayload = [timestampHeader, nonce, request.method.toUpperCase(), request.originalUrl, rawBody.toString('utf8')].join('\n');
    const expected = createHmac('sha256', agentSecret).update(signedPayload).digest();
    const actual = Buffer.from(signatureHeader, 'hex');
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      throw new UnauthorizedException('Voice webhook signature is invalid');
    }

    const now = new Date();
    const nonceHash = createHash('sha256').update(`${agentConfigId}:${nonce}`).digest('hex');
    const insertedNonce = await this.prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO "voice_webhook_nonces" ("id", "agentConfigId", "nonceHash", "createdAt", "expiresAt")
      VALUES (gen_random_uuid()::text, ${agentConfigId}, ${nonceHash}, ${now}, ${new Date(now.getTime() + 10 * 60 * 1000)})
      ON CONFLICT ("nonceHash") DO NOTHING RETURNING "id"
    `;
    if (!insertedNonce.length) throw new UnauthorizedException('Voice webhook request has already been used');

    const bucketStart = new Date(Math.floor(now.getTime() / 60_000) * 60_000);
    const bucketRows = await this.prisma.$queryRaw<Array<{ requestCount: number }>>`
      INSERT INTO "voice_webhook_rate_buckets" ("agentConfigId", "bucketStart", "requestCount")
      VALUES (${agentConfigId}, ${bucketStart}, 1)
      ON CONFLICT ("agentConfigId", "bucketStart") DO UPDATE
        SET "requestCount" = "voice_webhook_rate_buckets"."requestCount" + 1
      RETURNING "requestCount"
    `;
    if (Number(bucketRows[0]?.requestCount || 0) > 60) throw new HttpException('Voice webhook rate limit exceeded', HttpStatus.TOO_MANY_REQUESTS);

    this.checksSinceCleanup++;
    if (this.checksSinceCleanup % 100 === 0) {
      await this.prisma.$executeRaw`DELETE FROM "voice_webhook_nonces" WHERE "expiresAt" < ${now}`.catch(() => undefined);
      await this.prisma.$executeRaw`DELETE FROM "voice_webhook_rate_buckets" WHERE "bucketStart" < ${new Date(now.getTime() - 24 * 60 * 60 * 1000)}`.catch(() => undefined);
    }

    request.voiceTenantId = agentConfig.tenantId;
    request.voiceAgentConfigId = agentConfig.id;
    return true;
  }

  private header(request: Request, name: string) {
    const value = request.headers[name];
    return Array.isArray(value) ? value[0] || '' : value || '';
  }

  private safeEqual(left: string, right: string) {
    const a = Buffer.from(left);
    const b = Buffer.from(right);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}

export { SignedVoiceRequest };

import { CanActivate, ExecutionContext, Injectable, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { Request } from 'express';

@Injectable()
export class VoiceWorkerGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const expected = this.config.get<string>('VOICE_WORKER_API_KEY') || '';
    const auth = request.headers.authorization || '';
    const supplied = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (expected.length < 32) throw new ServiceUnavailableException('Voice worker authentication is not configured');
    const a = Buffer.from(expected);
    const b = Buffer.from(supplied);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new UnauthorizedException('Invalid voice worker credentials');
    return true;
  }
}

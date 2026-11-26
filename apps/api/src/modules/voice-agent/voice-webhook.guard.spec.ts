import { createHmac } from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { VoiceWebhookGuard } from './voice-webhook.guard';

describe('VoiceWebhookGuard', () => {
  const secret = '0123456789abcdef0123456789abcdef';
  const config: any = { get: jest.fn(() => secret) };

  function context(request: any) {
    return { switchToHttp: () => ({ getRequest: () => request }) } as any;
  }

  it('verifies a signed request and resolves tenant from the stored agent configuration', async () => {
    const now = String(Date.now());
    const nonce = '123e4567-e89b-42d3-a456-426614174000';
    const body = Buffer.from('{"callId":"123e4567-e89b-42d3-a456-426614174000"}');
    const url = '/api/v1/voice/tools/get-bill';
    const canonical = [now, nonce, 'POST', url, body.toString('utf8')].join('\n');
    const agentSecret = createHmac('sha256', secret).update('billpilot-voice-agent:agent-a').digest('hex');
    const signature = createHmac('sha256', agentSecret).update(canonical).digest('hex');
    const request: any = {
      method: 'POST', originalUrl: url, rawBody: body, body: { tenantId: 'attacker-tenant' },
      headers: { 'x-voice-agent-id': 'agent-a', 'x-voice-timestamp': now, 'x-voice-nonce': nonce, 'x-voice-signature': signature },
    };
    const prisma: any = { $queryRaw: jest.fn().mockResolvedValueOnce([{ id: 'agent-a', tenantId: 'tenant-a', isEnabled: true, agentSecretHash: require('crypto').createHash('sha256').update(agentSecret).digest('hex') }]).mockResolvedValueOnce([{ id: 'nonce-a' }]).mockResolvedValueOnce([{ requestCount: 1 }]), $executeRaw: jest.fn() };
    const guard = new VoiceWebhookGuard(config, prisma);
    await expect(guard.canActivate(context(request))).resolves.toBe(true);
    expect(request.voiceTenantId).toBe('tenant-a');
    expect(request.voiceTenantId).not.toBe(request.body.tenantId);
  });

  it('rejects a request with a reused nonce', async () => {
    const now = String(Date.now());
    const nonce = '123e4567-e89b-42d3-a456-426614174001';
    const body = Buffer.from('{}');
    const url = '/api/v1/voice/webhooks/call-ended';
    const agentSecret = createHmac('sha256', secret).update('billpilot-voice-agent:agent-a').digest('hex');
    const signature = createHmac('sha256', agentSecret).update([now, nonce, 'POST', url, body.toString('utf8')].join('\n')).digest('hex');
    const request = { method: 'POST', originalUrl: url, rawBody: body, headers: { 'x-voice-agent-id': 'agent-a', 'x-voice-timestamp': now, 'x-voice-nonce': nonce, 'x-voice-signature': signature } };
    const crypto = require('crypto');
    const prisma: any = { $queryRaw: jest.fn().mockResolvedValueOnce([{ id: 'agent-a', tenantId: 'tenant-a', isEnabled: true, agentSecretHash: crypto.createHash('sha256').update(agentSecret).digest('hex') }]).mockResolvedValueOnce([]), $executeRaw: jest.fn() };
    const guard = new VoiceWebhookGuard(config, prisma);
    await expect(guard.canActivate(context(request))).rejects.toBeInstanceOf(UnauthorizedException);
  });
});

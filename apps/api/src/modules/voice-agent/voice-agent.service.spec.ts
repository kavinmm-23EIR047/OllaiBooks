import { NotFoundException } from '@nestjs/common';
import { VoiceAgentService } from './voice-agent.service';

describe('VoiceAgentService tenant boundaries', () => {
  const config: any = { get: jest.fn() };
  const whatsapp: any = { sendVoicePaymentLink: jest.fn() };
  const voiceCalls: any = { enqueue: jest.fn() };

  it('scopes the bill lookup to the verified tenant and agent config', async () => {
    const prisma: any = { voiceCall: { findFirst: jest.fn().mockResolvedValue(null) } };
    const service = new VoiceAgentService(prisma, config, whatsapp, voiceCalls);
    const callId = '123e4567-e89b-42d3-a456-426614174000';
    await expect(service.getBillForCall('tenant-a', 'agent-a', { callId, identityConfirmed: true })).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.voiceCall.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ tenantId: 'tenant-a', status: { in: ['RINGING', 'IN_PROGRESS'] }, tenant: { voiceAgentConfig: { id: 'agent-a' } } }),
    }));
  });

  it('persists a do-not-call request as soon as that outcome is received', async () => {
    const prisma: any = {
      voiceCall: { findFirst: jest.fn().mockResolvedValue({ id: '123e4567-e89b-42d3-a456-426614174000', tenantId: 'tenant-a', toNumber: '+919600000000' }), updateMany: jest.fn() },
      doNotCall: { upsert: jest.fn() },
    };
    const service = new VoiceAgentService(prisma, config, whatsapp, voiceCalls);
    const result = await service.logVoiceOutcome('tenant-a', 'agent-a', { callId: '123e4567-e89b-42d3-a456-426614174000', outcome: 'DO_NOT_CALL' });
    expect(prisma.doNotCall.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { tenantId_phone: { tenantId: 'tenant-a', phone: '+919600000000' } } }));
    expect(result.doNotCallRecorded).toBe(true);
  });
});

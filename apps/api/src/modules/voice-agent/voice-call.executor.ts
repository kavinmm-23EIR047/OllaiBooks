import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class VoiceCallExecutor {
  private readonly logger = new Logger(VoiceCallExecutor.name);

  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async execute(callId: string, tenantId: string) {
    const call = await this.prisma.voiceCall.findFirst({
      where: { id: callId, tenantId },
      include: { invoice: true, customer: true, tenant: { select: { name: true, timezone: true, businessProfile: { select: { tradeName: true } } } } },
    });
    if (!call) return { status: 'SKIPPED', reason: 'Call record not found in the scheduled workspace' };
    if (call.status !== 'QUEUED') return { status: call.status, reason: 'Call is no longer queued' };
    const isTestCall = call.purpose === 'AGENT_TEST';
    if (!isTestCall && (!call.invoice || ['PAID', 'CANCELLED', 'DRAFT', 'CREDITED'].includes(call.invoice.status) || Number(call.invoice.balanceDue) <= 0)) {
      return this.skip(callId, tenantId, 'Invoice is no longer unpaid');
    }

    const phone = normalizePhone(call.toNumber);
    const consent = isTestCall ? true : call.customerId ? await this.prisma.contactConsent.findFirst({
      where: { tenantId, customerId: call.customerId, phone, revokedAt: null }, orderBy: { createdAt: 'desc' },
    }) : null;
    if (!consent) return this.skip(callId, tenantId, 'Current voice calling consent is not recorded');

    const doNotCall = await this.prisma.doNotCall.findFirst({ where: { tenantId, phone } });
    if (doNotCall) return this.skip(callId, tenantId, 'Phone number is on the do-not-call list');

    const voiceConfig = await this.prisma.voiceAgentConfig.findUnique({ where: { tenantId } });
    if (!voiceConfig?.isEnabled) return this.skip(callId, tenantId, 'Voice agent is disabled for this workspace');
    if (!isInsideCallingWindow(new Date(), voiceConfig.timezone || call.tenant.timezone || 'Asia/Kolkata', voiceConfig.callingWindowStart || '09:00', voiceConfig.callingWindowEnd || '19:00')) {
      return this.skip(callId, tenantId, 'Outside the tenant calling window');
    }
    if (call.attempt > voiceConfig.maxAttempts) return this.skip(callId, tenantId, 'Maximum call attempts reached');

    const workerUrl = this.config.get<string>('VOICE_WORKER_URL')?.replace(/\/$/, '');
    const workerKey = this.config.get<string>('VOICE_WORKER_API_KEY') || '';
    if (!workerUrl || workerKey.length < 32) throw new ServiceUnavailableException('Voice worker connection is not configured');

    const claimed = await this.prisma.voiceCall.updateMany({ where: { id: callId, tenantId, status: 'QUEUED' }, data: { status: 'RINGING', startedAt: null, skipReason: null } });
    if (claimed.count !== 1) return { status: 'SKIPPED', reason: 'Call was already claimed or canceled' };
    const latestInvoice = isTestCall ? null : await this.prisma.invoice.findFirst({ where: { id: call.invoiceId!, tenantId }, select: { status: true, balanceDue: true } });
    if (!isTestCall && (!latestInvoice || ['PAID', 'CANCELLED', 'DRAFT', 'CREDITED'].includes(latestInvoice.status) || Number(latestInvoice.balanceDue) <= 0)) {
      await this.prisma.voiceCall.updateMany({ where: { id: callId, tenantId, status: 'RINGING' }, data: { status: 'SKIPPED', skipReason: 'Invoice is no longer unpaid', endedAt: new Date() } });
      return { status: 'SKIPPED', reason: 'Invoice is no longer unpaid' };
    }
    const payload = {
      callId,
      tenantRef: tenantId,
      voiceAgentConfigId: voiceConfig.id,
      phoneNumber: phone,
      customerFirstName: isTestCall ? 'Test caller' : call.customer?.name?.trim().split(/\s+/)[0] || 'Customer',
      maskedInvoiceReference: isTestCall ? 'TEST' : maskReference(call.invoice!.invoiceNumber),
      businessName: call.tenant.businessProfile?.tradeName || call.tenant.name,
      language: voiceConfig.language,
      voiceId: voiceConfig.voiceId,
      greeting: voiceConfig.greeting,
      testMode: isTestCall,
      // Financial amounts are intentionally excluded; the agent must fetch them after identity confirmation.
    };
    try {
      const response = await fetch(`${workerUrl}/calls/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${workerKey}` },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`Voice worker returned HTTP ${response.status}`);
      const result: any = await response.json().catch(() => ({}));
      if (result.status !== 'accepted') throw new Error('Voice worker did not accept the call job');
      return { status: 'RINGING' };
    } catch (error: any) {
      await this.prisma.voiceCall.updateMany({ where: { id: callId, tenantId, status: 'RINGING' }, data: { status: 'FAILED', summary: 'Voice worker could not accept the call request', endedAt: new Date() } });
      this.logger.warn(`Voice worker rejected call ${callId}: ${error.message}`);
      throw error;
    }
  }

  private async skip(callId: string, tenantId: string, reason: string) {
    await this.prisma.voiceCall.updateMany({ where: { id: callId, tenantId, status: 'QUEUED' }, data: { status: 'SKIPPED', skipReason: reason, endedAt: new Date() } });
    return { status: 'SKIPPED', reason };
  }
}

export function isInsideCallingWindow(now: Date, timeZone: string, start: string, end: string) {
  let hour: number;
  let minute: number;
  try {
    const parts = new Intl.DateTimeFormat('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now);
    hour = Number(parts.find((part) => part.type === 'hour')?.value);
    minute = Number(parts.find((part) => part.type === 'minute')?.value);
  } catch {
    return false;
  }
  const current = hour * 60 + minute;
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);
  const startValue = startHour * 60 + startMinute;
  const endValue = endHour * 60 + endMinute;
  return current >= startValue && current < endValue;
}

function normalizePhone(value: string) {
  return `+${value.replace(/\D/g, '')}`;
}

function maskReference(value: string) {
  const suffix = value.slice(-4);
  return `••••${suffix}`;
}

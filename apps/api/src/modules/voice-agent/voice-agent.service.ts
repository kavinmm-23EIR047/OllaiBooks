import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VoiceCallStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { WhatsAppService } from '../whatsapp/whatsapp.service';
import { CreateVoiceCampaignSchema, DoNotCallSchema, SaveVoiceAgentConfigSchema, TriggerVoiceCallSchema, TestVoiceCallSchema, VoiceCallEndedSchema, VoiceGetBillSchema, VoiceOutcomeSchema, VoiceConsentSchema } from './voice-agent.schemas';
import { VoiceCallQueue } from './voice-call.queue';
import { isInsideCallingWindow } from './voice-call.executor';
import { deriveVoiceAgentSecret, hashVoiceAgentSecret } from './voice-webhook.crypto';

export const normalizeVoicePhone = (phone: string) => `+${phone.replace(/\D/g, '')}`;

@Injectable()
export class VoiceAgentService {
  private readonly logger = new Logger(VoiceAgentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly whatsapp: WhatsAppService,
    private readonly voiceCalls: VoiceCallQueue,
  ) {}

  async getSettings(tenantId: string) {
    const config = await this.prisma.voiceAgentConfig.findUnique({ where: { tenantId } });
    const { agentSecretHash: _secretHash, ...safe } = config || {} as any;
    return {
      configured: Boolean(config),
      workerConfigured: Boolean(this.config.get<string>('VOICE_WORKER_URL') && this.config.get<string>('VOICE_WORKER_API_KEY')),
      settings: config ? safe : { isEnabled: false, language: 'en-IN', voiceId: 'default', greeting: '', callingWindowStart: '09:00', callingWindowEnd: '19:00', maxAttempts: 3, timezone: 'Asia/Kolkata' },
    };
  }

  async saveSettings(tenantId: string, userId: string, input: unknown) {
    const data = SaveVoiceAgentConfigSchema.parse(input);
    const webhookSecret = this.config.get<string>('VOICE_AGENT_WEBHOOK_SECRET') || '';
    const workerConfigured = Boolean(this.config.get<string>('VOICE_WORKER_URL') && this.config.get<string>('VOICE_WORKER_API_KEY'));
    if (data.isEnabled && (!webhookSecret || Buffer.byteLength(webhookSecret) < 32 || !workerConfigured)) {
      throw new ServiceUnavailableException('Configure the voice signing secret and worker API before enabling outbound calls');
    }
    if (Number(data.callingWindowStart.replace(':', '')) >= Number(data.callingWindowEnd.replace(':', ''))) {
      throw new BadRequestException('Calling window end must be later than its start');
    }
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { timezone: true } });
    const existing = await this.prisma.voiceAgentConfig.findUnique({ where: { tenantId }, select: { id: true } });
    const configId = existing?.id || randomUUID();
    const derivedAgentSecret = webhookSecret ? deriveVoiceAgentSecret(webhookSecret, configId) : null;
    const agentSecretHash = derivedAgentSecret ? hashVoiceAgentSecret(derivedAgentSecret) : null;
    const saved = await this.prisma.voiceAgentConfig.upsert({
      where: { tenantId },
      create: { id: configId, tenantId, ...data, provider: 'LIVEKIT_SIP', timezone: tenant?.timezone || 'Asia/Kolkata', operatingHoursStart: data.callingWindowStart, operatingHoursEnd: data.callingWindowEnd, agentSecretHash },
      update: { ...data, provider: 'LIVEKIT_SIP', timezone: tenant?.timezone || 'Asia/Kolkata', operatingHoursStart: data.callingWindowStart, operatingHoursEnd: data.callingWindowEnd, agentSecretHash },
    });
    await this.prisma.auditLog.create({ data: { tenantId, userId, action: 'VOICE_AGENT_CONFIG_UPDATED', entityType: 'voice_agent_config', entityId: saved.id, details: { isEnabled: saved.isEnabled, language: saved.language } } });
    const { agentSecretHash: _secretHash, ...safe } = saved;
    return safe;
  }

  async getBillForCall(tenantId: string, agentConfigId: string, input: unknown) {
    const { callId } = VoiceGetBillSchema.parse(input);
    const call = await this.prisma.voiceCall.findFirst({ where: { id: callId, tenantId, status: { in: ['RINGING', 'IN_PROGRESS'] }, tenant: { voiceAgentConfig: { id: agentConfigId } } }, include: { invoice: true } });
    if (!call?.invoice || !call.invoiceId) throw new NotFoundException('Bill not found for this call');
    if (call.invoice.status === 'PAID' || Number(call.invoice.balanceDue) <= 0) throw new ConflictException('This bill is already paid');
    if (['DRAFT', 'CANCELLED', 'CREDITED'].includes(call.invoice.status)) throw new ConflictException('This bill is not available for a payment reminder');
    return { invoiceNumber: call.invoice.invoiceNumber, balanceDue: call.invoice.balanceDue.toFixed(2), currency: call.invoice.currency, dueDate: call.invoice.dueDate.toISOString() };
  }

  async getWorkerCallCredentials(callId: string) {
    const call = await this.prisma.voiceCall.findFirst({
      where: { id: callId, direction: 'OUTBOUND', status: { in: ['RINGING', 'IN_PROGRESS'] } },
      select: { tenantId: true },
    });
    if (!call) throw new NotFoundException('Active outbound call was not found');
    const config = await this.prisma.voiceAgentConfig.findUnique({ where: { tenantId: call.tenantId } });
    if (!config?.agentSecretHash) throw new NotFoundException('Voice agent signing key is unavailable');
    const master = this.config.get<string>('VOICE_AGENT_WEBHOOK_SECRET') || '';
    if (Buffer.byteLength(master) < 32) throw new ServiceUnavailableException('Voice webhook signing is not configured');
    const secret = deriveVoiceAgentSecret(master, config.id);
    if (hashVoiceAgentSecret(secret) !== config.agentSecretHash) throw new ServiceUnavailableException('Voice agent signing key is not synchronized');
    return { voiceAgentConfigId: config.id, agentWebhookSecret: secret };
  }

  async markCallAnswered(callId: string) {
    const call = await this.prisma.voiceCall.findFirst({
      where: { id: callId, direction: 'OUTBOUND', status: { in: ['RINGING', 'IN_PROGRESS'] } },
      select: { id: true, tenantId: true, status: true },
    });
    if (!call) throw new NotFoundException('Active outbound call was not found');
    if (call.status === 'RINGING') {
      const updated = await this.prisma.voiceCall.updateMany({
        where: { id: callId, tenantId: call.tenantId, status: 'RINGING' },
        data: { status: 'IN_PROGRESS', startedAt: new Date() },
      });
      if (updated.count !== 1) throw new ConflictException('Call state changed before answer confirmation');
    }
    return { callId, status: 'IN_PROGRESS' };
  }

  async markCallDialFailed(callId: string, failureType: 'NO_ANSWER' | 'BUSY' | 'SIP_FAILURE' | 'AGENT_FAILURE') {
    const call = await this.prisma.voiceCall.findFirst({ where: { id: callId, direction: 'OUTBOUND', status: { in: ['RINGING', 'IN_PROGRESS'] } }, select: { id: true, tenantId: true } });
    if (!call) throw new NotFoundException('Active outbound call was not found');
    const status = failureType === 'NO_ANSWER' ? 'NO_ANSWER' : failureType === 'BUSY' ? 'BUSY' : 'FAILED';
    const summary = failureType === 'NO_ANSWER' ? 'The customer did not answer' : failureType === 'BUSY' ? 'The destination line was busy' : 'The voice provider or agent could not complete the call';
    await this.prisma.voiceCall.updateMany({ where: { id: callId, tenantId: call.tenantId, status: { in: ['RINGING', 'IN_PROGRESS'] } }, data: { status, outcome: failureType === 'NO_ANSWER' || failureType === 'BUSY' ? 'NO_ANSWER' : undefined, summary, endedAt: new Date(), completedAt: new Date() } });
    return { callId, status };
  }

  async sendPaymentLinkForCall(agentConfigId: string, tenantId: string, input: unknown) {
    const { callId } = VoiceGetBillSchema.parse(input);
    const call = await this.prisma.voiceCall.findFirst({ where: { id: callId, tenantId, status: { in: ['RINGING', 'IN_PROGRESS'] }, tenant: { voiceAgentConfig: { id: agentConfigId } } }, select: { invoiceId: true } });
    if (!call?.invoiceId) throw new NotFoundException('Bill not found for this call');
    return this.whatsapp.sendVoicePaymentLink(tenantId, call.invoiceId);
  }

  async logVoiceOutcome(tenantId: string, agentConfigId: string, input: unknown) {
    const { callId, outcome } = VoiceOutcomeSchema.parse(input);
    const call = await this.prisma.voiceCall.findFirst({ where: { id: callId, tenantId, status: { in: ['RINGING', 'IN_PROGRESS'] }, tenant: { voiceAgentConfig: { id: agentConfigId } } } });
    if (!call) throw new NotFoundException('Call not found');
    const normalizedPhone = normalizeVoicePhone(call.toNumber);
    if (outcome === 'DO_NOT_CALL') {
      await this.prisma.doNotCall.upsert({
        where: { tenantId_phone: { tenantId: call.tenantId, phone: normalizedPhone } },
        create: { tenantId: call.tenantId, phone: normalizedPhone, reason: 'Caller requested no further calls' },
        update: { reason: 'Caller requested no further calls' },
      });
    }
    const status = outcome === 'NO_ANSWER' ? VoiceCallStatus.NO_ANSWER : outcome === 'TRANSFERRED' ? VoiceCallStatus.ESCALATED : VoiceCallStatus.COMPLETED;
    await this.prisma.voiceCall.updateMany({ where: { id: call.id, tenantId: call.tenantId }, data: { outcome, status, endedAt: new Date() } });
    return { callId: call.id, outcome, status, doNotCallRecorded: outcome === 'DO_NOT_CALL' };
  }

  async finishVoiceCall(tenantId: string, agentConfigId: string, input: unknown) {
    const dto = VoiceCallEndedSchema.parse(input);
    const call = await this.prisma.voiceCall.findFirst({ where: { id: dto.callId, tenantId, tenant: { voiceAgentConfig: { id: agentConfigId } } }, select: { id: true, tenantId: true, status: true, outcome: true } });
    if (!call) throw new NotFoundException('Call not found');
    const status = call.status === 'FAILED' ? 'FAILED' : call.outcome === 'NO_ANSWER' ? 'NO_ANSWER' : call.outcome === 'TRANSFERRED' ? 'ESCALATED' : 'COMPLETED';
    await this.prisma.voiceCall.updateMany({
      where: { id: call.id, tenantId: call.tenantId },
      data: { transcript: dto.transcript, recordingUrl: dto.recordingUrl, durationSeconds: dto.durationSec, costInr: dto.costInr, endedAt: new Date(), completedAt: new Date(), status },
    });
    return { callId: call.id, status };
  }

  async setContactConsent(tenantId: string, userId: string, input: unknown) {
    const dto = VoiceConsentSchema.parse(input);
    const customer = await this.prisma.customer.findFirst({ where: { id: dto.customerId, tenantId, isArchived: false }, select: { id: true, phone: true } });
    if (!customer) throw new NotFoundException('Customer not found');
    if (!customer.phone || normalizeVoicePhone(customer.phone) !== dto.phone) throw new BadRequestException('Consent phone must match the customer phone on file');
    const now = new Date();
    if (dto.granted) {
      await this.prisma.contactConsent.create({ data: { tenantId, customerId: dto.customerId, phone: dto.phone, source: dto.source, grantedAt: now } });
    } else {
      await this.prisma.contactConsent.updateMany({ where: { tenantId, customerId: dto.customerId, phone: dto.phone, revokedAt: null }, data: { revokedAt: now, source: dto.source } });
    }
    await this.prisma.auditLog.create({ data: { tenantId, userId, action: dto.granted ? 'VOICE_CALL_CONSENT_GRANTED' : 'VOICE_CALL_CONSENT_REVOKED', entityType: 'customer', entityId: customer.id } });
    return { customerId: customer.id, phone: dto.phone, status: dto.granted ? 'GRANTED' : 'REVOKED' };
  }

  async listContactConsents(tenantId: string) {
    return this.prisma.contactConsent.findMany({ where: { tenantId }, include: { customer: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 500 });
  }

  async addDoNotCall(tenantId: string, input: unknown) {
    const dto = DoNotCallSchema.parse(input);
    const phone = normalizeVoicePhone(dto.phone);
    const entry = await this.prisma.doNotCall.upsert({ where: { tenantId_phone: { tenantId, phone } }, create: { tenantId, phone, reason: dto.reason }, update: { reason: dto.reason } });
    return { id: entry.id, phone: maskPhone(phone), reason: entry.reason, createdAt: entry.createdAt };
  }

  async listDoNotCall(tenantId: string) {
    const entries = await this.prisma.doNotCall.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 500 });
    return entries.map((entry) => ({ ...entry, phone: maskPhone(entry.phone) }));
  }

  async removeDoNotCall(tenantId: string, id: string) {
    const result = await this.prisma.doNotCall.deleteMany({ where: { id, tenantId } });
    if (!result.count) throw new NotFoundException('Do-not-call entry not found');
    return { deleted: true };
  }

  async listCampaigns(tenantId: string) {
    return this.prisma.voiceCampaign.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' }, take: 100, include: { _count: { select: { calls: true } } } });
  }

  async previewCampaign(tenantId: string, input: unknown) {
    const dto = CreateVoiceCampaignSchema.parse(input) as { name: string; invoiceIds: string[]; scheduleAt?: string };
    const result = await this.evaluateCampaign(tenantId, dto);
    return {
      scheduledAt: result.scheduledAt.toISOString(),
      eligible: result.eligible.map(({ phone: _phone, customerId: _customerId, ...customer }) => customer),
      excluded: result.excluded,
      eligibleCount: result.eligible.length,
      excludedCount: result.excluded.length,
    };
  }

  private async evaluateCampaign(tenantId: string, dto: { invoiceIds?: string[]; scheduleAt?: string; name?: string }) {
    const config = await this.prisma.voiceAgentConfig.findUnique({ where: { tenantId } });
    if (!config?.isEnabled) throw new ConflictException('Enable and configure the voice agent before previewing an outbound campaign');
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { timezone: true } });
    const scheduledAt = dto.scheduleAt ? new Date(dto.scheduleAt) : new Date();
    const invoiceIds = dto.invoiceIds || [];
    const invoices = await this.prisma.invoice.findMany({ where: { tenantId, id: { in: invoiceIds } }, include: { customer: { select: { id: true, name: true, phone: true } } } });
    const invoiceMap = new Map(invoices.map((invoice) => [invoice.id, invoice]));
    const eligible: Array<{ invoiceId: string; customerId: string; phone: string; invoiceReference: string; customerName: string; maskedPhone: string; attempt: number }> = [];
    const excluded: Array<{ invoiceId: string; invoiceReference: string | null; reason: string }> = [];
    for (const invoiceId of invoiceIds) {
      const invoice = invoiceMap.get(invoiceId);
      let reason = '';
      if (!invoice || !invoice.customer) reason = 'Invoice or customer was not found in this workspace';
      else if (['PAID', 'CANCELLED', 'DRAFT', 'CREDITED'].includes(invoice.status) || Number(invoice.balanceDue) <= 0) reason = 'Invoice is not unpaid';
      else if (!invoice.customer.phone) reason = 'Customer phone is missing';
      else {
        const phone = normalizeVoicePhone(invoice.customer.phone);
        const consent = await this.prisma.contactConsent.findFirst({ where: { tenantId, customerId: invoice.customer.id, phone, revokedAt: null }, orderBy: { createdAt: 'desc' } });
        if (!consent) reason = 'No active voice calling consent';
        else if (await this.prisma.doNotCall.findFirst({ where: { tenantId, phone } })) reason = 'Phone is on the do-not-call list';
        else if (!isInsideCallingWindow(scheduledAt, config.timezone || tenant?.timezone || 'Asia/Kolkata', config.callingWindowStart, config.callingWindowEnd)) reason = 'Outside the configured calling window';
        else {
          const attempt = await this.prisma.voiceCall.count({ where: { tenantId, customerId: invoice.customer.id, invoiceId, purpose: 'PAYMENT_REMINDER', direction: 'OUTBOUND' } }) + 1;
          if (attempt > config.maxAttempts) reason = 'Maximum call attempts reached';
          else eligible.push({ invoiceId, customerId: invoice.customer.id, phone, invoiceReference: maskReference(invoice.invoiceNumber), customerName: invoice.customer.name, maskedPhone: maskPhone(phone), attempt });
        }
      }
      if (reason) excluded.push({ invoiceId, invoiceReference: invoice?.invoiceNumber ? maskReference(invoice.invoiceNumber) : null, reason });
    }
    return { scheduledAt, eligible, excluded };
  }

  async createCampaign(tenantId: string, userId: string, input: unknown) {
    const dto = CreateVoiceCampaignSchema.parse(input) as { name: string; invoiceIds: string[]; scheduleAt?: string };
    const evaluation = await this.evaluateCampaign(tenantId, dto);
    const preview = {
      scheduledAt: evaluation.scheduledAt.toISOString(),
      eligible: evaluation.eligible.map(({ phone: _phone, customerId: _customerId, ...customer }) => customer),
      excluded: evaluation.excluded,
      eligibleCount: evaluation.eligible.length,
      excludedCount: evaluation.excluded.length,
    };
    if (!evaluation.eligible.length) throw new ConflictException({ message: 'No eligible customers are available for this campaign', preview });
    const scheduledAt = evaluation.scheduledAt;
    const campaign = await this.prisma.voiceCampaign.create({ data: { tenantId, name: dto.name, filter: { invoiceIds: dto.invoiceIds }, scheduledAt, status: scheduledAt.getTime() > Date.now() ? 'SCHEDULED' : 'QUEUED' } });
    await this.prisma.voiceCall.createMany({ data: evaluation.eligible.map((row) => ({ tenantId, invoiceId: row.invoiceId, customerId: row.customerId, campaignId: campaign.id, toNumber: row.phone, purpose: 'PAYMENT_REMINDER', direction: 'OUTBOUND', status: 'QUEUED', attempt: row.attempt })) });
    const calls = await this.prisma.voiceCall.findMany({ where: { tenantId, campaignId: campaign.id }, select: { id: true } });
    try {
      await Promise.all(calls.map((call) => this.voiceCalls.enqueue(tenantId, call.id, scheduledAt)));
    } catch {
      await this.prisma.voiceCall.updateMany({ where: { tenantId, campaignId: campaign.id, status: 'QUEUED' }, data: { status: 'FAILED', summary: 'Call queue is unavailable', endedAt: new Date() } });
      await this.prisma.voiceCampaign.update({ where: { id: campaign.id }, data: { status: 'FAILED' } });
      throw new ServiceUnavailableException('Campaign was saved but calls could not be queued; verify Redis and retry with a new campaign');
    }
    await this.prisma.auditLog.create({ data: { tenantId, userId, action: 'VOICE_CAMPAIGN_CREATED', entityType: 'voice_campaign', entityId: campaign.id, details: { eligibleCount: calls.length, excludedCount: preview.excludedCount } } });
    return { campaign, preview, queuedCalls: calls.length };
  }

  async triggerCall(tenantId: string, input: unknown) {
    const dto = TriggerVoiceCallSchema.parse(input);
    const [config, invoice, customer] = await Promise.all([
      this.prisma.voiceAgentConfig.findUnique({ where: { tenantId } }),
      this.prisma.invoice.findFirst({ where: { id: dto.invoiceId, tenantId }, select: { id: true, status: true, balanceDue: true } }),
      this.prisma.customer.findFirst({ where: { id: dto.customerId, tenantId, isArchived: false }, select: { id: true, phone: true } }),
    ]);
    if (!config?.isEnabled) throw new ConflictException('Enable and configure the voice agent before scheduling a call');
    if (!invoice || ['PAID', 'CANCELLED', 'DRAFT', 'CREDITED'].includes(invoice.status) || Number(invoice.balanceDue) <= 0) throw new ConflictException('Invoice is not eligible for a payment reminder');
    if (!customer || !customer.phone || normalizeVoicePhone(customer.phone) !== dto.toNumber) throw new BadRequestException('Phone number must match the customer phone on file');
    const consent = await this.prisma.contactConsent.findFirst({ where: { tenantId, customerId: customer.id, phone: dto.toNumber, revokedAt: null } });
    if (!consent) throw new ConflictException('Record voice calling consent before placing this call');
    if (await this.prisma.doNotCall.findFirst({ where: { tenantId, phone: dto.toNumber } })) throw new ConflictException('This phone number is on the do-not-call list');
    const attempt = await this.prisma.voiceCall.count({ where: { tenantId, customerId: customer.id, invoiceId: invoice.id, purpose: 'PAYMENT_REMINDER', direction: 'OUTBOUND' } }) + 1;
    if (attempt > config.maxAttempts) throw new ConflictException('Maximum call attempts reached for this invoice');
    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : new Date();
    if (!isInsideCallingWindow(scheduledAt, config.timezone || 'Asia/Kolkata', config.callingWindowStart, config.callingWindowEnd)) throw new ConflictException('Requested call time is outside the configured calling window');
    const call = await this.prisma.voiceCall.create({
      data: { tenantId, customerId: customer.id, invoiceId: invoice.id, toNumber: dto.toNumber, purpose: dto.purpose, direction: 'OUTBOUND', status: 'QUEUED', attempt },
      select: { id: true, status: true, createdAt: true },
    });
    try {
      await this.voiceCalls.enqueue(tenantId, call.id, scheduledAt);
    } catch (error) {
      await this.prisma.voiceCall.updateMany({ where: { id: call.id, tenantId, status: 'QUEUED' }, data: { status: 'FAILED', summary: 'Call queue is unavailable', endedAt: new Date() } });
      throw new ServiceUnavailableException('Call could not be queued; verify Redis and try again');
    }
    this.logger.log(`Payment reminder call queued; call=${call.id}, destination=${maskPhone(dto.toNumber)}`);
    return { id: call.id, status: 'QUEUED', scheduledAt: scheduledAt.toISOString() };
  }

  async triggerTestCall(tenantId: string, input: unknown) {
    const { toNumber } = TestVoiceCallSchema.parse(input);
    const config = await this.prisma.voiceAgentConfig.findUnique({ where: { tenantId } });
    if (!config?.isEnabled) throw new ConflictException('Enable the voice agent in Agent settings before testing');
    if (await this.prisma.doNotCall.findFirst({ where: { tenantId, phone: toNumber } })) throw new ConflictException('This number is on the do-not-call list');
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, timezone: true, businessProfile: { select: { tradeName: true } } } });
    const now = new Date();
    if (!isInsideCallingWindow(now, config.timezone || tenant?.timezone || 'Asia/Kolkata', config.callingWindowStart, config.callingWindowEnd)) {
      throw new ConflictException('Current time is outside the configured calling window');
    }
    const call = await this.prisma.voiceCall.create({
      data: { tenantId, toNumber, purpose: 'AGENT_TEST', direction: 'OUTBOUND', status: 'QUEUED', attempt: 1 },
      select: { id: true, status: true, createdAt: true },
    });
    try {
      await this.voiceCalls.enqueue(tenantId, call.id, now);
    } catch {
      await this.prisma.voiceCall.updateMany({ where: { id: call.id, tenantId, status: 'QUEUED' }, data: { status: 'FAILED', summary: 'Test call could not be queued', endedAt: new Date() } });
      throw new ServiceUnavailableException('Test call could not be queued; verify Redis and the voice worker');
    }
    return { ...call, status: 'QUEUED', scheduledAt: now.toISOString() };
  }

  /** Internet (WebRTC) call to the AI agent from the app. No phone number, SIP trunk or carrier charges. */
  async startWebCall(tenantId: string) {
    const config = await this.prisma.voiceAgentConfig.findUnique({ where: { tenantId } });
    if (!config?.isEnabled) throw new ConflictException('Enable the voice agent in Agent settings before calling it');
    const workerUrl = this.config.get<string>('VOICE_WORKER_URL')?.replace(/\/$/, '');
    const workerKey = this.config.get<string>('VOICE_WORKER_API_KEY') || '';
    if (!workerUrl || workerKey.length < 32) throw new ServiceUnavailableException('Voice worker connection is not configured');
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { name: true, businessProfile: { select: { tradeName: true } } } });
    const call = await this.prisma.voiceCall.create({
      data: { tenantId, toNumber: 'WEB', purpose: 'WEB_CALL', direction: 'OUTBOUND', status: 'RINGING', attempt: 1 },
      select: { id: true },
    });
    try {
      const response = await fetch(`${workerUrl}/calls/web-start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${workerKey}` },
        body: JSON.stringify({
          callId: call.id,
          voiceAgentConfigId: config.id,
          businessName: tenant?.businessProfile?.tradeName || tenant?.name || 'the business',
          language: config.language,
          voiceId: config.voiceId,
          greeting: config.greeting || '',
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) throw new Error(`Voice worker returned HTTP ${response.status}`);
      const room: any = await response.json();
      if (!room?.serverUrl || !room?.participantToken) throw new Error('Voice worker returned no room token');
      return { callId: call.id, serverUrl: room.serverUrl as string, participantToken: room.participantToken as string };
    } catch (error: any) {
      await this.prisma.voiceCall.updateMany({ where: { id: call.id, tenantId, status: 'RINGING' }, data: { status: 'FAILED', summary: 'Voice worker could not start the internet call', endedAt: new Date() } });
      this.logger.warn(`Web call ${call.id} could not start: ${error.message}`);
      throw new ServiceUnavailableException('The AI agent is not reachable right now; check that the voice worker is running');
    }
  }

  async listCalls(tenantId: string, page: any = 1, limit: any = 20) {
    const safePage = Math.max(1, Number.parseInt(String(page ?? '1'), 10) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number.parseInt(String(limit ?? '20'), 10) || 20));
    const skip = Math.max(0, (safePage - 1) * safeLimit);

    const [items, total] = await Promise.all([
      this.prisma.voiceCall.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: safeLimit,
        include: { customer: true, invoice: true },
      }),
      this.prisma.voiceCall.count({ where: { tenantId } }),
    ]);

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    };
  }

  async getMetrics(tenantId: string) {
    const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const calls = await this.prisma.voiceCall.findMany({
      where: { tenantId, createdAt: { gte: since }, direction: 'OUTBOUND' },
      select: { status: true, outcome: true, invoiceId: true, createdAt: true },
      take: 5000,
    });
    const firstCallByInvoice = new Map<string, Date>();
    for (const call of calls) if (call.invoiceId && (!firstCallByInvoice.has(call.invoiceId) || call.createdAt < firstCallByInvoice.get(call.invoiceId)!)) firstCallByInvoice.set(call.invoiceId, call.createdAt);
    const payments = firstCallByInvoice.size ? await this.prisma.payment.findMany({
      where: { tenantId, invoiceId: { in: [...firstCallByInvoice.keys()] }, status: 'PAID', paymentDate: { gte: since } },
      select: { invoiceId: true, amount: true, paymentDate: true },
      take: 10000,
    }) : [];
    const recovered = payments.reduce((sum, payment) => {
      const calledAt = firstCallByInvoice.get(payment.invoiceId);
      return calledAt && payment.paymentDate >= calledAt ? sum + Number(payment.amount) : sum;
    }, 0);
    const reached = calls.filter((call) => ['COMPLETED', 'IN_PROGRESS', 'ESCALATED'].includes(call.status)).length;
    return {
      periodDays: 90,
      callsMade: calls.length,
      answeredRate: calls.length ? Math.round((reached / calls.length) * 10000) / 100 : 0,
      promisesToPay: calls.filter((call) => call.outcome === 'WILL_PAY').length,
      disputes: calls.filter((call) => call.outcome === 'DISPUTED').length,
      amountRecoveredInr: recovered.toFixed(2),
    };
  }
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, '');
  return `+${digits.slice(0, 2)}${'*'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-2)}`;
}

function maskReference(value: string) {
  if (!value || value.length <= 4) return value;
  return `${value.slice(0, 3)}...${value.slice(-3)}`;
}

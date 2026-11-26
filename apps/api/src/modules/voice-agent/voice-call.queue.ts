import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue, Worker } from 'bullmq';
import { PrismaService } from '../../database/prisma.service';
import { VoiceCallExecutor } from './voice-call.executor';

type VoiceCallJob = { tenantId: string; callId: string };

@Injectable()
export class VoiceCallQueue implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(VoiceCallQueue.name);
  private queue?: Queue<VoiceCallJob>;
  private worker?: Worker<VoiceCallJob>;
  private retentionTimer?: NodeJS.Timeout;
  private staleCallTimer?: NodeJS.Timeout;

  constructor(private readonly config: ConfigService, private readonly executor: VoiceCallExecutor, private readonly prisma: PrismaService) {}

  async onModuleInit() {
    const connection = {
      host: this.config.get<string>('REDIS_HOST', '127.0.0.1'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      password: this.config.get<string>('REDIS_PASSWORD') || undefined,
      maxRetriesPerRequest: null,
    };
    this.queue = new Queue<VoiceCallJob>('billpilot-voice-calls', { connection });
    this.worker = new Worker<VoiceCallJob>('billpilot-voice-calls', (job) => this.executor.execute(job.data.callId, job.data.tenantId), { connection, concurrency: 5 });
    this.worker.on('failed', async (job, error) => {
      if (!job) return;
      this.logger.warn(`Voice call queue job ${job.id} failed: ${error.message}`);
      await this.prisma.voiceCall.updateMany({ where: { id: job.data.callId, tenantId: job.data.tenantId, status: 'QUEUED' }, data: { status: 'FAILED', summary: 'Call could not be started', endedAt: new Date() } }).catch(() => undefined);
    });
    this.retentionTimer = setInterval(() => void this.pruneTranscripts(), 60 * 60 * 1000);
    this.retentionTimer.unref();
    await this.pruneTranscripts();
    this.staleCallTimer = setInterval(() => void this.failStaleRingingCalls(), 30_000);
    this.staleCallTimer.unref();
    await this.failStaleRingingCalls();
  }

  async enqueue(tenantId: string, callId: string, scheduledAt?: Date) {
    if (!this.queue) throw new Error('Voice call queue is not ready');
    const delay = scheduledAt ? Math.max(0, scheduledAt.getTime() - Date.now()) : 0;
    const job = await this.queue.add('place-call', { tenantId, callId }, {
      jobId: callId,
      delay,
      attempts: 1,
      removeOnComplete: { count: 500 },
      removeOnFail: false,
    });
    return job.id;
  }

  async cancelCallsForInvoice(tenantId: string, invoiceId: string) {
    const calls = await this.prisma.voiceCall.findMany({ where: { tenantId, invoiceId, status: 'QUEUED' }, select: { id: true } });
    if (this.queue) {
      const jobs = await this.queue.getJobs(['waiting', 'delayed', 'paused']);
      const jobMap = new Map(jobs.map((job: Job<VoiceCallJob>) => [job.id, job]));
      await Promise.all(calls.map(async (call) => { await jobMap.get(call.id)?.remove().catch(() => undefined); }));
    }
    if (!calls.length) return { canceled: 0 };
    const result = await this.prisma.voiceCall.updateMany({
      where: { tenantId, invoiceId, id: { in: calls.map((call) => call.id) }, status: 'QUEUED' },
      data: { status: 'CANCELED', skipReason: 'Invoice was paid before the scheduled call', endedAt: new Date() },
    });
    return { canceled: result.count };
  }

  private async pruneTranscripts() {
    const days = Number(this.config.get<string>('VOICE_TRANSCRIPT_RETENTION_DAYS', '90'));
    if (!Number.isFinite(days) || days < 1) return;
    const cutoff = new Date(Date.now() - Math.min(days, 3650) * 24 * 60 * 60 * 1000);
    await this.prisma.voiceCall.updateMany({
      where: { endedAt: { lt: cutoff }, OR: [{ transcript: { not: null } }, { recordingUrl: { not: null } }] },
      data: { transcript: null, recordingUrl: null },
    }).catch((error) => this.logger.warn(`Voice transcript retention cleanup failed: ${error.message}`));
  }

  private async failStaleRingingCalls() {
    const cutoff = new Date(Date.now() - 2 * 60 * 1000);
    await this.prisma.voiceCall.updateMany({
      where: { status: 'RINGING', startedAt: null, createdAt: { lt: cutoff } },
      data: { status: 'FAILED', summary: 'Voice worker did not confirm the call connection', endedAt: new Date(), completedAt: new Date() },
    }).catch((error) => this.logger.warn(`Stale voice call cleanup failed: ${error.message}`));
  }

  async onModuleDestroy() {
    if (this.retentionTimer) clearInterval(this.retentionTimer);
    if (this.staleCallTimer) clearInterval(this.staleCallTimer);
    await Promise.all([this.worker?.close(), this.queue?.close()]);
  }
}

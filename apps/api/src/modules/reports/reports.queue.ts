import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Job, Queue, Worker } from 'bullmq';
import { ReportsWorker } from './reports.worker';

interface ReportJobPayload { tenantId: string; parameters: any }

@Injectable()
export class ReportsQueue implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ReportsQueue.name);
  private queue?: Queue<ReportJobPayload>;
  private worker?: Worker<ReportJobPayload>;

  constructor(private readonly config: ConfigService, private readonly processor: ReportsWorker) {}

  async onModuleInit() {
    const connection = {
      host: this.config.get<string>('REDIS_HOST', '127.0.0.1'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      password: this.config.get<string>('REDIS_PASSWORD') || undefined,
      maxRetriesPerRequest: null,
    };
    this.queue = new Queue<ReportJobPayload>('billpilot-reports', { connection });
    this.worker = new Worker<ReportJobPayload>(
      'billpilot-reports',
      (job) => this.processor.processReportJob(job.id!, job.data.tenantId, job.data.parameters),
      { connection, concurrency: 3 },
    );
    this.worker.on('failed', (job, error) => this.logger.error(`Report job ${job?.id} failed: ${error.message}`));
  }

  async enqueue(jobId: string, tenantId: string, parameters: any) {
    if (!this.queue) throw new Error('Report queue is not ready');
    const job = await this.queue.add('generate', { tenantId, parameters }, {
      jobId,
      attempts: 4,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: { count: 500 },
      removeOnFail: false,
    });
    return job.id;
  }

  async onModuleDestroy() {
    await Promise.all([this.worker?.close(), this.queue?.close()]);
  }
}

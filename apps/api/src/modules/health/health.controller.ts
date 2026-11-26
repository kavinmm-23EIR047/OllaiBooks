import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { ConfigService } from '@nestjs/config';

@Controller('api/v1/health')
export class HealthController {
  private readonly startTime = Date.now();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) { }

  @Get('liveness')
  liveness(@Res() res: Response) {
    return res.status(HttpStatus.OK).send('OK');
  }

  @Get()
  async getHealth() {
    let dbStatus = 'healthy';
    let dbLatencyMs = 0;

    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - start;
    } catch (err: any) {
      dbStatus = `unhealthy: ${err.message}`;
    }

    const memory = process.memoryUsage();
    const nvidiaKey =
      this.config.get<string>('NVIDIA_NIM_API_KEY') ||
      this.config.get<string>('NVIDIA_API_KEY');

    return {
      status: dbStatus === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        provider: 'PostgreSQL',
      },
      ai: {
        provider: 'NVIDIA NIM',
        configured: Boolean(nvidiaKey && nvidiaKey.length > 5),
        model: this.config.get<string>('NVIDIA_CHAT_MODEL') || this.config.get<string>('NVIDIA_NIM_MODEL', 'meta/llama-3.3-70b-instruct'),
        embeddingModel: this.config.get<string>('NVIDIA_EMBEDDING_MODEL', 'nvidia/nemotron-3.5-embed-1b'),
      },
      system: {
        memory: {
          rssMb: Math.round(memory.rss / 1024 / 1024),
          heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
        },
        nodeVersion: process.version,
        environment: this.config.get<string>('NODE_ENV', 'development'),
      },
    };
  }
}


import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateReportInput, ReportFilterQuery } from './reports.types';

@Injectable()
export class ReportsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(tenantId: string, filter: ReportFilterQuery) {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const { type, status } = filter;
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (type) where.reportType = type;
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.reportJob.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          createdByUser: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      }),
      this.prisma.reportJob.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(tenantId: string, id: string) {
    return this.prisma.reportJob.findFirst({
      where: { id, tenantId },
      include: {
        createdByUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async createJob(tenantId: string, userId: string | undefined, input: CreateReportInput) {
    return this.prisma.reportJob.create({
      data: {
        tenantId,
        createdByUserId: userId,
        reportType: input.reportType as any,
        format: input.format as any,
        parameters: input as any,
        status: 'PENDING',
      },
    });
  }

  async updateJobStatus(id: string, data: { status: any; fileUrl?: string; errorMessage?: string; fileSizeBytes?: number; completedAt?: Date; expiresAt?: Date }) {
    return this.prisma.reportJob.update({
      where: { id },
      data,
    });
  }

  createAudit(tenantId: string, userId: string | undefined, action: string, entityId: string, details?: any) {
    return this.prisma.auditLog.create({ data: { tenantId, userId, action, entityType: 'report', entityId, details } });
  }
}

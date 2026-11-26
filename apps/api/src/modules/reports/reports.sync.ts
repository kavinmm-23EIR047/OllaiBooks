import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportsSync {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Syncs and recalculates monthly usage metrics for the tenant's report snapshot
   */
  async syncTenantUsageSnapshot(tenantId: string) {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const [invoiceCount, ordersCount] = await Promise.all([
      this.prisma.invoice.count({
        where: {
          tenantId,
          createdAt: {
            gte: new Date(year, month - 1, 1),
            lte: new Date(year, month, 0, 23, 59, 59),
          },
        },
      }),
      this.prisma.order.count({
        where: {
          tenantId,
          createdAt: {
            gte: new Date(year, month - 1, 1),
            lte: new Date(year, month, 0, 23, 59, 59),
          },
        },
      }),
    ]);

    await this.prisma.usageRecord.create({
      data: {
        tenantId,
        metric: 'INVOICES',
        quantity: invoiceCount,
        year,
        month,
      },
    });

    return { tenantId, year, month, invoiceCount, ordersCount, syncedAt: new Date() };
  }
}

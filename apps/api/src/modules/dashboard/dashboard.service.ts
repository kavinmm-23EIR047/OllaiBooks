import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CacheService } from '../../common/cache.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
  ) {}

  async getTenantSummary(tenantId: string) {
    const cacheKey = this.cache.tenantKey(tenantId, 'dashboard', 'summary');

    return this.cache.wrap(cacheKey, 30, async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        ordersToday,
        invoicesToday,
        totalRevenue,
        totalCollected,
        totalOutstanding,
        recentOrders,
        recentInvoices,
        connectedWebsites,
      ] = await Promise.all([
        this.prisma.order.count({ where: { tenantId, orderDate: { gte: today } } }),
        this.prisma.invoice.count({ where: { tenantId, issueDate: { gte: today } } }),
        this.prisma.invoice.aggregate({ where: { tenantId }, _sum: { grandTotal: true } }),
        this.prisma.payment.aggregate({ where: { tenantId, status: 'PAID' }, _sum: { amount: true } }),
        this.prisma.invoice.aggregate({ where: { tenantId }, _sum: { balanceDue: true } }),
        this.prisma.order.findMany({
          where: { tenantId },
          take: 5,
          orderBy: { orderDate: 'desc' },
          include: { customer: true, website: true },
        }),
        this.prisma.invoice.findMany({
          where: { tenantId },
          take: 5,
          orderBy: { issueDate: 'desc' },
          include: { customer: true },
        }),
        this.prisma.connectedWebsite.findMany({
          where: { tenantId },
          take: 5,
        }),
      ]);

      return {
        metrics: {
          ordersToday,
          invoicesToday,
          totalBilled: Number(totalRevenue._sum.grandTotal || 0),
          totalCollected: Number(totalCollected._sum.amount || 0),
          totalOutstanding: Number(totalOutstanding._sum.balanceDue || 0),
        },
        recentOrders,
        recentInvoices,
        connectedWebsites,
      };
    });
  }
}

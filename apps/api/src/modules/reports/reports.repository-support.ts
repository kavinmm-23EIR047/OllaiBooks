import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportsRepositorySupport {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aggregate metrics for verification and instant sales overview
   */
  async getAggregatedMetrics(tenantId: string, startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = startDate;
    if (endDate) dateFilter.lte = endDate;

    const whereInvoice: any = { tenantId };
    const wherePayment: any = { tenantId, status: 'PAID' };

    if (startDate || endDate) {
      whereInvoice.issueDate = dateFilter;
      wherePayment.paymentDate = dateFilter;
    }

    const [invoices, payments, orderCount] = await Promise.all([
      this.prisma.invoice.aggregate({
        where: whereInvoice,
        _sum: {
          grandTotal: true,
          cgstTotal: true,
          sgstTotal: true,
          igstTotal: true,
          taxTotal: true,
          balanceDue: true,
          paidAmount: true,
        },
        _count: {
          id: true,
        },
      }),
      this.prisma.payment.aggregate({
        where: wherePayment,
        _sum: {
          amount: true,
        },
        _count: {
          id: true,
        },
      }),
      this.prisma.order.count({
        where: { tenantId, ...(startDate || endDate ? { orderDate: dateFilter } : {}) },
      }),
    ]);

    return {
      totalInvoicesCount: invoices._count.id || 0,
      totalOrdersCount: orderCount || 0,
      totalBilled: Number(invoices._sum.grandTotal || 0),
      totalTax: Number(invoices._sum.taxTotal || 0),
      cgstTotal: Number(invoices._sum.cgstTotal || 0),
      sgstTotal: Number(invoices._sum.sgstTotal || 0),
      igstTotal: Number(invoices._sum.igstTotal || 0),
      totalCollected: Number(payments._sum.amount || 0),
      totalOutstanding: Number(invoices._sum.balanceDue || 0),
    };
  }

  /**
   * Fetch invoice records for CSV/Excel export and verification
   */
  async getInvoiceRegisterData(tenantId: string, params: any) {
    return this.prisma.invoice.findMany({
      where: {
        tenantId,
        ...(params.startDate || params.endDate
          ? {
              issueDate: {
                ...(params.startDate ? { gte: new Date(params.startDate) } : {}),
                ...(params.endDate ? { lte: new Date(params.endDate) } : {}),
              },
            }
          : {}),
      },
      include: {
        customer: { select: { name: true, phone: true, email: true, gstin: true } },
        items: true,
      },
      orderBy: { issueDate: 'desc' },
    });
  }
}

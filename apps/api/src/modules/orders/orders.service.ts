import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async listOrders(tenantId: string, filter: any = {}) {
    const page = Math.max(1, Number.parseInt(String(filter?.page ?? '1'), 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(String(filter?.limit ?? '20'), 10) || 20));
    const { status, search } = filter || {};
    const skip = Math.max(0, (page - 1) * limit);

    const where: any = { tenantId };
    if (status) where.orderStatus = status;
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { orderDate: 'desc' },
        include: {
          customer: true,
          items: true,
          website: true,
          invoice: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getOrderById(tenantId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
      include: {
        customer: true,
        items: true,
        website: true,
        invoice: true,
      },
    });

    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async generateInvoiceFromOrder(tenantId: string, orderId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const order = await tx.order.findFirst({ where: { id: orderId, tenantId }, include: { items: true, invoice: true } });
        if (!order) throw new NotFoundException('Order not found');
        if (order.invoice) return order.invoice;
        const business = await tx.businessProfile.findUnique({ where: { tenantId } });
        if (!business || [business.legalName, business.email, business.phone, business.streetAddress, business.city, business.state, business.postalCode].some((field) => !field?.trim())) throw new BadRequestException('Complete the business profile before issuing invoices');
        const profile = await tx.businessProfile.update({ where: { tenantId }, data: { invoiceNextNumber: { increment: 1 } }, select: { invoicePrefix: true, invoiceNextNumber: true } });
        const invoiceNumber = `${profile.invoicePrefix}${profile.invoiceNextNumber - 1}`;
        const tax = new Prisma.Decimal(order.taxTotal).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        const cgst = tax.dividedBy(2).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        const sgst = tax.minus(cgst).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
        const isPaid = order.paymentStatus === 'PAID';
        const invoice = await tx.invoice.create({
          data: {
            tenantId, customerId: order.customerId, invoiceNumber, currency: order.currency,
            invoiceType: 'TAX_INVOICE', dueDate: new Date(Date.now() + 15 * 86400000),
            subtotal: order.subtotal, taxTotal: tax, cgstTotal: cgst, sgstTotal: sgst,
            igstTotal: 0, shipping: order.shippingTotal, discountTotal: order.discountTotal,
            grandTotal: order.total, balanceDue: isPaid ? 0 : order.total,
            paidAmount: isPaid ? order.total : 0, status: isPaid ? 'PAID' : 'ISSUED',
            items: { create: order.items.map((item) => {
              const itemTax = new Prisma.Decimal(item.taxAmount).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
              const itemCgst = itemTax.dividedBy(2).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
              return { productId: item.productId, name: item.name, sku: item.sku, quantity: item.quantity, unitPrice: item.unitPrice, discount: item.discount, taxRate: item.taxRate, cgstAmount: itemCgst, sgstAmount: itemTax.minus(itemCgst), igstAmount: 0, total: item.total };
            }) },
          }, include: { items: true, customer: true },
        });
        const linked = await tx.order.updateMany({ where: { id: order.id, tenantId, invoiceId: null }, data: { invoiceId: invoice.id } });
        if (linked.count !== 1) throw new Prisma.PrismaClientKnownRequestError('Order invoice link raced', { code: 'P2002', clientVersion: Prisma.prismaVersion.client });
        await tx.auditLog.create({ data: { tenantId, action: 'INVOICE_GENERATED_FROM_ORDER', entityType: 'invoice', entityId: invoice.id, details: { orderId: order.id, invoiceNumber } } });
        return invoice;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const order = await this.prisma.order.findFirst({ where: { id: orderId, tenantId }, select: { invoiceId: true } });
        if (order?.invoiceId) return this.prisma.invoice.findFirst({ where: { id: order.invoiceId, tenantId }, include: { items: true, customer: true } });
      }
      throw error;
    }
  }
}

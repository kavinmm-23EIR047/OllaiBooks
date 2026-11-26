import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { Logger } from '@nestjs/common';
import { VoiceCallQueue } from '../voice-agent/voice-call.queue';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  constructor(private readonly prisma: PrismaService, private readonly voiceCalls: VoiceCallQueue) {}

  async recordPayment(tenantId: string, userId: string, dto: any, idempotencyKey: string) {
    if (!idempotencyKey || idempotencyKey.length > 128) throw new BadRequestException('A valid Idempotency-Key header is required');
    const existing = await this.prisma.payment.findFirst({ where: { tenantId, idempotencyKey } });
    if (existing) return existing;

    const amount = new Prisma.Decimal(String(dto.amount)).toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
    if (!amount.gt(0)) throw new BadRequestException('Payment amount must be greater than zero');
    const invoice = await this.prisma.invoice.findFirst({ where: { id: dto.invoiceId, tenantId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (!['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status)) {
      throw new BadRequestException('Payments can only be recorded against an issued invoice');
    }

    try {
      const payment = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.invoice.updateMany({
          where: { id: invoice.id, tenantId, status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] }, balanceDue: { gte: amount } },
          data: { balanceDue: { decrement: amount }, paidAmount: { increment: amount } },
        });
        if (updated.count !== 1) throw new BadRequestException('Payment exceeds the remaining balance or invoice state changed');

        const fresh = await tx.invoice.findFirstOrThrow({ where: { id: invoice.id, tenantId }, select: { balanceDue: true, customerId: true } });
        const status = fresh.balanceDue.isZero() ? 'PAID' : 'PARTIALLY_PAID';
        await tx.invoice.update({ where: { id: invoice.id }, data: { status } });
        const payment = await tx.payment.create({
          data: {
            tenantId,
            invoiceId: invoice.id,
            customerId: fresh.customerId,
            paymentNumber: `PAY-${randomUUID()}`,
            idempotencyKey,
            amount,
            currency: invoice.currency,
            paymentMethod: dto.paymentMethod || 'UPI',
            gatewayTransactionId: dto.gatewayTransactionId,
            paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
            notes: dto.notes,
            status: 'PAID',
            verifiedByUserId: userId,
          },
        });
        await tx.auditLog.create({
          data: {
            tenantId, userId, action: 'PAYMENT_RECORDED', entityType: 'payment', entityId: payment.id,
            details: { invoiceId: invoice.id, amount: amount.toFixed(2), currency: invoice.currency, method: dto.paymentMethod || 'UPI' },
          },
        });
        return payment;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      const paidInvoice = await this.prisma.invoice.findFirst({ where: { id: invoice.id, tenantId, status: 'PAID' }, select: { id: true, status: true } });
      if (paidInvoice?.status === 'PAID') {
        await this.voiceCalls.cancelCallsForInvoice(tenantId, paidInvoice.id).catch((error) => this.logger.warn(`Could not remove queued calls for paid invoice ${paidInvoice.id}: ${error.message}`));
      }
      return payment;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const duplicate = await this.prisma.payment.findFirst({ where: { tenantId, idempotencyKey } });
        if (duplicate) return duplicate;
      }
      throw error;
    }
  }

  async listPayments(tenantId: string, pageValue?: string, limitValue?: string) {
    const page = Math.max(1, Number.parseInt(pageValue || '', 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(limitValue || '', 10) || 20));
    const where = { tenantId };
    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { paymentDate: 'desc' },
        include: { invoice: { select: { invoiceNumber: true, grandTotal: true } }, customer: { select: { name: true, phone: true } } },
      }),
      this.prisma.payment.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}

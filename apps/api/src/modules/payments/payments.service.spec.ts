import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PaymentsService } from './payments.service';

describe('payment recording', () => {
  it('records a partial payment and updates invoice balance in one transaction', async () => {
    const tx: any = {
      invoice: { updateMany: jest.fn().mockResolvedValue({ count: 1 }), findFirstOrThrow: jest.fn().mockResolvedValue({ balanceDue: new Prisma.Decimal('60.00'), customerId: 'c1' }), update: jest.fn() },
      payment: { create: jest.fn().mockResolvedValue({ id: 'pay-1', amount: new Prisma.Decimal('40.00') }) },
      auditLog: { create: jest.fn() },
    };
    const prisma: any = { payment: { findFirst: jest.fn().mockResolvedValue(null) }, invoice: { findFirst: jest.fn().mockResolvedValue({ id: 'i1', status: 'ISSUED', balanceDue: new Prisma.Decimal('100.00'), currency: 'INR' }) }, $transaction: jest.fn((callback) => callback(tx)) };
    const mockVoiceCalls: any = { enqueueCall: jest.fn() };
    const service = new PaymentsService(prisma, mockVoiceCalls);
    await service.recordPayment('tenant-a', 'user-a', { invoiceId: 'i1', amount: '40', paymentMethod: 'UPI' }, 'key-1');
    expect(tx.invoice.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-a', balanceDue: { gte: new Prisma.Decimal('40.00') } }) }));
    expect(tx.invoice.update).toHaveBeenCalledWith({ where: { id: 'i1' }, data: { status: 'PARTIALLY_PAID' } });
    expect(tx.payment.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ tenantId: 'tenant-a', status: 'PAID', verifiedByUserId: 'user-a' }) }));
  });

  it('rejects an overpayment when the guarded balance update affects no invoice', async () => {
    const tx: any = { invoice: { updateMany: jest.fn().mockResolvedValue({ count: 0 }) } };
    const prisma: any = { payment: { findFirst: jest.fn().mockResolvedValue(null) }, invoice: { findFirst: jest.fn().mockResolvedValue({ id: 'i1', status: 'ISSUED', balanceDue: new Prisma.Decimal('10.00') }) }, $transaction: jest.fn((callback) => callback(tx)) };
    const mockVoiceCalls: any = { enqueueCall: jest.fn() };
    const service = new PaymentsService(prisma, mockVoiceCalls);
    await expect(service.recordPayment('tenant-a', 'user-a', { invoiceId: 'i1', amount: '11' }, 'key-2')).rejects.toBeInstanceOf(BadRequestException);
  });
});

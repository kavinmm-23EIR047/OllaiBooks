import { Prisma } from '@prisma/client';
import { OrdersService } from './orders.service';

describe('order invoice generation', () => {
  it('allocates a unique sequence value and stores decimal tax splits in the workspace currency', async () => {
    const order: any = { id: 'order-a', tenantId: 'tenant-a', invoiceId: null, customerId: 'customer-a', currency: 'INR', subtotal: new Prisma.Decimal('100'), taxTotal: new Prisma.Decimal('18'), shippingTotal: new Prisma.Decimal('0'), discountTotal: new Prisma.Decimal('0'), total: new Prisma.Decimal('118'), paymentStatus: 'PENDING', items: [{ productId: 'product-a', name: 'Consulting', sku: 'SVC', quantity: 1, unitPrice: new Prisma.Decimal('100'), discount: new Prisma.Decimal('0'), taxRate: new Prisma.Decimal('18'), taxAmount: new Prisma.Decimal('18'), total: new Prisma.Decimal('118') }] };
    const tx: any = {
      order: { findFirst: jest.fn().mockResolvedValue(order), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
      businessProfile: { update: jest.fn().mockResolvedValue({ invoicePrefix: 'INV-', invoiceNextNumber: 101 }), findUnique: jest.fn().mockResolvedValue({ legalName: 'Acme', email: 'billing@acme.test', phone: '+911234567890', streetAddress: '1 Main Road', city: 'Chennai', state: 'Tamil Nadu', postalCode: '600001' }) },
      invoice: { create: jest.fn().mockResolvedValue({ id: 'invoice-a', invoiceNumber: 'INV-100', currency: 'INR' }) },
      auditLog: { create: jest.fn() },
    };
    const prisma: any = { $transaction: jest.fn((callback) => callback(tx)) };
    const service = new OrdersService(prisma);
    await service.generateInvoiceFromOrder('tenant-a', 'order-a');
    const invoice = tx.invoice.create.mock.calls[0][0].data;
    expect(invoice.invoiceNumber).toBe('INV-100');
    expect(invoice.currency).toBe('INR');
    expect(invoice.cgstTotal.toFixed(2)).toBe('9.00');
    expect(invoice.sgstTotal.toFixed(2)).toBe('9.00');
    expect(tx.order.updateMany).toHaveBeenCalledWith({ where: { id: 'order-a', tenantId: 'tenant-a', invoiceId: null }, data: { invoiceId: 'invoice-a' } });
  });

  it('returns the existing invoice on retries', async () => {
    const linked = { id: 'invoice-a' };
    const tx: any = { order: { findFirst: jest.fn().mockResolvedValue({ id: 'order-a', invoiceId: 'invoice-a', invoice: linked }) } };
    const service = new OrdersService({ $transaction: jest.fn((callback) => callback(tx)) } as any);
    await expect(service.generateInvoiceFromOrder('tenant-a', 'order-a')).resolves.toBe(linked);
  });
});

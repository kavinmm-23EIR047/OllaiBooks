import { Prisma } from '@prisma/client';
import { InvoicesService } from './invoices.service';

describe('invoice financial calculations', () => {
  it('uses decimal rounding and allocates local tax without binary floating point', async () => {
    const tx: any = { product: { findFirst: jest.fn().mockResolvedValue({ id: 'p1', name: 'Service', sku: 'S1', unitPrice: new Prisma.Decimal('19.99'), taxRate: new Prisma.Decimal('18'), isTaxInclusive: false, isArchived: false }) } };
    const service = new InvoicesService({} as any);
    const result = await (service as any).calculateItems(tx, 'tenant-a', [{ productId: 'p1', quantity: 3 }], new Prisma.Decimal('0'), false);
    expect(result.subtotal.toFixed(2)).toBe('59.97');
    expect(result.cgstTotal.toFixed(2)).toBe('5.40');
    expect(result.sgstTotal.toFixed(2)).toBe('5.39');
    expect(result.taxTotal.toFixed(2)).toBe('10.79');
    expect(result.items[0].total.toFixed(2)).toBe('70.76');
    expect(tx.product.findFirst).toHaveBeenCalledWith({ where: { id: 'p1', tenantId: 'tenant-a', isArchived: false } });
  });

  it('rejects a product id that is not owned by the current tenant', async () => {
    const tx: any = { product: { findFirst: jest.fn().mockResolvedValue(null) } };
    const service = new InvoicesService({} as any);
    await expect((service as any).calculateItems(tx, 'tenant-a', [{ productId: 'other-tenant-product', quantity: 1 }], new Prisma.Decimal('0'), false)).rejects.toThrow('Product not found in this workspace');
  });
});

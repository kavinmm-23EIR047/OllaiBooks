import { z } from 'zod';

const money = z.union([
  z.string().trim().regex(/^\d{1,10}(\.\d{1,2})?$/),
  z.number().finite().nonnegative().max(9999999999),
]);

export const InvoiceItemInputSchema = z.object({
  productId: z.string().uuid().optional(),
  name: z.string().trim().max(160).optional(),
  sku: z.string().trim().max(80).optional(),
  hsnCode: z.string().trim().max(24).optional(),
  quantity: z.number().int().min(1).max(100000),
  unitPrice: money.optional(),
  taxRate: z.number().finite().min(0).max(100).optional(),
  discount: money.optional(),
});

export const InvoiceInputSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime().optional(),
  notes: z.string().trim().max(2000).optional(),
  paymentTerms: z.string().trim().max(500).optional(),
  shipping: money.optional(),
  discountTotal: money.optional(),
  isInterstate: z.boolean().default(false),
  items: z.array(InvoiceItemInputSchema).min(1).max(100),
});

export const CreditNoteInputSchema = z.object({
  amount: money,
  reason: z.string().trim().min(3).max(500),
});

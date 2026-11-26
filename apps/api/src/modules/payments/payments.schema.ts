import { z } from 'zod';

export const PaymentInputSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.union([
    z.string().trim().regex(/^\d{1,10}(\.\d{1,2})?$/),
    z.number().finite().positive().max(9999999999),
  ]),
  paymentMethod: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'PAYMENT_GATEWAY', 'OTHER']).default('UPI'),
  gatewayTransactionId: z.string().trim().max(160).optional(),
  notes: z.string().trim().max(500).optional(),
  paymentDate: z.string().datetime().optional(),
});

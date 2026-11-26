import { z } from 'zod';

export const ProductInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  sku: z.string().trim().min(1).max(80),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  unit: z.string().trim().min(1).max(24).default('unit'),
  unitPrice: z.number().finite().nonnegative().max(9999999999),
  currency: z.string().trim().regex(/^[A-Z]{3}$/).default('INR'),
  taxRate: z.number().finite().min(0).max(100).default(0),
  taxCategory: z.string().trim().max(40).optional().or(z.literal('')),
  hsnCode: z.string().trim().max(24).optional().or(z.literal('')),
  isTaxInclusive: z.boolean().default(false),
});

export const ProductUpdateSchema = ProductInputSchema.partial();

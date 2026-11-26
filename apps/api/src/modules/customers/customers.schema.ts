import { z } from 'zod';

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(''));

export const CustomerInputSchema = z.object({
  name: z.string().trim().min(1).max(160),
  email: z.string().trim().email().max(254).optional().or(z.literal('')),
  phone: optionalText(40),
  gstin: optionalText(20),
  billingStreet: optionalText(200),
  billingCity: optionalText(100),
  billingState: optionalText(100),
  billingPostalCode: optionalText(20),
  preferredLanguage: z.string().trim().min(2).max(12).default('en'),
  tags: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
});

export const CustomerUpdateSchema = CustomerInputSchema.partial();
export type CustomerInput = z.infer<typeof CustomerInputSchema>;
export type CustomerUpdate = z.infer<typeof CustomerUpdateSchema>;

import { z } from 'zod';

const money = z.union([
  z.string().trim().regex(/^\d{1,10}(\.\d{1,2})?$/),
  z.number().finite().nonnegative().max(9999999999),
]);

export const ConnectWebsiteSchema = z.object({
  name: z.string().trim().min(1).max(120),
  domain: z.string().trim().min(3).max(253).regex(/^[a-z0-9.-]+$/i),
  platform: z.enum(['CUSTOM', 'SHOPIFY', 'WOOCOMMERCE', 'WORDPRESS', 'MAGENTO', 'API']).default('CUSTOM'),
});

export const WebsiteOrderSchema = z.object({
  eventId: z.string().trim().min(1).max(180),
  externalOrderId: z.string().trim().min(1).max(180),
  currency: z.string().trim().regex(/^[A-Z]{3}$/),
  customer: z.object({
    name: z.string().trim().min(1).max(160),
    email: z.string().trim().email().max(254).optional(),
    phone: z.string().trim().max(40).optional(),
    address: z.string().trim().max(200).optional(),
    city: z.string().trim().max(100).optional(),
    state: z.string().trim().min(2).max(100),
  }).refine((customer) => customer.email || customer.phone, 'Customer email or phone is required'),
  items: z.array(z.object({
    sku: z.string().trim().min(1).max(80),
    quantity: z.number().int().min(1).max(100000),
  })).min(1).max(100),
  shipping: money.optional(),
});

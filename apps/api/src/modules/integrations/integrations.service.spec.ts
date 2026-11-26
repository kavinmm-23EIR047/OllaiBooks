import { createHmac } from 'crypto';
import { IntegrationsService } from './integrations.service';
import { WebsiteOrderSchema } from './integrations.schema';

describe('website order webhook', () => {
  it('validates external order structure and rejects a missing mapped SKU', () => {
    const valid = { eventId: 'evt-1', externalOrderId: 'order-1', currency: 'INR', customer: { name: 'Test', email: 't@example.com', state: 'Tamil Nadu' }, items: [{ sku: 'KNOWN', quantity: 1 }] };
    expect(WebsiteOrderSchema.safeParse(valid).success).toBe(true);
    expect(WebsiteOrderSchema.safeParse({ ...valid, items: [{ sku: '', quantity: 0 }] }).success).toBe(false);
  });

  it('ignores a correctly signed duplicate before opening a financial transaction', async () => {
    const secretKey = 'ab'.repeat(32);
    const secret = 'whsec-test-secret';
    const prisma: any = {
      connectedWebsite: { findFirst: jest.fn(), update: jest.fn() },
      webhookEvent: { findUnique: jest.fn().mockResolvedValue({ externalEventId: 'existing-order' }) },
      $transaction: jest.fn(),
    };
    const config: any = { get: jest.fn((key: string) => key === 'INTEGRATION_ENCRYPTION_KEY' ? secretKey : undefined) };
    const service = new IntegrationsService(prisma, config);
    prisma.connectedWebsite.findFirst.mockResolvedValue({ id: 'website-a', tenantId: 'tenant-a', status: 'ACTIVE', webhookSecretEncrypted: (service as any).encryptSecret(secret) });
    const payload = { eventId: 'event-a', externalOrderId: 'external-a', currency: 'INR', customer: { name: 'Customer', email: 'c@example.com', state: 'Tamil Nadu' }, items: [{ sku: 'SKU-1', quantity: 1 }] };
    const rawBody = Buffer.from(JSON.stringify(payload));
    const signature = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;
    await expect(service.processWebhookOrder('website-a', signature, rawBody, payload)).resolves.toEqual({ status: 'DUPLICATE_IGNORED', orderId: 'existing-order' });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

import { BadRequestException, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createCipheriv, createDecipheriv, createHmac, randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import { isInterstateSupply } from '../../common/gst-state.util';

const roundMoney = (value: Prisma.Decimal) => value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
const amount = (value: string | number | Prisma.Decimal | undefined) => new Prisma.Decimal(String(value ?? 0));

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async listWebsites(tenantId: string) {
    return this.prisma.connectedWebsite.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, name: true, domain: true, platform: true, status: true,
        lastSyncAt: true, lastWebhookAt: true, failedEventsCount: true, totalOrdersSynced: true,
        createdAt: true, _count: { select: { orders: true, webhookEvents: true } },
      },
    });
  }

  async connectWebsite(tenantId: string, userId: string, dto: { name: string; domain: string; platform: any }) {
    const apiKey = `bp_live_${randomBytes(16).toString('hex')}`;
    const apiSecret = `sec_${randomBytes(32).toString('hex')}`;
    const webhookSecret = `whsec_${randomBytes(32).toString('hex')}`;
    const website = await this.prisma.connectedWebsite.create({
      data: {
        tenantId,
        name: dto.name,
        domain: dto.domain.toLowerCase(),
        platform: dto.platform || 'CUSTOM',
        apiKey,
        apiSecretHash: createHmac('sha256', this.requireEncryptionKey()).update(apiSecret).digest('hex'),
        webhookSecretEncrypted: this.encryptSecret(webhookSecret),
        status: 'ACTIVE',
      },
      select: { id: true, name: true, domain: true, platform: true, status: true, createdAt: true },
    });
    await this.prisma.auditLog.create({
      data: { tenantId, userId, action: 'INTEGRATION_CONNECTED', entityType: 'website', entityId: website.id, details: { domain: website.domain, platform: website.platform } },
    });
    const baseUrl = this.config.get<string>('APP_BASE_URL', 'http://localhost:4000');
    return {
      website,
      credentials: { apiKey, apiSecret, webhookSecret, webhookUrl: `${baseUrl}/api/v1/integrations/webhooks/${website.id}` },
      warning: 'Save these credentials now. The secrets are shown only once.',
    };
  }

  async rotateWebhookSecret(tenantId: string, userId: string, websiteId: string) {
    const existing = await this.prisma.connectedWebsite.findFirst({ where: { id: websiteId, tenantId } });
    if (!existing) throw new NotFoundException('Website integration not found');
    const secret = `whsec_${randomBytes(32).toString('hex')}`;
    await this.prisma.connectedWebsite.update({
      where: { id: websiteId }, data: { webhookSecretEncrypted: this.encryptSecret(secret) },
    });
    await this.prisma.auditLog.create({
      data: { tenantId, userId, action: 'INTEGRATION_SECRET_ROTATED', entityType: 'website', entityId: websiteId },
    });
    return { webhookSecret: secret, warning: 'The new secret is shown only once. Update the sender before retrying events.' };
  }

  async processWebhookOrder(websiteId: string, signature: string, rawBody: Buffer | undefined, payload: any) {
    const website = await this.prisma.connectedWebsite.findFirst({ where: { id: websiteId, status: 'ACTIVE' } });
    if (!website) throw new NotFoundException('Active website integration not found');
    if (!rawBody || !signature) throw new UnauthorizedException('Signed webhook request required');
    const secret = this.decryptSecret(website.webhookSecretEncrypted);
    const expectedHex = createHmac('sha256', secret).update(rawBody).digest('hex');
    const suppliedHex = signature.replace(/^sha256=/i, '').trim().toLowerCase();
    const expected = Buffer.from(expectedHex, 'hex');
    const supplied = /^[a-f0-9]{64}$/.test(suppliedHex) ? Buffer.from(suppliedHex, 'hex') : Buffer.alloc(0);
    if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
      await this.prisma.connectedWebsite.update({ where: { id: website.id }, data: { failedEventsCount: { increment: 1 } } }).catch(() => undefined);
      throw new UnauthorizedException('Webhook signature is invalid');
    }

    const eventKey = `${website.id}:${payload.eventId}`;
    const duplicate = await this.prisma.webhookEvent.findUnique({ where: { idempotencyKey: eventKey } });
    if (duplicate) return { status: 'DUPLICATE_IGNORED', orderId: duplicate.externalEventId };

    try {
      return await this.prisma.$transaction(async (tx) => {
        const tenant = await tx.tenant.findUniqueOrThrow({ where: { id: website.tenantId }, select: { currency: true } });
        if (tenant.currency !== payload.currency) throw new BadRequestException('Order currency does not match the connected workspace');
        const profile = await tx.businessProfile.findUnique({ where: { tenantId: website.tenantId } });
        if (!profile) throw new BadRequestException('Business invoice settings are not configured');
        if ([profile.legalName, profile.email, profile.phone, profile.streetAddress, profile.city, profile.state, profile.postalCode].some((field) => !field?.trim())) throw new BadRequestException('Complete the business profile before importing invoiced orders');

        const products = [] as Array<{ product: any; quantity: number; subtotal: Prisma.Decimal; tax: Prisma.Decimal }>;
        for (const item of payload.items) {
          const product = await tx.product.findFirst({ where: { tenantId: website.tenantId, sku: item.sku, isArchived: false } });
          if (!product) throw new BadRequestException(`SKU ${item.sku} is not mapped to an active workspace product`);
          const lineSubtotal = roundMoney(product.unitPrice.times(item.quantity));
          const lineTax = roundMoney(lineSubtotal.times(product.taxRate).dividedBy(100));
          products.push({ product, quantity: item.quantity, subtotal: lineSubtotal, tax: lineTax });
        }
        const subtotal = roundMoney(products.reduce((sum, line) => sum.plus(line.subtotal), amount(0)));
        const taxTotal = roundMoney(products.reduce((sum, line) => sum.plus(line.tax), amount(0)));
        const shipping = roundMoney(amount(payload.shipping));
        const total = roundMoney(subtotal.plus(taxTotal).plus(shipping));
        if (total.lte(0)) throw new BadRequestException('Order total must be greater than zero');

        let customer = await tx.customer.findFirst({
          where: {
            tenantId: website.tenantId,
            OR: [
              ...(payload.customer.email ? [{ email: payload.customer.email }] : []),
              ...(payload.customer.phone ? [{ phone: payload.customer.phone }] : []),
            ],
          },
        });
        if (!customer) {
          customer = await tx.customer.create({
            data: {
              tenantId: website.tenantId,
              name: payload.customer.name,
              email: payload.customer.email,
              phone: payload.customer.phone,
              billingStreet: payload.customer.address,
              billingCity: payload.customer.city,
              billingState: payload.customer.state,
            },
          });
        }
        const customerState = payload.customer.state || customer.billingState || '';
        if (!customerState) throw new BadRequestException('Customer billing state is required to calculate invoice tax');
        const isInterstate = isInterstateSupply(profile.state, profile.gstin, customerState, customer.gstin);

        const order = await tx.order.create({
          data: {
            tenantId: website.tenantId,
            websiteId: website.id,
            customerId: customer.id,
            externalOrderId: payload.externalOrderId,
            orderNumber: `WEB-${randomUUID()}`,
            subtotal, discountTotal: amount(0), taxTotal, shippingTotal: shipping, total,
            currency: tenant.currency,
            paymentStatus: 'PENDING', // Website claims are not proof of payment.
            orderStatus: 'CONFIRMED',
            rawPayload: { externalOrderId: payload.externalOrderId, eventId: payload.eventId, skuCount: products.length },
            items: {
              create: products.map(({ product, quantity, subtotal: lineSubtotal, tax }) => ({
                productId: product.id, name: product.name, sku: product.sku, quantity,
                unitPrice: product.unitPrice, taxRate: product.taxRate, taxAmount: tax,
                total: roundMoney(lineSubtotal.plus(tax)),
              })),
            },
          },
          include: { items: true },
        });

        const allocated = await tx.businessProfile.update({
          where: { tenantId: website.tenantId }, data: { invoiceNextNumber: { increment: 1 } },
          select: { invoicePrefix: true, invoiceNextNumber: true },
        });
        const invoice = await tx.invoice.create({
          data: {
            tenantId: website.tenantId, customerId: customer.id,
            invoiceNumber: `${allocated.invoicePrefix}${allocated.invoiceNextNumber - 1}`,
            currency: tenant.currency, invoiceType: 'TAX_INVOICE',
            dueDate: new Date(Date.now() + 15 * 86400000),
            subtotal, discountTotal: amount(0),
            cgstTotal: isInterstate ? amount(0) : roundMoney(taxTotal.dividedBy(2)), sgstTotal: isInterstate ? amount(0) : roundMoney(taxTotal.minus(roundMoney(taxTotal.dividedBy(2)))),
            igstTotal: isInterstate ? taxTotal : amount(0), taxTotal, shipping, grandTotal: total,
            balanceDue: total, status: 'ISSUED',
            items: { create: order.items.map((item) => ({
              productId: item.productId, name: item.name, sku: item.sku, quantity: item.quantity,
              unitPrice: item.unitPrice, discount: item.discount, taxRate: item.taxRate,
              cgstAmount: isInterstate ? amount(0) : roundMoney(item.taxAmount.dividedBy(2)),
              sgstAmount: isInterstate ? amount(0) : roundMoney(item.taxAmount.minus(roundMoney(item.taxAmount.dividedBy(2)))),
              igstAmount: isInterstate ? item.taxAmount : amount(0), total: item.total,
            })) },
          },
        });
        await tx.order.update({ where: { id: order.id }, data: { invoiceId: invoice.id } });
        await tx.webhookEvent.create({
          data: {
            tenantId: website.tenantId, websiteId: website.id, eventType: 'order.created',
            externalEventId: order.id, idempotencyKey: eventKey,
            payload: { eventId: payload.eventId, externalOrderId: payload.externalOrderId },
            status: 'PROCESSED', processedAt: new Date(),
          },
        });
        await tx.connectedWebsite.update({
          where: { id: website.id },
          data: { lastSyncAt: new Date(), lastWebhookAt: new Date(), totalOrdersSynced: { increment: 1 } },
        });
        await tx.auditLog.create({
          data: {
            tenantId: website.tenantId, action: 'WEB_ORDER_IMPORTED', entityType: 'order', entityId: order.id,
            details: { invoiceId: invoice.id, websiteId: website.id, externalOrderId: payload.externalOrderId },
          },
        });
        return { status: 'ACCEPTED', orderId: order.id, invoiceId: invoice.id };
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const existingOrder = await this.prisma.order.findFirst({ where: { websiteId: website.id, externalOrderId: payload.externalOrderId }, select: { id: true, invoiceId: true } });
        if (existingOrder) return { status: 'DUPLICATE_IGNORED', orderId: existingOrder.id, invoiceId: existingOrder.invoiceId };
      }
      this.logger.warn(`Website order webhook failed for integration ${website.id}`);
      throw error;
    }
  }

  private requireEncryptionKey() {
    const value = this.config.get<string>('INTEGRATION_ENCRYPTION_KEY') || '';
    if (!/^[a-f0-9]{64}$/i.test(value)) throw new BadRequestException('INTEGRATION_ENCRYPTION_KEY must be configured as 32-byte hex');
    return Buffer.from(value, 'hex');
  }

  private encryptSecret(secret: string) {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.requireEncryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), encrypted].map((buffer) => buffer.toString('base64')).join('.');
  }

  private decryptSecret(value: string) {
    try {
      const [ivValue, tagValue, cipherValue] = value.split('.');
      const decipher = createDecipheriv('aes-256-gcm', this.requireEncryptionKey(), Buffer.from(ivValue, 'base64'));
      decipher.setAuthTag(Buffer.from(tagValue, 'base64'));
      return Buffer.concat([decipher.update(Buffer.from(cipherValue, 'base64')), decipher.final()]).toString('utf8');
    } catch {
      throw new UnauthorizedException('Webhook credentials cannot be verified');
    }
  }
}

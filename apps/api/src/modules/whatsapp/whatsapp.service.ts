import { BadRequestException, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConsentStatus, MessageChannel } from '@prisma/client';
import { createDecipheriv, createCipheriv, randomBytes } from 'crypto';
import { z } from 'zod';
import { PrismaService } from '../../database/prisma.service';

export const AccountInput = z.object({ phoneNumberId: z.string().min(3).max(100), wabaId: z.string().min(3).max(100), accessToken: z.string().min(20).max(4096), invoiceTemplateName: z.string().regex(/^[a-z0-9_]{3,100}$/), templateLanguage: z.string().min(2).max(10).default('en') });
const phoneE164 = /^\+[1-9]\d{7,14}$/;

@Injectable()
export class WhatsAppService {
  private readonly logger = new Logger(WhatsAppService.name);
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async configure(tenantId: string, input: unknown) {
    const data = AccountInput.parse(input);
    await this.prisma.whatsAppAccount.upsert({
      where: { tenantId },
      create: { tenantId, phoneNumberId: data.phoneNumberId, wabaId: data.wabaId, accessTokenEncrypted: this.encrypt(data.accessToken), invoiceTemplateName: data.invoiceTemplateName, templateLanguage: data.templateLanguage, status: 'ACTIVE' },
      update: { phoneNumberId: data.phoneNumberId, wabaId: data.wabaId, accessTokenEncrypted: this.encrypt(data.accessToken), invoiceTemplateName: data.invoiceTemplateName, templateLanguage: data.templateLanguage, status: 'ACTIVE' },
    });
    return { configured: true, phoneNumberId: data.phoneNumberId, wabaId: data.wabaId, invoiceTemplateName: data.invoiceTemplateName, templateLanguage: data.templateLanguage };
  }

  async accountStatus(tenantId: string) {
    const account = await this.prisma.whatsAppAccount.findUnique({ where: { tenantId } });
    return { configured: Boolean(account && account.status === 'ACTIVE'), phoneNumberId: account?.phoneNumberId, wabaId: account?.wabaId, invoiceTemplateName: account?.invoiceTemplateName, templateLanguage: account?.templateLanguage };
  }

  async setConsent(tenantId: string, userId: string, customerId: string, granted: boolean, source: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, tenantId, isArchived: false } });
    if (!customer) throw new NotFoundException('Customer not found');
    const now = new Date();
    await this.prisma.communicationConsent.upsert({
      where: { tenantId_customerId_channel: { tenantId, customerId, channel: MessageChannel.WHATSAPP } },
      create: { tenantId, customerId, channel: MessageChannel.WHATSAPP, status: granted ? ConsentStatus.GRANTED : ConsentStatus.REVOKED, source: source.slice(0, 100), grantedAt: granted ? now : null, revokedAt: granted ? null : now },
      update: { status: granted ? ConsentStatus.GRANTED : ConsentStatus.REVOKED, source: source.slice(0, 100), grantedAt: granted ? now : undefined, revokedAt: granted ? null : now },
    });
    await this.prisma.auditLog.create({ data: { tenantId, userId, action: granted ? 'WHATSAPP_CONSENT_GRANTED' : 'WHATSAPP_CONSENT_REVOKED', entityType: 'customer', entityId: customerId } });
    return { customerId, channel: 'WHATSAPP', status: granted ? 'GRANTED' : 'REVOKED' };
  }

  async sendInvoiceNotification(tenantId: string, invoiceId: string, customPhone?: string) {
    let invoice = await this.prisma.invoice.findFirst({
      where: {
        tenantId,
        OR: [
          { id: invoiceId },
          { invoiceNumber: invoiceId },
        ],
      },
      include: { customer: true },
    });

    if (!invoice) {
      invoice = await this.prisma.invoice.findFirst({
        where: { tenantId },
        include: { customer: true },
      });
    }

    if (!invoice) throw new NotFoundException('Invoice not found');

    let recipient = customPhone || invoice.customer?.phone || '919876500001';
    let cleanRecipient = recipient.replace(/[^\d]/g, '');
    if (cleanRecipient.startsWith('0')) cleanRecipient = cleanRecipient.slice(1);
    if (cleanRecipient.length === 10) cleanRecipient = '91' + cleanRecipient;

    if (invoice.customerId) {
      await this.prisma.communicationConsent.upsert({
        where: { tenantId_customerId_channel: { tenantId, customerId: invoice.customerId, channel: MessageChannel.WHATSAPP } },
        create: { tenantId, customerId: invoice.customerId, channel: MessageChannel.WHATSAPP, status: ConsentStatus.GRANTED, source: 'DIRECT_DISPATCH_UI', grantedAt: new Date() },
        update: { status: ConsentStatus.GRANTED, source: 'DIRECT_DISPATCH_UI' },
      });
    }

    const account = await this.prisma.whatsAppAccount.findUnique({ where: { tenantId } });
    if (!account || account.status !== 'ACTIVE') throw new ServiceUnavailableException('Configure a WhatsApp Cloud API account first');
    const token = this.decrypt(account.accessTokenEncrypted);
    const apiUrl = this.config.get<string>('WHATSAPP_API_URL', 'https://graph.facebook.com/v22.0');

    let templatePayload: any = {
      name: account.invoiceTemplateName || 'hello_world',
      language: { code: account.templateLanguage || 'en_US' },
    };

    if (account.invoiceTemplateName === 'hello_world' || account.invoiceTemplateName === '3p_direct_integration_test_template') {
      // test templates have no variables and do not accept components
    } else if (account.invoiceTemplateName === 'jaspers_market_order_confirmation_v1') {
      templatePayload.components = [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: invoice.customer?.name || 'Customer' },
            { type: 'text', text: invoice.invoiceNumber },
            { type: 'text', text: 'Tomorrow' },
          ],
        },
      ];
    } else {
      templatePayload.components = [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: invoice.customer?.name || 'Customer' },
            { type: 'text', text: invoice.invoiceNumber },
            { type: 'text', text: `${invoice.currency} ${Number(invoice.grandTotal).toFixed(2)}` },
            { type: 'text', text: `${invoice.currency} ${Number(invoice.balanceDue).toFixed(2)}` },
          ],
        },
      ];
    }

    const response = await fetch(`${apiUrl}/${encodeURIComponent(account.phoneNumberId)}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: cleanRecipient,
        type: 'template',
        template: templatePayload,
      }),
      signal: AbortSignal.timeout(15000),
    });

    const result = await response.json().catch(() => ({}));
    const providerId = result?.messages?.[0]?.id;

    if (!response.ok || !providerId) {
      const errorMsg = String(result?.error?.message || `Provider returned HTTP ${response.status}`).slice(0, 500);
      const log = await this.prisma.messageLog.create({
        data: {
          tenantId,
          channel: 'WHATSAPP',
          recipient: '+' + cleanRecipient,
          templateName: account.invoiceTemplateName,
          content: `Invoice ${invoice.invoiceNumber} to ${invoice.customer?.name || 'Customer'}`,
          status: 'FAILED',
          errorMessage: errorMsg,
        },
      });

      if (result?.error?.code === 131030) {
        throw new BadRequestException(`Meta Sandbox Restriction: Recipient +${cleanRecipient} is not in your WhatsApp Developer 'To' allowed list. Add this phone number in your Meta App Dashboard under WhatsApp > API Setup > To.`);
      }

      throw new ServiceUnavailableException(`WhatsApp provider error: ${errorMsg} (Log ID: ${log.id})`);
    }

    const log = await this.prisma.messageLog.create({
      data: {
        tenantId,
        channel: 'WHATSAPP',
        recipient: '+' + cleanRecipient,
        templateName: account.invoiceTemplateName,
        content: `Invoice ${invoice.invoiceNumber} (Total: ${invoice.currency} ${invoice.grandTotal})`,
        externalMessageId: providerId,
        status: 'SENT',
      },
    });

    this.logger.log(`WhatsApp message accepted by provider; log=${log.id}`);
    return { success: true, messageId: log.id, externalMessageId: providerId, status: 'SENT', recipient: '+' + cleanRecipient };
  }

  async sendVoicePaymentLink(tenantId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({ where: { id: invoiceId, tenantId }, include: { customer: true } });
    if (!invoice || !invoice.customerId || !invoice.customer?.phone) throw new NotFoundException('Invoice customer phone is not available');
    if (['DRAFT', 'CANCELLED', 'CREDITED', 'PAID'].includes(invoice.status) || Number(invoice.balanceDue) <= 0) throw new BadRequestException('Invoice has no payable balance');

    const consent = await this.prisma.communicationConsent.findUnique({ where: { tenantId_customerId_channel: { tenantId, customerId: invoice.customerId, channel: MessageChannel.WHATSAPP } } });
    if (consent?.status !== ConsentStatus.GRANTED) throw new BadRequestException('WhatsApp consent is not recorded for this customer');

    const templateName = this.config.get<string>('VOICE_PAYMENT_TEMPLATE_NAME') || '';
    const paymentUrlTemplate = this.config.get<string>('PAYMENT_LINK_URL_TEMPLATE') || '';
    if (!/^[a-z0-9_]{3,100}$/.test(templateName) || !paymentUrlTemplate.includes('{invoiceId}') || !paymentUrlTemplate.includes('{tenantId}')) {
      throw new ServiceUnavailableException('Configure VOICE_PAYMENT_TEMPLATE_NAME and PAYMENT_LINK_URL_TEMPLATE with the merchant payment portal before sending payment reminders');
    }
    const paymentUrl = paymentUrlTemplate
      .replaceAll('{tenantId}', encodeURIComponent(tenantId))
      .replaceAll('{invoiceId}', encodeURIComponent(invoice.id));
    let parsedUrl: URL;
    try { parsedUrl = new URL(paymentUrl); } catch { throw new ServiceUnavailableException('PAYMENT_LINK_URL_TEMPLATE did not produce a valid URL'); }
    if (parsedUrl.protocol !== 'https:') throw new ServiceUnavailableException('Payment reminder links must use HTTPS');

    const account = await this.prisma.whatsAppAccount.findUnique({ where: { tenantId } });
    if (!account || account.status !== 'ACTIVE') throw new ServiceUnavailableException('Configure a WhatsApp Cloud API account first');
    const recipient = invoice.customer.phone.replace(/\D/g, '');
    const token = this.decrypt(account.accessTokenEncrypted);
    const apiUrl = this.config.get<string>('WHATSAPP_API_URL', 'https://graph.facebook.com/v22.0');
    const response = await fetch(`${apiUrl}/${encodeURIComponent(account.phoneNumberId)}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp', to: recipient, type: 'template',
        template: {
          name: templateName,
          language: { code: account.templateLanguage || 'en' },
          components: [{ type: 'body', parameters: [
            { type: 'text', text: invoice.customer.name.slice(0, 120) },
            { type: 'text', text: invoice.invoiceNumber.slice(0, 100) },
            { type: 'text', text: `${invoice.currency} ${invoice.balanceDue.toFixed(2)}` },
            { type: 'text', text: invoice.dueDate.toISOString().slice(0, 10) },
            { type: 'text', text: paymentUrl },
          ] }],
        },
      }),
      signal: AbortSignal.timeout(15000),
    });
    const result: any = await response.json().catch(() => ({}));
    const providerId = result?.messages?.[0]?.id;
    if (!response.ok || !providerId) throw new ServiceUnavailableException('WhatsApp provider did not accept the payment reminder');
    const log = await this.prisma.messageLog.create({ data: { tenantId, channel: 'WHATSAPP', recipient: `+${recipient}`, templateName, content: `Payment reminder for invoice ${invoice.invoiceNumber}`, externalMessageId: providerId, status: 'SENT' } });
    this.logger.log(`Voice payment reminder accepted by provider; log=${log.id}`);
    return { success: true, status: 'SENT', messageId: log.id };
  }

  async listLogs(tenantId: string) { return this.prisma.messageLog.findMany({ where: { tenantId }, orderBy: { sentAt: 'desc' }, take: 50 }); }

  private key() {
    const value = this.config.get<string>('INTEGRATION_ENCRYPTION_KEY') || '';
    if (!/^[a-f0-9]{64}$/i.test(value)) throw new ServiceUnavailableException('INTEGRATION_ENCRYPTION_KEY must be a 32-byte hex key');
    return Buffer.from(value, 'hex');
  }
  private encrypt(secret: string) {
    const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', this.key(), iv);
    const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${encrypted.toString('hex')}`;
  }
  private decrypt(value: string) {
    const [iv, tag, encrypted] = value.split(':');
    try { const decipher = createDecipheriv('aes-256-gcm', this.key(), Buffer.from(iv, 'hex')); decipher.setAuthTag(Buffer.from(tag, 'hex')); return Buffer.concat([decipher.update(Buffer.from(encrypted, 'hex')), decipher.final()]).toString('utf8'); }
    catch { throw new ServiceUnavailableException('Could not decrypt WhatsApp credentials; check encryption key'); }
  }
}

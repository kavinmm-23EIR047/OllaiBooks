import { Injectable, NotFoundException, GoneException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class InvoiceShareService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  async create(tenantId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({ where: { id: invoiceId, tenantId, status: { notIn: ['DRAFT', 'CANCELLED'] } } });
    if (!invoice) throw new NotFoundException('Issued invoice not found');
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    await this.prisma.invoiceShare.create({
      data: { tenantId, invoiceId, tokenHash: createHash('sha256').update(token).digest('hex'), expiresAt },
    });
    const apiUrl = this.config.get<string>('APP_BASE_URL', 'http://localhost:4000').replace(/\/$/, '');
    return `${apiUrl}/api/v1/public/invoices/${token}/pdf`;
  }

  async resolve(token: string) {
    if (!/^[A-Za-z0-9_-]{40,50}$/.test(token)) throw new NotFoundException('Invoice share not found');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const share = await this.prisma.invoiceShare.findUnique({ where: { tokenHash } });
    if (!share) throw new NotFoundException('Invoice share not found');
    if (share.expiresAt.getTime() <= Date.now()) throw new GoneException('Invoice share has expired');
    await this.prisma.invoiceShare.update({ where: { id: share.id }, data: { accessedAt: new Date() } });
    return { tenantId: share.tenantId, invoiceId: share.invoiceId };
  }
}

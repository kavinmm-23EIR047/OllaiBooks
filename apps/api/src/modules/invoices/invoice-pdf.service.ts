import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

const printable = (value: unknown) => String(value ?? '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^\x20-\x7E]/g, '?')
  .replace(/[\\()]/g, (character) => `\\${character}`);

function makePdf(pages: string[][]): Buffer {
  const objects = new Map<number, string>();
  const pageIds = pages.map((_, index) => 4 + index * 2);
  objects.set(1, '<< /Type /Catalog /Pages 2 0 R >>');
  objects.set(2, `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`);
  objects.set(3, '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');

  pages.forEach((lines, index) => {
    const pageId = pageIds[index];
    const contentId = pageId + 1;
    const text = [
      'BT', '/F1 10 Tf', '50 790 Td', '14 TL',
      ...lines.flatMap((line) => [`(${printable(line)}) Tj`, 'T*']),
      'ET',
    ].join('\n');
    const length = Buffer.byteLength(text, 'ascii');
    objects.set(pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
    objects.set(contentId, `<< /Length ${length} >>\nstream\n${text}\nendstream`);
  });

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  const lastId = 3 + pages.length * 2;
  for (let id = 1; id <= lastId; id += 1) {
    offsets.push(Buffer.byteLength(pdf, 'ascii'));
    pdf += `${id} 0 obj\n${objects.get(id)}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf, 'ascii');
  pdf += `xref\n0 ${lastId + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${lastId + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'ascii');
}

@Injectable()
export class InvoicePdfService {
  constructor(private readonly prisma: PrismaService) {}

  async generate(tenantId: string, userId: string | undefined, invoiceId: string): Promise<Buffer> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
      include: { customer: true, items: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    const profile = await this.prisma.businessProfile.findUnique({ where: { tenantId } });
    if (!profile) throw new NotFoundException('Business invoice profile is not configured');
    const fmt = (value: unknown) => `${invoice.currency} ${Number(value || 0).toFixed(2)}`;
    const lines = [
      profile.tradeName || profile.legalName,
      profile.legalName,
      `${profile.streetAddress}, ${profile.city}, ${profile.state} ${profile.postalCode}`,
      `GSTIN: ${profile.gstin || 'Not configured'}    Email: ${profile.email}`,
      '',
      `TAX INVOICE ${invoice.invoiceNumber}`,
      `Status: ${invoice.status}    Issue date: ${invoice.issueDate.toISOString().slice(0, 10)}    Due: ${invoice.dueDate.toISOString().slice(0, 10)}`,
      `Bill to: ${invoice.customer?.name || 'Walk-in customer'}`,
      `Email: ${invoice.customer?.email || '-'}    Phone: ${invoice.customer?.phone || '-'}`,
      '',
      'QTY  SKU        DESCRIPTION                         UNIT PRICE      TAX       TOTAL',
      ...invoice.items.map((item) => `${String(item.quantity).padEnd(4)} ${String(item.sku || '-').slice(0, 10).padEnd(10)} ${String(item.name).slice(0, 32).padEnd(32)} ${fmt(item.unitPrice).padStart(14)} ${String(item.taxRate)}% ${fmt(item.total)}`),
      '',
      `Subtotal: ${fmt(invoice.subtotal)}`,
      `Discount: ${fmt(invoice.discountTotal)}`,
      `CGST: ${fmt(invoice.cgstTotal)}    SGST: ${fmt(invoice.sgstTotal)}    IGST: ${fmt(invoice.igstTotal)}`,
      `Shipping: ${fmt(invoice.shipping)}`,
      `Grand total: ${fmt(invoice.grandTotal)}`,
      `Paid: ${fmt(invoice.paidAmount)}    Balance due: ${fmt(invoice.balanceDue)}`,
      '',
      `Payment terms: ${invoice.paymentTerms || '-'}`,
      `Notes: ${invoice.notes || '-'}`,
      `Business address: ${profile.streetAddress}, ${profile.city}, ${profile.state} ${profile.postalCode}`,
    ];
    const perPage = 48;
    const pages: string[][] = [];
    for (let offset = 0; offset < lines.length; offset += perPage) pages.push(lines.slice(offset, offset + perPage));
    const buffer = makePdf(pages);
    await this.prisma.auditLog.create({
      data: { tenantId, userId, action: userId ? 'INVOICE_PDF_DOWNLOADED' : 'INVOICE_PDF_SHARED', entityType: 'invoice', entityId: invoice.id },
    });
    return buffer;
  }
}

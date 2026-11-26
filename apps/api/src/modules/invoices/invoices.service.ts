import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InvoiceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

type ItemInput = {
  productId?: string;
  name?: string;
  sku?: string;
  hsnCode?: string;
  quantity: number;
  unitPrice?: string | number;
  taxRate?: number;
  discount?: string | number;
};
type InvoiceInput = {
  customerId?: string | null;
  dueDate?: string;
  notes?: string;
  paymentTerms?: string;
  shipping?: string | number;
  discountTotal?: string | number;
  isInterstate: boolean;
  items: ItemInput[];
};

const decimal = (value: string | number | Prisma.Decimal | null | undefined) =>
  new Prisma.Decimal(String(value ?? 0));
const cents = (value: Prisma.Decimal) => value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async listInvoices(tenantId: string, filter: any = {}) {
    const page = Math.max(1, Number.parseInt(filter.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(filter.limit, 10) || 20));
    const where: Prisma.InvoiceWhereInput = { tenantId };
    if (filter.status) where.status = filter.status;
    if (typeof filter.search === 'string' && filter.search.trim()) {
      const search = filter.search.trim().slice(0, 100);
      where.OR = [
        { invoiceNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where, skip: (page - 1) * limit, take: limit,
        orderBy: { issueDate: 'desc' },
        include: { customer: true, items: true, payments: true },
      }),
      this.prisma.invoice.count({ where }),
    ]);
    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async createManualInvoice(tenantId: string, userId: string, dto: InvoiceInput, idempotencyKey: string) {
    if (!idempotencyKey || idempotencyKey.length > 128) {
      throw new BadRequestException('A valid Idempotency-Key header is required');
    }
    const existing = await this.prisma.invoice.findFirst({ where: { tenantId, idempotencyKey } });
    if (existing) return existing;

    const profile = await this.prisma.businessProfile.findUnique({ where: { tenantId } });
    if (!profile) throw new BadRequestException('Business invoice settings are not configured');
    let customerState = profile.state;
    if (dto.customerId) {
      const customer = await this.prisma.customer.findFirst({ where: { id: dto.customerId, tenantId, isArchived: false } });
      if (!customer) throw new NotFoundException('Customer not found');
      customerState = customer.billingState || profile.state;
    }
    const isInterstate = customerState.trim().toLocaleLowerCase() !== profile.state.trim().toLocaleLowerCase();

    try {
      return await this.prisma.$transaction(async (tx) => {
      const lineItems = await this.calculateItems(tx, tenantId, dto.items, decimal(dto.discountTotal), isInterstate);
      const shipping = cents(decimal(dto.shipping));
      const grandTotal = cents(lineItems.subtotal.plus(lineItems.taxTotal).plus(shipping));
      if (grandTotal.lte(0)) throw new BadRequestException('Invoice total must be greater than zero');

      // The atomic UPDATE is the per-tenant number allocator; concurrent requests get distinct values.
      const allocatedProfile = await tx.businessProfile.update({
        where: { tenantId },
        data: { invoiceNextNumber: { increment: 1 } },
        select: { invoicePrefix: true, invoiceNextNumber: true },
      });
      const invoiceNumber = `${allocatedProfile.invoicePrefix}${allocatedProfile.invoiceNextNumber - 1}`;
      const invoice = await tx.invoice.create({
        data: {
          tenantId,
          customerId: dto.customerId || null,
          invoiceNumber,
          idempotencyKey,
          currency: profile.tenantId ? (await tx.tenant.findUniqueOrThrow({ where: { id: tenantId }, select: { currency: true } })).currency : 'INR',
          invoiceType: 'TAX_INVOICE',
          dueDate: dto.dueDate ? new Date(dto.dueDate) : new Date(Date.now() + 15 * 86400000),
          subtotal: lineItems.subtotal,
          discountTotal: lineItems.discountTotal,
          cgstTotal: lineItems.cgstTotal,
          sgstTotal: lineItems.sgstTotal,
          igstTotal: lineItems.igstTotal,
          taxTotal: lineItems.taxTotal,
          shipping,
          grandTotal,
          balanceDue: grandTotal,
          status: 'DRAFT',
          notes: dto.notes,
          paymentTerms: dto.paymentTerms || 'Due in 15 days',
          items: { create: lineItems.items },
        },
        include: { items: true, customer: true },
      });
      await tx.auditLog.create({
        data: { tenantId, userId, action: 'INVOICE_DRAFT_CREATED', entityType: 'invoice', entityId: invoice.id, details: { invoiceNumber } },
      });
      return invoice;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const duplicate = await this.prisma.invoice.findFirst({ where: { tenantId, idempotencyKey } });
        if (duplicate) return duplicate;
      }
      throw error;
    }
  }

  async updateDraft(tenantId: string, userId: string, id: string, dto: InvoiceInput) {
    const invoice = await this.getInvoiceById(tenantId, id);
    if (invoice.status !== 'DRAFT') throw new BadRequestException('Only draft invoices can be edited');
    const profile = await this.prisma.businessProfile.findUnique({ where: { tenantId } });
    if (!profile) throw new BadRequestException('Business invoice settings are not configured');
    let customerState = profile.state;
    if (dto.customerId) {
      const customer = await this.prisma.customer.findFirst({ where: { id: dto.customerId, tenantId, isArchived: false } });
      if (!customer) throw new NotFoundException('Customer not found');
      customerState = customer.billingState || profile.state;
    }
    const isInterstate = customerState.trim().toLocaleLowerCase() !== profile.state.trim().toLocaleLowerCase();
    return this.prisma.$transaction(async (tx) => {
      const lineItems = await this.calculateItems(tx, tenantId, dto.items, decimal(dto.discountTotal), isInterstate);
      const shipping = cents(decimal(dto.shipping));
      const grandTotal = cents(lineItems.subtotal.plus(lineItems.taxTotal).plus(shipping));
      if (grandTotal.lte(0)) throw new BadRequestException('Invoice total must be greater than zero');
      await tx.invoiceItem.deleteMany({ where: { invoiceId: id } });
      const updated = await tx.invoice.update({
        where: { id },
        data: {
          customerId: dto.customerId || null,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : invoice.dueDate,
          notes: dto.notes,
          paymentTerms: dto.paymentTerms,
          subtotal: lineItems.subtotal,
          discountTotal: lineItems.discountTotal,
          cgstTotal: lineItems.cgstTotal,
          sgstTotal: lineItems.sgstTotal,
          igstTotal: lineItems.igstTotal,
          taxTotal: lineItems.taxTotal,
          shipping,
          grandTotal,
          balanceDue: grandTotal,
          items: { create: lineItems.items },
        },
        include: { items: true, customer: true },
      });
      await tx.auditLog.create({ data: { tenantId, userId, action: 'INVOICE_DRAFT_UPDATED', entityType: 'invoice', entityId: id } });
      return updated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async issueInvoice(tenantId: string, userId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({ where: { id, tenantId } });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.status !== 'DRAFT') throw new BadRequestException('Only a draft invoice can be issued');
    const profile = await this.prisma.businessProfile.findUnique({ where: { tenantId } });
    if (!profile || [profile.legalName, profile.email, profile.phone, profile.streetAddress, profile.city, profile.state, profile.postalCode].some((field) => !field?.trim())) {
      throw new BadRequestException('Complete the business profile before issuing invoices');
    }
    return this.prisma.$transaction(async (tx) => {
      const issued = await tx.invoice.updateMany({
        where: { id, tenantId, status: 'DRAFT' },
        data: { status: 'ISSUED', issueDate: new Date() },
      });
      if (issued.count !== 1) throw new BadRequestException('Invoice state changed; reload and try again');
      await tx.auditLog.create({ data: { tenantId, userId, action: 'INVOICE_ISSUED', entityType: 'invoice', entityId: id } });
      return tx.invoice.findFirstOrThrow({ where: { id, tenantId }, include: { items: true, customer: true } });
    });
  }

  async createCreditNote(tenantId: string, userId: string, invoiceId: string, amountInput: string | number, reason: string) {
    const amount = cents(decimal(amountInput));
    if (amount.lte(0)) throw new BadRequestException('Credit note amount must be greater than zero');
    return this.prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findFirst({ where: { id: invoiceId, tenantId } });
      if (!invoice || invoice.status === 'DRAFT' || invoice.status === 'CANCELLED') throw new NotFoundException('Issued invoice not found');
      const issuedCredits = await tx.creditNote.aggregate({ where: { tenantId, invoiceId, status: 'ISSUED' }, _sum: { amount: true } });
      const remaining = cents(invoice.grandTotal.minus(issuedCredits._sum.amount || 0));
      if (amount.gt(remaining)) throw new BadRequestException('Credit note exceeds the uncredited invoice total');
      const profile = await tx.businessProfile.update({ where: { tenantId }, data: { creditNoteNextNumber: { increment: 1 } } });
      const creditNote = await tx.creditNote.create({
        data: {
          tenantId, invoiceId,
          creditNoteNumber: `${profile.creditNotePrefix}${profile.creditNoteNextNumber - 1}`,
          amount, reason, status: 'ISSUED',
        },
      });
      const balanceDue = cents(Prisma.Decimal.max(0, invoice.balanceDue.minus(amount)));
      const status: InvoiceStatus = amount.eq(remaining) ? 'CREDITED' : invoice.status;
      await tx.invoice.update({ where: { id: invoiceId }, data: { balanceDue, status } });
      await tx.auditLog.create({
        data: { tenantId, userId, action: 'CREDIT_NOTE_ISSUED', entityType: 'credit_note', entityId: creditNote.id, details: { invoiceId, amount: amount.toFixed(2) } },
      });
      return creditNote;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async getInvoiceById(tenantId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: { customer: true, items: true, payments: true, creditNotes: true, order: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    return invoice;
  }

  private async calculateItems(tx: Prisma.TransactionClient, tenantId: string, inputs: ItemInput[], invoiceDiscount: Prisma.Decimal, isInterstate: boolean) {
    const source = [] as Array<{ product: any; input: ItemInput; quantity: Prisma.Decimal; price: Prisma.Decimal; taxRate: Prisma.Decimal; base: Prisma.Decimal; discount: Prisma.Decimal }>;
    for (const input of inputs) {
      const product = input.productId
        ? await tx.product.findFirst({ where: { id: input.productId, tenantId, isArchived: false } })
        : null;
      if (input.productId && !product) throw new NotFoundException('Product not found in this workspace');
      if (!product && (!input.name || input.unitPrice === undefined)) {
        throw new BadRequestException('Each custom line needs a name and unit price');
      }
      const quantity = decimal(input.quantity);
      const price = decimal(product ? product.unitPrice : input.unitPrice);
      const taxRate = decimal(product ? product.taxRate : input.taxRate);
      const gross = price.times(quantity);
      const base = product?.isTaxInclusive && taxRate.gt(0)
        ? cents(gross.dividedBy(decimal(1).plus(taxRate.dividedBy(100))))
        : cents(gross);
      const discount = cents(decimal(input.discount));
      if (discount.gt(base)) throw new BadRequestException('Line discount cannot exceed the line amount');
      source.push({ product, input, quantity, price, taxRate, base, discount });
    }

    const baseSum = source.reduce((sum, item) => sum.plus(item.base), decimal(0));
    if (invoiceDiscount.gt(baseSum)) throw new BadRequestException('Invoice discount cannot exceed the subtotal');
    let allocated = decimal(0);
    let subtotal = decimal(0), cgstTotal = decimal(0), sgstTotal = decimal(0), igstTotal = decimal(0);
    const items = source.map((line, index) => {
      const share = index === source.length - 1
        ? cents(invoiceDiscount.minus(allocated))
        : (baseSum.isZero() ? decimal(0) : cents(invoiceDiscount.times(line.base).dividedBy(baseSum)));
      allocated = allocated.plus(share);
      const taxable = cents(line.base.minus(line.discount).minus(share));
      if (taxable.lt(0)) throw new BadRequestException('Discount exceeds the line subtotal');
      const tax = cents(taxable.times(line.taxRate).dividedBy(100));
      const cgst = isInterstate ? decimal(0) : cents(tax.dividedBy(2));
      const sgst = isInterstate ? decimal(0) : cents(tax.minus(cgst));
      const igst = isInterstate ? tax : decimal(0);
      subtotal = subtotal.plus(taxable);
      cgstTotal = cgstTotal.plus(cgst); sgstTotal = sgstTotal.plus(sgst); igstTotal = igstTotal.plus(igst);
      const discount = line.discount.plus(share);
      return {
        productId: line.product?.id,
        name: line.product?.name || line.input.name,
        sku: line.product?.sku || line.input.sku,
        hsnCode: line.product?.hsnCode || line.input.hsnCode,
        quantity: line.input.quantity,
        unitPrice: line.price,
        discount,
        taxRate: line.taxRate,
        cgstAmount: cgst,
        sgstAmount: sgst,
        igstAmount: igst,
        total: cents(taxable.plus(tax)),
      };
    });
    return {
      items,
      subtotal: cents(subtotal),
      discountTotal: cents(invoiceDiscount.plus(source.reduce((sum, line) => sum.plus(line.discount), decimal(0)))),
      cgstTotal: cents(cgstTotal), sgstTotal: cents(sgstTotal), igstTotal: cents(igstTotal),
      taxTotal: cents(cgstTotal.plus(sgstTotal).plus(igstTotal)),
    };
  }
}

import { Controller, Get, Post, Body, Param, Query, UseGuards, Patch, Headers, StreamableFile } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { TenantGuard } from '../../auth/tenant.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../auth/permissions.guard';
import { CurrentTenantId, CurrentUser } from '../../auth/current-user.decorator';
import { InvoiceShareService } from '../../common/invoice-share.service';
import { InvoiceInputSchema, CreditNoteInputSchema } from './invoices.schema';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { InvoicePdfService } from './invoice-pdf.service';

@Controller('api/v1/invoices')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService, private readonly invoicePdf: InvoicePdfService, private readonly invoiceShare: InvoiceShareService) {}

  @Get()
  @RequirePermissions('invoice:read')
  async listInvoices(
    @CurrentTenantId() tenantId: string,
    @Query() query: any,
  ) {
    return this.invoicesService.listInvoices(tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('invoice:read')
  async getInvoice(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.invoicesService.getInvoiceById(tenantId, id);
  }

  @Get(':id/pdf')
  @RequirePermissions('invoice:read')
  async downloadPdf(@CurrentTenantId() tenantId: string, @CurrentUser() user: any, @Param('id') id: string) {
    return new StreamableFile(await this.invoicePdf.generate(tenantId, user.userId, id), {
      type: 'application/pdf',
      disposition: 'attachment',
    });
  }

  @Post()
  @RequirePermissions('invoice:write')
  async createInvoice(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Headers('idempotency-key') idempotencyKey: string,
    @Body(new ZodValidationPipe(InvoiceInputSchema)) body: any,
  ) {
    return this.invoicesService.createManualInvoice(tenantId, user.userId, body, idempotencyKey);
  }

  @Patch(':id')
  @RequirePermissions('invoice:write')
  async updateDraft(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(InvoiceInputSchema)) body: any,
  ) {
    return this.invoicesService.updateDraft(tenantId, user.userId, id, body);
  }

  @Post(':id/issue')
  @RequirePermissions('invoice:issue')
  async issueInvoice(@CurrentTenantId() tenantId: string, @CurrentUser() user: any, @Param('id') id: string) {
    return this.invoicesService.issueInvoice(tenantId, user.userId, id);
  }

  @Post(':id/credit-notes')
  @RequirePermissions('invoice:credit')
  async issueCreditNote(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(CreditNoteInputSchema)) body: any,
  ) {
    return this.invoicesService.createCreditNote(tenantId, user.userId, id, body.amount, body.reason);
  }

  @Post(':id/share-link')
  @RequirePermissions('invoice:read')
  async createShareLink(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return { url: await this.invoiceShare.create(tenantId, id), expiresInHours: 48 };
  }
}

@Controller('api/v1/public/invoices')
export class PublicInvoicesController {
  constructor(private readonly invoiceShare: InvoiceShareService, private readonly invoicePdf: InvoicePdfService) {}

  @Get(':token/pdf')
  async downloadShared(@Param('token') token: string) {
    const { tenantId, invoiceId } = await this.invoiceShare.resolve(token);
    return new StreamableFile(await this.invoicePdf.generate(tenantId, undefined, invoiceId), { type: 'application/pdf', disposition: 'inline' });
  }
}

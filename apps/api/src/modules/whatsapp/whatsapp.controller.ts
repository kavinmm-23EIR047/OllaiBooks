import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common';
import { WhatsAppService } from './whatsapp.service';
import { TenantGuard } from '../../auth/tenant.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../auth/permissions.guard';
import { CurrentTenantId, CurrentUser } from '../../auth/current-user.decorator';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { AccountInput } from './whatsapp.service';

const SendInvoiceSchema = z.object({
  invoiceId: z.string().trim().min(1).max(100),
  recipientPhone: z.string().trim().min(7).max(25).optional(),
}).strict();
const ConsentSchema = z.object({ granted: z.boolean(), source: z.string().trim().min(1).max(100) }).strict();

@Controller('api/v1/whatsapp')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class WhatsAppController {
  constructor(private readonly whatsappService: WhatsAppService) {}

  @Get('logs')
  @RequirePermissions('communication:read')
  async listLogs(@CurrentTenantId() tenantId: string) {
    return this.whatsappService.listLogs(tenantId);
  }

  @Post('send-invoice')
  @RequirePermissions('communication:send')
  async sendInvoice(@CurrentTenantId() tenantId: string, @Body(new ZodValidationPipe(SendInvoiceSchema)) body: any) {
    return this.whatsappService.sendInvoiceNotification(tenantId, body.invoiceId, body.recipientPhone);
  }

  @Get('account')
  @RequirePermissions('integration:read')
  account(@CurrentTenantId() tenantId: string) { return this.whatsappService.accountStatus(tenantId); }

  @Post('account')
  @RequirePermissions('integration:manage')
  configure(@CurrentTenantId() tenantId: string, @Body(new ZodValidationPipe(AccountInput)) body: any) { return this.whatsappService.configure(tenantId, body); }

  @Post('consent/:customerId')
  @RequirePermissions('customer:write')
  consent(@CurrentTenantId() tenantId: string, @CurrentUser() user: any, @Param('customerId') customerId: string, @Body(new ZodValidationPipe(ConsentSchema)) body: any) {
    return this.whatsappService.setConsent(tenantId, user.userId, customerId, body.granted, body.source);
  }
}

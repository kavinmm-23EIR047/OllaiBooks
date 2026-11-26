import { Controller, Get, Post, Body, UseGuards, Headers, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { TenantGuard } from '../../auth/tenant.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../auth/permissions.guard';
import { CurrentTenantId, CurrentUser } from '../../auth/current-user.decorator';
import { PaymentInputSchema } from './payments.schema';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';

@Controller('api/v1/payments')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @RequirePermissions('payment:read')
  async listPayments(@CurrentTenantId() tenantId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.paymentsService.listPayments(tenantId, page, limit);
  }

  @Post()
  @RequirePermissions('payment:record')
  async recordPayment(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Headers('idempotency-key') idempotencyKey: string,
    @Body(new ZodValidationPipe(PaymentInputSchema)) body: any,
  ) {
    return this.paymentsService.recordPayment(tenantId, user.userId, body, idempotencyKey);
  }
}

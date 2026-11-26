import { Controller, Get, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { TenantGuard } from '../../auth/tenant.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { CurrentTenantId } from '../../auth/current-user.decorator';

@Controller('api/v1/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('current')
  @UseGuards(JwtAuthGuard, TenantGuard)
  async getCurrentSubscription(@CurrentTenantId() tenantId: string) {
    return this.subscriptionsService.getCurrentPlan(tenantId);
  }

  @Get('plans')
  async listPlans() {
    return this.subscriptionsService.getAllPlans();
  }
}

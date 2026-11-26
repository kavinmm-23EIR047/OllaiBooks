import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { TenantGuard } from '../../auth/tenant.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../auth/permissions.guard';
import { CurrentTenantId } from '../../auth/current-user.decorator';

@Controller('api/v1/dashboard')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @RequirePermissions('dashboard:read')
  async getSummary(@CurrentTenantId() tenantId: string) {
    return this.dashboardService.getTenantSummary(tenantId);
  }
}

import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AutomationsService } from './automations.service';
import { TenantGuard } from '../../auth/tenant.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../auth/permissions.guard';
import { CurrentTenantId } from '../../auth/current-user.decorator';
import { WorkflowSchema } from './automations.service';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';

@Controller('api/v1/automations')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class AutomationsController {
  constructor(private readonly automationsService: AutomationsService) {}

  @Get('options')
  @RequirePermissions('automation:read')
  getOptions() {
    return this.automationsService.getOptions();
  }

  @Get()
  @RequirePermissions('automation:read')
  async listWorkflows(@CurrentTenantId() tenantId: string) {
    return this.automationsService.listWorkflows(tenantId);
  }

  @Post()
  @RequirePermissions('automation:write')
  async createWorkflow(@CurrentTenantId() tenantId: string, @Body(new ZodValidationPipe(WorkflowSchema)) body: any) {
    return this.automationsService.createWorkflow(tenantId, body);
  }

  @Post(':id/test')
  @RequirePermissions('automation:write')
  async testWorkflow(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.automationsService.testRunWorkflow(tenantId, id);
  }
}

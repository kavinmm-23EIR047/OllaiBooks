import { Controller, Get, Post, Body, Param, Headers, UseGuards, Req } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { TenantGuard } from '../../auth/tenant.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../auth/permissions.guard';
import { CurrentTenantId, CurrentUser } from '../../auth/current-user.decorator';
import { ConnectWebsiteSchema, WebsiteOrderSchema } from './integrations.schema';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';

@Controller('api/v1/integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('websites')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermissions('integration:read')
  async listWebsites(@CurrentTenantId() tenantId: string) {
    return this.integrationsService.listWebsites(tenantId);
  }

  @Post('websites')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermissions('integration:manage')
  async connectWebsite(@CurrentTenantId() tenantId: string, @CurrentUser() user: any, @Body(new ZodValidationPipe(ConnectWebsiteSchema)) body: any) {
    return this.integrationsService.connectWebsite(tenantId, user.userId, body);
  }

  @Post('websites/:id/rotate-secret')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermissions('integration:manage')
  async rotateSecret(@CurrentTenantId() tenantId: string, @CurrentUser() user: any, @Param('id') id: string) {
    return this.integrationsService.rotateWebhookSecret(tenantId, user.userId, id);
  }

  @Post('webhooks/:websiteId')
  async handleWebhook(
    @Param('websiteId') websiteId: string,
    @Headers('x-billpilot-signature') signature: string,
    @Body(new ZodValidationPipe(WebsiteOrderSchema)) payload: any,
    @Req() request: any,
  ) {
    return this.integrationsService.processWebhookOrder(websiteId, signature, request.rawBody, payload);
  }
}

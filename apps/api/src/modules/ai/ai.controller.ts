import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentTenantId, CurrentUser } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../auth/permissions.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import {
  AiService,
  QuestionSchema,
  InvoiceAnalysisSchema,
  DraftCommunicationSchema,
  VoiceScriptSchema,
  GenerateWorkflowSchema,
  SimulateVoiceCallSchema,
  SmartActionSchema,
} from './ai.service';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';

@Controller('api/v1/ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  @Get('status')
  async getStatus() {
    return this.ai.getStatus();
  }

  @Get('quick-insights')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermissions('ai:use')
  async getQuickInsights(
    @CurrentTenantId() tenantId: string,
    @Query('module') moduleName = 'dashboard',
  ) {
    return this.ai.getQuickInsights(tenantId, moduleName);
  }

  @Post('simulate-order')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermissions('ai:use')
  async simulateOrder(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: any,
  ) {
    return this.ai.simulateOrder(tenantId, user.userId);
  }

  @Post('simulate-voice-call')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermissions('ai:use')
  async simulateVoiceCall(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(SimulateVoiceCallSchema)) body: unknown,
  ) {
    return this.ai.simulateVoiceCall(tenantId, user.userId, body);
  }

  @Post('generate-workflow')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermissions('ai:use')
  async generateWorkflow(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(GenerateWorkflowSchema)) body: unknown,
  ) {
    return this.ai.generateWorkflow(tenantId, user.userId, body);
  }

  @Post('smart-action')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermissions('ai:use')
  async executeSmartAction(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(SmartActionSchema)) body: unknown,
  ) {
    return this.ai.executeSmartAction(tenantId, user.userId, body);
  }

  @Post('assistant')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermissions('ai:use')
  async ask(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(QuestionSchema)) body: unknown,
  ) {
    return this.ai.ask(tenantId, user.userId, body);
  }

  @Post('analyze-invoice')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermissions('ai:use')
  async analyzeInvoice(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(InvoiceAnalysisSchema)) body: unknown,
  ) {
    return this.ai.analyzeInvoice(tenantId, user.userId, body);
  }

  @Post('draft-communication')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermissions('ai:use')
  async draftCommunication(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(DraftCommunicationSchema)) body: unknown,
  ) {
    return this.ai.draftCommunication(tenantId, user.userId, body);
  }

  @Post('audit-anomalies')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermissions('ai:use')
  async auditAnomalies(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: any,
  ) {
    return this.ai.auditAnomalies(tenantId, user.userId);
  }

  @Post('voice-script')
  @UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
  @RequirePermissions('ai:use')
  async generateVoiceScript(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(VoiceScriptSchema)) body: unknown,
  ) {
    return this.ai.generateVoiceScript(tenantId, user.userId, body);
  }
}

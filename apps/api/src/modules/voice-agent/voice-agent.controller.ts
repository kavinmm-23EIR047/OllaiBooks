import { Controller, Get, Post, Body, UseGuards, Patch, Delete, Param, Req } from '@nestjs/common';
import { Request } from 'express';
import { VoiceAgentService } from './voice-agent.service';
import { TenantGuard } from '../../auth/tenant.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../auth/permissions.guard';
import { CurrentTenantId, CurrentUser } from '../../auth/current-user.decorator';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { CreateVoiceCampaignSchema, SaveVoiceAgentConfigSchema, TriggerVoiceCallSchema, TestVoiceCallSchema, VoiceCallEndedSchema, VoiceGetBillSchema, VoiceOutcomeSchema, VoiceConsentSchema, DoNotCallSchema, VoiceWorkerDialFailureSchema } from './voice-agent.schemas';
import { VoiceWebhookGuard } from './voice-webhook.guard';
import { VoiceWorkerGuard } from './voice-worker.guard';

type VoiceWebhookRequest = Request & { voiceTenantId: string; voiceAgentConfigId: string };

@Controller('api/v1/voice-agent')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class VoiceAgentController {
  constructor(private readonly voiceAgentService: VoiceAgentService) {}

  @Get('calls')
  @RequirePermissions('communication:read')
  async listCalls(@CurrentTenantId() tenantId: string) {
    return this.voiceAgentService.listCalls(tenantId);
  }

  @Get('metrics')
  @RequirePermissions('communication:read')
  metrics(@CurrentTenantId() tenantId: string) { return this.voiceAgentService.getMetrics(tenantId); }

  @Get('campaigns')
  @RequirePermissions('communication:read')
  listCampaigns(@CurrentTenantId() tenantId: string) { return this.voiceAgentService.listCampaigns(tenantId); }

  @Post('campaigns/preview')
  @RequirePermissions('communication:send')
  previewCampaign(@CurrentTenantId() tenantId: string, @Body(new ZodValidationPipe(CreateVoiceCampaignSchema)) body: unknown) {
    return this.voiceAgentService.previewCampaign(tenantId, body);
  }

  @Post('campaigns')
  @RequirePermissions('communication:send')
  createCampaign(@CurrentTenantId() tenantId: string, @CurrentUser() user: any, @Body(new ZodValidationPipe(CreateVoiceCampaignSchema)) body: unknown) {
    return this.voiceAgentService.createCampaign(tenantId, user.userId, body);
  }

  @Post('call')
  @RequirePermissions('communication:send')
  async triggerCall(@CurrentTenantId() tenantId: string, @Body(new ZodValidationPipe(TriggerVoiceCallSchema)) body: unknown) {
    return this.voiceAgentService.triggerCall(tenantId, body);
  }

  @Post('test-call')
  @RequirePermissions('communication:send')
  async testCall(@CurrentTenantId() tenantId: string, @Body(new ZodValidationPipe(TestVoiceCallSchema)) body: unknown) {
    return this.voiceAgentService.triggerTestCall(tenantId, body);
  }

  @Post('web-call')
  @RequirePermissions('communication:send')
  startWebCall(@CurrentTenantId() tenantId: string) {
    return this.voiceAgentService.startWebCall(tenantId);
  }

  @Get('config')
  @RequirePermissions('communication:read')
  getConfig(@CurrentTenantId() tenantId: string) { return this.voiceAgentService.getSettings(tenantId); }

  @Patch('config')
  @RequirePermissions('integration:manage')
  saveConfig(@CurrentTenantId() tenantId: string, @CurrentUser() user: any, @Body(new ZodValidationPipe(SaveVoiceAgentConfigSchema)) body: unknown) {
    return this.voiceAgentService.saveSettings(tenantId, user.userId, body);
  }

  @Get('consents')
  @RequirePermissions('communication:read')
  listConsents(@CurrentTenantId() tenantId: string) { return this.voiceAgentService.listContactConsents(tenantId); }

  @Post('consents')
  @RequirePermissions('customer:write')
  setConsent(@CurrentTenantId() tenantId: string, @CurrentUser() user: any, @Body(new ZodValidationPipe(VoiceConsentSchema)) body: unknown) {
    return this.voiceAgentService.setContactConsent(tenantId, user.userId, body);
  }

  @Get('do-not-call')
  @RequirePermissions('communication:read')
  listDoNotCall(@CurrentTenantId() tenantId: string) { return this.voiceAgentService.listDoNotCall(tenantId); }

  @Post('do-not-call')
  @RequirePermissions('customer:write')
  addDoNotCall(@CurrentTenantId() tenantId: string, @Body(new ZodValidationPipe(DoNotCallSchema)) body: unknown) {
    return this.voiceAgentService.addDoNotCall(tenantId, body);
  }

  @Delete('do-not-call/:id')
  @RequirePermissions('customer:write')
  removeDoNotCall(@CurrentTenantId() tenantId: string, @Param('id') id: string) { return this.voiceAgentService.removeDoNotCall(tenantId, id); }
}

@Controller('api/v1/voice/tools')
@UseGuards(VoiceWebhookGuard)
export class VoiceToolsController {
  constructor(private readonly voiceAgentService: VoiceAgentService) {}

  @Post('get-bill')
  getBill(@Body(new ZodValidationPipe(VoiceGetBillSchema)) body: unknown, @Req() request: VoiceWebhookRequest) {
    return this.voiceAgentService.getBillForCall(request.voiceTenantId, request.voiceAgentConfigId, body);
  }

  @Post('send-payment-link')
  sendPaymentLink(@Body(new ZodValidationPipe(VoiceGetBillSchema)) body: unknown, @Req() request: VoiceWebhookRequest) {
    return this.voiceAgentService.sendPaymentLinkForCall(request.voiceAgentConfigId, request.voiceTenantId, body);
  }

  @Post('log-outcome')
  logOutcome(@Body(new ZodValidationPipe(VoiceOutcomeSchema)) body: unknown, @Req() request: VoiceWebhookRequest) {
    return this.voiceAgentService.logVoiceOutcome(request.voiceTenantId, request.voiceAgentConfigId, body);
  }
}

@Controller('api/v1/voice/webhooks')
@UseGuards(VoiceWebhookGuard)
export class VoiceWebhooksController {
  constructor(private readonly voiceAgentService: VoiceAgentService) {}

  @Post('call-ended')
  callEnded(@Body(new ZodValidationPipe(VoiceCallEndedSchema)) body: unknown, @Req() request: VoiceWebhookRequest) {
    return this.voiceAgentService.finishVoiceCall(request.voiceTenantId, request.voiceAgentConfigId, body);
  }
}

@Controller('api/v1/voice/worker')
@UseGuards(VoiceWorkerGuard)
export class VoiceWorkerController {
  constructor(private readonly voiceAgentService: VoiceAgentService) {}

  @Get('calls/:callId/credentials')
  getCallCredentials(@Param('callId') callId: string) {
    return this.voiceAgentService.getWorkerCallCredentials(callId);
  }

  @Post('calls/:callId/answered')
  markCallAnswered(@Param('callId') callId: string) {
    return this.voiceAgentService.markCallAnswered(callId);
  }

  @Post('calls/:callId/dial-failed')
  markCallDialFailed(@Param('callId') callId: string, @Body(new ZodValidationPipe(VoiceWorkerDialFailureSchema)) body: { failureType: 'NO_ANSWER' | 'BUSY' | 'SIP_FAILURE' | 'AGENT_FAILURE' }) {
    return this.voiceAgentService.markCallDialFailed(callId, body.failureType);
  }
}

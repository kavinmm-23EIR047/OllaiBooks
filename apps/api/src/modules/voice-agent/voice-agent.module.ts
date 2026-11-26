import { Module } from '@nestjs/common';
import { VoiceAgentController } from './voice-agent.controller';
import { VoiceAgentService } from './voice-agent.service';
import { VoiceToolsController, VoiceWebhooksController } from './voice-agent.controller';
import { VoiceWebhookGuard } from './voice-webhook.guard';
import { WhatsAppModule } from '../whatsapp/whatsapp.module';
import { VoiceCallExecutor } from './voice-call.executor';
import { VoiceCallQueue } from './voice-call.queue';
import { VoiceWorkerGuard } from './voice-worker.guard';
import { VoiceWorkerController } from './voice-agent.controller';

@Module({
  imports: [WhatsAppModule],
  controllers: [VoiceAgentController, VoiceToolsController, VoiceWebhooksController, VoiceWorkerController],
  providers: [VoiceAgentService, VoiceWebhookGuard, VoiceWorkerGuard, VoiceCallExecutor, VoiceCallQueue],
  exports: [VoiceAgentService, VoiceCallQueue],
})
export class VoiceAgentModule {}

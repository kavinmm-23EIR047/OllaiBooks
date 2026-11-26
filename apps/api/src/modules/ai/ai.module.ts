import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { KnowledgeModule } from './knowledge.module';

@Module({ imports: [KnowledgeModule], controllers: [AiController], providers: [AiService] })
export class AiModule {}

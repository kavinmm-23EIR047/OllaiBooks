import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { CurrentTenantId } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../auth/permissions.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { KnowledgeService } from './knowledge.service';

const IndexKnowledgeSchema = z.object({
  title: z.string().trim().min(1).max(200),
  sourceType: z.enum(['UPLOAD', 'POLICY', 'TEMPLATE', 'CUSTOMER_NOTE']).default('UPLOAD'),
  content: z.string().trim().min(1).max(100_000),
}).strict();

@Controller('api/v1/ai/knowledge')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Get()
  @RequirePermissions('ai:use')
  list(@CurrentTenantId() tenantId: string) {
    return this.knowledge.listDocuments(tenantId);
  }

  @Post()
  @RequirePermissions('ai:use')
  indexText(@CurrentTenantId() tenantId: string, @Body(new ZodValidationPipe(IndexKnowledgeSchema)) body: { title: string; sourceType: 'UPLOAD' | 'POLICY' | 'TEMPLATE' | 'CUSTOMER_NOTE'; content: string }) {
    return this.knowledge.indexText(tenantId, body);
  }
}

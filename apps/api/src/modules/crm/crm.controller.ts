import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { CurrentTenantId } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../auth/permissions.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { CrmService, type CrmSyncItem } from './crm.service';

const CrmSyncSchema = z.object({
  since: z.string().datetime().optional(),
  records: z.array(z.object({
    id: z.string().min(1).max(120),
    kind: z.enum(['lead', 'deal', 'activity']),
    data: z.record(z.unknown()).refine((d) => JSON.stringify(d).length <= 64_000, { message: 'Record is too large' }),
    deleted: z.boolean().optional(),
    updatedAt: z.string().datetime(),
  })).max(200),
});

@Controller('api/v1/crm')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Post('sync')
  @RequirePermissions('customer:write')
  sync(
    @CurrentTenantId() tenantId: string,
    @Body(new ZodValidationPipe(CrmSyncSchema)) body: { since?: string; records: CrmSyncItem[] },
  ) {
    return this.crmService.sync(tenantId, body.records, body.since);
  }
}

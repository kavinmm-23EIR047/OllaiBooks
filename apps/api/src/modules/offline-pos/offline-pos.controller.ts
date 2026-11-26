import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { CurrentTenantId } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../auth/permissions.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { OfflinePosService } from './offline-pos.service';

const SyncBatchSchema = z.object({
  sales: z.array(z.object({
    id: z.string().min(1).max(120),
    sale: z.record(z.unknown()),
    updatedAt: z.string().datetime().optional(),
  }).refine(item => item.sale.id === item.id, { message: 'Sale ID must match the outbox ID' })).max(100),
});

type SyncBatch = { sales: Array<{ id: string; sale: Record<string, unknown>; updatedAt?: string }> };

@Controller('api/v1/offline-pos')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class OfflinePosController {
  constructor(private readonly offlinePosService: OfflinePosService) {}

  @Post('sync')
  @RequirePermissions('invoice:write')
  sync(@CurrentTenantId() tenantId: string, @Body(new ZodValidationPipe(SyncBatchSchema)) body: SyncBatch) {
    return this.offlinePosService.syncSales(tenantId, body.sales);
  }
}

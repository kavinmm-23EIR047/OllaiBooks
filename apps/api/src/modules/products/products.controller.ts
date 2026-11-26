import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentTenantId } from '../../auth/current-user.decorator';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../auth/permissions.guard';
import { TenantGuard } from '../../auth/tenant.guard';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { ProductInputSchema, ProductUpdateSchema } from './products.schema';
import { ProductsService } from './products.service';

@Controller('api/v1/products')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get()
  @RequirePermissions('product:read')
  list(@CurrentTenantId() tenantId: string) {
    return this.products.list(tenantId);
  }

  @Get(':id')
  @RequirePermissions('product:read')
  get(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.products.get(tenantId, id);
  }

  @Post()
  @RequirePermissions('product:write')
  create(@CurrentTenantId() tenantId: string, @Body(new ZodValidationPipe(ProductInputSchema)) body: any) {
    return this.products.create(tenantId, body);
  }

  @Post('bulk')
  @RequirePermissions('product:write')
  bulkImport(@CurrentTenantId() tenantId: string, @Body() body: any) {
    const items = Array.isArray(body) ? body : Array.isArray(body?.items) ? body.items : [];
    return this.products.bulkImport(tenantId, items);
  }

  @Patch(':id')
  @RequirePermissions('product:write')
  update(@CurrentTenantId() tenantId: string, @Param('id') id: string, @Body(new ZodValidationPipe(ProductUpdateSchema)) body: any) {
    return this.products.update(tenantId, id, body);
  }

  @Delete(':id')
  @RequirePermissions('product:write')
  archive(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.products.archive(tenantId, id);
  }
}

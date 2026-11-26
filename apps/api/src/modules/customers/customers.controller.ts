import { Controller, Get, Post, Body, Query, UseGuards, Param, Patch, Delete } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { TenantGuard } from '../../auth/tenant.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../auth/permissions.guard';
import { CustomerInputSchema, CustomerUpdateSchema } from './customers.schema';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { CurrentTenantId } from '../../auth/current-user.decorator';

@Controller('api/v1/customers')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @RequirePermissions('customer:read')
  async listCustomers(@CurrentTenantId() tenantId: string, @Query() query: any) {
    return this.customersService.listCustomers(tenantId, query);
  }

  @Post()
  @RequirePermissions('customer:write')
  async createCustomer(@CurrentTenantId() tenantId: string, @Body(new ZodValidationPipe(CustomerInputSchema)) body: any) {
    return this.customersService.createCustomer(tenantId, body);
  }

  @Get(':id')
  @RequirePermissions('customer:read')
  async getCustomer(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.customersService.getCustomer(tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions('customer:write')
  async updateCustomer(@CurrentTenantId() tenantId: string, @Param('id') id: string, @Body(new ZodValidationPipe(CustomerUpdateSchema)) body: any) {
    return this.customersService.updateCustomer(tenantId, id, body);
  }

  @Delete(':id')
  @RequirePermissions('customer:write')
  async archiveCustomer(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.customersService.archiveCustomer(tenantId, id);
  }
}

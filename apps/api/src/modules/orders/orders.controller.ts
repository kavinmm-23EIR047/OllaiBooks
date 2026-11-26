import { Controller, Get, Post, Param, Query, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { TenantGuard } from '../../auth/tenant.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../auth/permissions.guard';
import { CurrentTenantId } from '../../auth/current-user.decorator';

@Controller('api/v1/orders')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @RequirePermissions('order:read')
  async listOrders(
    @CurrentTenantId() tenantId: string,
    @Query() query: any,
  ) {
    return this.ordersService.listOrders(tenantId, query);
  }

  @Get(':id')
  @RequirePermissions('order:read')
  async getOrder(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.ordersService.getOrderById(tenantId, id);
  }

  @Post(':id/generate-invoice')
  @RequirePermissions('invoice:issue')
  async generateInvoice(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.ordersService.generateInvoiceFromOrder(tenantId, id);
  }
}

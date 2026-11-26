import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Helper to execute queries scoped to a verified tenant ID
   */
  forTenant(tenantId: string) {
    if (!tenantId) {
      throw new Error('Tenant ID is strictly required for tenant-scoped operations');
    }
    return {
      orders: {
        findMany: (args: any = {}) =>
          this.order.findMany({
            ...args,
            where: { ...args.where, tenantId },
          }),
        findFirst: (args: any = {}) =>
          this.order.findFirst({
            ...args,
            where: { ...args.where, tenantId },
          }),
      },
      invoices: {
        findMany: (args: any = {}) =>
          this.invoice.findMany({
            ...args,
            where: { ...args.where, tenantId },
          }),
        findFirst: (args: any = {}) =>
          this.invoice.findFirst({
            ...args,
            where: { ...args.where, tenantId },
          }),
      },
      customers: {
        findMany: (args: any = {}) =>
          this.customer.findMany({
            ...args,
            where: { ...args.where, tenantId },
          }),
      },
      reports: {
        findMany: (args: any = {}) =>
          this.reportJob.findMany({
            ...args,
            where: { ...args.where, tenantId },
          }),
      },
    };
  }
}

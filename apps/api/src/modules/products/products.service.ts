import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string) {
    return this.prisma.product.findMany({
      where: { tenantId, isArchived: false },
      orderBy: { name: 'asc' },
    });
  }

  async get(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({ where: { id, tenantId, isArchived: false } });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(tenantId: string, input: any) {
    return this.prisma.product.create({
      data: {
        tenantId,
        ...input,
        unitPrice: new Prisma.Decimal(String(input.unitPrice)),
        taxRate: new Prisma.Decimal(String(input.taxRate)),
      },
    });
  }

  async bulkImport(tenantId: string, items: any[]) {
    const created: any[] = [];
    for (const item of items) {
      if (!item.name || !item.sku) continue;
      const res = await this.prisma.product.upsert({
        where: { tenantId_sku: { tenantId, sku: String(item.sku).trim() } },
        create: {
          tenantId,
          name: String(item.name).trim(),
          sku: String(item.sku).trim(),
          description: item.description ? String(item.description).trim() : null,
          unit: item.unit ? String(item.unit).trim() : 'unit',
          unitPrice: new Prisma.Decimal(String(item.unitPrice || item.price || 0)),
          taxRate: new Prisma.Decimal(String(item.taxRate || item.tax || 18)),
          hsnCode: item.hsnCode ? String(item.hsnCode).trim() : null,
          taxCategory: item.taxCategory ? String(item.taxCategory).trim() : null,
          stockQuantity: item.stockQuantity ? parseInt(String(item.stockQuantity), 10) : 0,
        },
        update: {
          name: String(item.name).trim(),
          unitPrice: new Prisma.Decimal(String(item.unitPrice || item.price || 0)),
          taxRate: new Prisma.Decimal(String(item.taxRate || item.tax || 18)),
          hsnCode: item.hsnCode ? String(item.hsnCode).trim() : null,
          stockQuantity: item.stockQuantity !== undefined ? parseInt(String(item.stockQuantity), 10) : undefined,
          isArchived: false,
        },
      });
      created.push(res);
    }
    return { success: true, count: created.length, items: created };
  }

  async update(tenantId: string, id: string, input: any) {
    await this.get(tenantId, id);
    const data = { ...input };
    if (data.unitPrice !== undefined) data.unitPrice = new Prisma.Decimal(String(data.unitPrice));
    if (data.taxRate !== undefined) data.taxRate = new Prisma.Decimal(String(data.taxRate));
    return this.prisma.product.update({ where: { id }, data });
  }

  async archive(tenantId: string, id: string) {
    await this.get(tenantId, id);
    await this.prisma.product.update({ where: { id }, data: { isArchived: true } });
    return { success: true };
  }
}

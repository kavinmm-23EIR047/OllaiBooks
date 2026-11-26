import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

type OfflineSale = {
  id: string;
  sale: Record<string, unknown>;
  updatedAt?: string;
};

@Injectable()
export class OfflinePosService {
  constructor(private readonly prisma: PrismaService) {}

  async syncSales(tenantId: string, sales: OfflineSale[]) {
    const syncedIds = await this.prisma.$transaction(async transaction => {
      const saved = await Promise.all(sales.map(item => transaction.offlinePosSale.upsert({
        where: { tenantId_clientSaleId: { tenantId, clientSaleId: item.id } },
        create: {
          tenantId,
          clientSaleId: item.id,
          sale: item.sale as Prisma.InputJsonValue,
          clientUpdatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
        },
        update: {
          sale: item.sale as Prisma.InputJsonValue,
          clientUpdatedAt: item.updatedAt ? new Date(item.updatedAt) : undefined,
          syncedAt: new Date(),
        },
        select: { clientSaleId: true },
      })));
      return saved.map(item => item.clientSaleId);
    });

    return { syncedIds };
  }
}

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export type CrmKind = 'lead' | 'deal' | 'activity';

export interface CrmSyncItem {
  id: string;
  kind: CrmKind;
  data: Record<string, unknown>;
  deleted?: boolean;
  updatedAt: string;
}

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Push local changes (last-write-wins on client updatedAt) and pull everything
   * the server has that changed after `since`. Returns accepted ids, records the
   * server kept because they were newer (conflicts), and fresh server changes.
   */
  async sync(tenantId: string, items: CrmSyncItem[], since?: string) {
    const acceptedIds: string[] = [];
    const conflicts: Array<{ id: string; kind: string; data: unknown; deleted: boolean; updatedAt: string }> = [];

    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const incomingAt = new Date(item.updatedAt);
        const existing = await tx.crmRecord.findUnique({
          where: { tenantId_clientId: { tenantId, clientId: item.id } },
          select: { clientUpdatedAt: true, kind: true, data: true, deleted: true },
        });
        if (existing && existing.clientUpdatedAt > incomingAt) {
          conflicts.push({
            id: item.id,
            kind: existing.kind,
            data: existing.data,
            deleted: existing.deleted,
            updatedAt: existing.clientUpdatedAt.toISOString(),
          });
          continue;
        }
        await tx.crmRecord.upsert({
          where: { tenantId_clientId: { tenantId, clientId: item.id } },
          create: {
            tenantId,
            clientId: item.id,
            kind: item.kind,
            data: item.data as Prisma.InputJsonValue,
            deleted: Boolean(item.deleted),
            clientUpdatedAt: incomingAt,
          },
          update: {
            kind: item.kind,
            data: item.data as Prisma.InputJsonValue,
            deleted: Boolean(item.deleted),
            clientUpdatedAt: incomingAt,
          },
        });
        acceptedIds.push(item.id);
      }
    });

    const serverNow = new Date().toISOString();
    const changed = await this.prisma.crmRecord.findMany({
      where: { tenantId, ...(since ? { updatedAt: { gt: new Date(since) } } : {}) },
      orderBy: { updatedAt: 'asc' },
      take: 2000,
      select: { clientId: true, kind: true, data: true, deleted: true, clientUpdatedAt: true },
    });

    return {
      acceptedIds,
      conflicts,
      changes: changed.map((r) => ({
        id: r.clientId,
        kind: r.kind,
        data: r.data,
        deleted: r.deleted,
        updatedAt: r.clientUpdatedAt.toISOString(),
      })),
      serverTime: serverNow,
    };
  }
}

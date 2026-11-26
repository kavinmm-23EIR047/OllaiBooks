import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrentPlan(tenantId: string) {
    const sub = await this.prisma.tenantSubscription.findFirst({
      where: { tenantId },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });

    const usageRecords = await this.prisma.usageRecord.findMany({
      where: {
        tenantId,
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1,
      },
    });

    return {
      subscription: sub,
      currentUsage: {
        invoicesGenerated: usageRecords.find((u) => u.metric === 'INVOICES')?.quantity || 0,
        whatsAppMessages: usageRecords.find((u) => u.metric === 'WHATSAPP_MESSAGES')?.quantity || 0,
        emailsSent: usageRecords.find((u) => u.metric === 'EMAILS')?.quantity || 0,
        voiceMinutes: usageRecords.find((u) => u.metric === 'VOICE_MINUTES')?.quantity || 0,
      },
    };
  }

  async getAllPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { priceMonthly: 'asc' },
    });
  }
}

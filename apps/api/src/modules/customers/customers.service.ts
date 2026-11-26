import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CustomerInput, CustomerUpdate } from './customers.schema';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async listCustomers(tenantId: string, filter: any = {}) {
    const page = Math.max(1, Number.parseInt(filter.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(filter.limit, 10) || 20));
    const search = typeof filter.search === 'string' ? filter.search.trim().slice(0, 100) : '';
    const skip = (page - 1) * limit;

    const where: any = { tenantId, isArchived: false };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { communicationConsents: { where: { channel: 'WHATSAPP' }, select: { status: true, source: true, grantedAt: true, revokedAt: true } } },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getCustomer(tenantId: string, id: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id, tenantId, isArchived: false } });
    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async createCustomer(tenantId: string, data: CustomerInput) {
    return this.prisma.customer.create({
      data: {
        tenantId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        gstin: data.gstin,
        billingStreet: data.billingStreet,
        billingCity: data.billingCity,
        billingState: data.billingState,
        billingPostalCode: data.billingPostalCode,
        preferredLanguage: data.preferredLanguage || 'en',
        tags: data.tags || [],
      },
    });
  }

  async updateCustomer(tenantId: string, id: string, data: CustomerUpdate) {
    await this.getCustomer(tenantId, id);
    return this.prisma.customer.update({ where: { id }, data });
  }

  async archiveCustomer(tenantId: string, id: string) {
    await this.getCustomer(tenantId, id);
    await this.prisma.customer.update({ where: { id }, data: { isArchived: true } });
    return { success: true };
  }
}

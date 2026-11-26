import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Patch,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../database/prisma.service';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';

const CreateCustomerSchema = z.object({
  businessName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(200),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().max(40).optional(),
  planCode: z.string().trim().min(2).max(40),
  periodDays: z.number().int().min(1).max(366).optional(),
}).strict();
const UpdateSubscriptionSchema = z.object({
  planCode: z.string().trim().min(2).max(40),
  status: z.enum(['ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID']),
  periodDays: z.number().int().min(1).max(366).optional(),
}).strict();
const UpdateLoginSchema = z.object({
  email: z.string().trim().email().max(254).optional(),
  password: z.string().min(12).max(200).optional(),
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().max(40).optional(),
}).strict().refine((value) => Object.values(value).some((item) => item !== undefined), 'Provide at least one login field to update');

@Controller('api/v1/admin-bridge')
export class AdminBridgeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  private async verifyAdminAccess(providedKey?: string, authHeader?: string): Promise<boolean> {
    // 1. Check Service Key
    const expectedKey = this.config.get<string>('AK_ADMIN_SERVICE_KEY') || '';
    if (expectedKey.length >= 32 && providedKey) {
      const expected = createHash('sha256').update(expectedKey).digest();
      const provided = createHash('sha256').update(providedKey).digest();
      if (timingSafeEqual(expected, provided)) return true;
    }

    // 2. Check JWT Bearer token for platform admin
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7).trim();
        const payload = this.jwt.verify(token);
        if (payload?.sub) {
          const user = await this.prisma.user.findUnique({
            where: { id: payload.sub },
            select: { isPlatformAdmin: true, isActive: true },
          });
          if (user?.isActive && user.isPlatformAdmin) return true;
        }
      } catch {
        // invalid token
      }
    }

    throw new UnauthorizedException('Platform Admin credentials required (service key or platform admin token)');
  }

  private async ensureDefaultPlans() {
    const plans = [
      { code: 'STARTER', name: 'Starter', description: 'Essential billing and customer management', tier: 'STARTER' as const, priceMonthly: 999, priceAnnual: 9990, maxWebsites: 1, maxInvoicesMonthly: 500, maxWhatsAppMonthly: 1000, maxEmailsMonthly: 2000, maxVoiceMinutesMonthly: 0, maxStaff: 2, aiAssistant: false, voiceAgent: false, customBranding: false, advancedAnalytics: false },
      { code: 'GROWTH', name: 'Growth', description: 'Connected orders, WhatsApp and automations', tier: 'GROWTH' as const, priceMonthly: 2499, priceAnnual: 24990, maxWebsites: 3, maxInvoicesMonthly: 2500, maxWhatsAppMonthly: 5000, maxEmailsMonthly: 10000, maxVoiceMinutesMonthly: 0, maxStaff: 10, aiAssistant: true, voiceAgent: false, customBranding: false, advancedAnalytics: true },
      { code: 'BUSINESS_AI', name: 'Business AI', description: 'Advanced AI, voice and analytics tools', tier: 'BUSINESS_AI' as const, priceMonthly: 4999, priceAnnual: 49990, maxWebsites: 100, maxInvoicesMonthly: 50000, maxWhatsAppMonthly: 50000, maxEmailsMonthly: 50000, maxVoiceMinutesMonthly: 300, maxStaff: 100, aiAssistant: true, voiceAgent: true, customBranding: true, advancedAnalytics: true },
    ];
    for (const plan of plans) await this.prisma.subscriptionPlan.upsert({ where: { code: plan.code }, create: plan, update: {} });
  }

  @Get('overview')
  async overview(
    @Headers('x-ak-admin-key') providedKey?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    await this.verifyAdminAccess(providedKey, authHeader);
    await this.ensureDefaultPlans();

    const [tenants, activeCount, suspendedCount, customers, invoices, payments, totalOrders] =
      await Promise.all([
        this.prisma.tenant.findMany({
          orderBy: { createdAt: 'desc' },
          take: 100,
          select: {
            id: true,
            name: true,
            slug: true,
            currency: true,
            isActive: true,
            isSuspended: true,
            createdAt: true,
            businessProfile: { select: { email: true, phone: true } },
            members: {
              where: { isActive: true }, take: 100,
              select: { role: true, user: { select: { email: true, firstName: true, lastName: true } } },
            },
            subscriptions: {
              take: 1, orderBy: { createdAt: 'desc' },
              select: { id: true, status: true, currentPeriodStart: true, currentPeriodEnd: true, plan: { select: { code: true, name: true, priceMonthly: true } } },
            },
            _count: {
              select: {
                members: true,
                customers: true,
                invoices: true,
                orders: true,
              },
            },
          },
        }),
        this.prisma.tenant.count({ where: { isActive: true, isSuspended: false } }),
        this.prisma.tenant.count({ where: { isSuspended: true } }),
        this.prisma.customer.count(),
        this.prisma.invoice.count(),
        this.prisma.payment.aggregate({ _sum: { amount: true } }),
        this.prisma.order.count(),
      ]);

    return {
      generatedAt: new Date().toISOString(),
      totals: {
        tenants: await this.prisma.tenant.count(),
        activeTenants: activeCount,
        suspendedTenants: suspendedCount,
        customers,
        invoices,
        totalOrders,
        recordedPayments: payments._sum.amount?.toString() || '0',
      },
      tenants,
      plans: await this.prisma.subscriptionPlan.findMany({ where: { isActive: true }, orderBy: { priceMonthly: 'asc' }, select: { code: true, name: true, priceMonthly: true } }),
    };
  }

  @Post('customers')
  async createCustomer(
    @Body(new ZodValidationPipe(CreateCustomerSchema)) body: z.infer<typeof CreateCustomerSchema>,
    @Headers('x-ak-admin-key') providedKey?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    await this.verifyAdminAccess(providedKey, authHeader);
    await this.ensureDefaultPlans();
    const businessName = body.businessName?.trim();
    const email = body.email?.trim().toLowerCase();
    const firstName = body.firstName?.trim();
    const lastName = body.lastName?.trim();
    const password = body.password;
    if (!businessName || !email || !firstName || !lastName || !password || password.length < 12 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ForbiddenException('Business, valid email, customer name, and a password of at least 12 characters are required');
    }
    if (await this.prisma.user.findUnique({ where: { email }, select: { id: true } })) {
      throw new ForbiddenException('That email already has an account');
    }
    const plan = await this.prisma.subscriptionPlan.findFirst({ where: { code: body.planCode, isActive: true } });
    if (!plan) throw new NotFoundException('Choose an active subscription plan');

    const slugBase = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50) || 'business';
    const slug = `${slugBase}-${randomBytes(3).toString('hex')}`;
    const now = new Date();
    const periodEnd = new Date(now.getTime() + Math.max(1, Math.min(366, body.periodDays || 30)) * 86400000);
    const passwordHash = await bcrypt.hash(password, 12);

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: { email, passwordHash, firstName, lastName, phone: body.phone?.trim() || null } });
      const tenant = await tx.tenant.create({
        data: {
          name: businessName, slug, currency: 'INR',
          businessProfile: { create: { legalName: businessName, tradeName: businessName, email, phone: body.phone?.trim() || '', streetAddress: '', city: '', state: '', postalCode: '', invoicePrefix: 'INV-', invoiceNextNumber: 1001 } },
          members: { create: { userId: user.id, role: 'OWNER', permissions: ['*'] } },
          subscriptions: { create: { planId: plan.id, status: 'ACTIVE', billingInterval: 'monthly', currentPeriodStart: now, currentPeriodEnd: periodEnd } },
        },
      });
      return { tenantId: tenant.id, tenantName: tenant.name, slug: tenant.slug, customerEmail: user.email, plan: plan.name, periodEnd };
    });

    return { success: true, customer: result, message: 'Customer account created. The customer can sign in with their email and password.' };
  }

  @Patch('tenants/:id/subscription')
  async updateSubscription(
    @Param('id') tenantId: string,
    @Body(new ZodValidationPipe(UpdateSubscriptionSchema)) body: z.infer<typeof UpdateSubscriptionSchema>,
    @Headers('x-ak-admin-key') providedKey?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    await this.verifyAdminAccess(providedKey, authHeader);
    if (!['ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID'].includes(body.status)) throw new ForbiddenException('Invalid subscription status');
    const plan = await this.prisma.subscriptionPlan.findFirst({ where: { code: body.planCode, isActive: true } });
    if (!plan) throw new NotFoundException('Choose an active subscription plan');
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true, name: true } });
    if (!tenant) throw new NotFoundException('Customer workspace not found');
    const now = new Date();
    const current = await this.prisma.tenantSubscription.findFirst({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
    const periodEnd = new Date(now.getTime() + Math.max(1, Math.min(366, body.periodDays || 30)) * 86400000);
    const subscription = current
      ? await this.prisma.tenantSubscription.update({ where: { id: current.id }, data: { planId: plan.id, status: body.status, currentPeriodStart: now, currentPeriodEnd: periodEnd } })
      : await this.prisma.tenantSubscription.create({ data: { tenantId, planId: plan.id, status: body.status, billingInterval: 'monthly', currentPeriodStart: now, currentPeriodEnd: periodEnd } });
    return { success: true, tenant, subscription: { ...subscription, plan }, message: `${tenant.name} subscription updated` };
  }

  @Patch('tenants/:id/login')
  async updateCustomerLogin(
    @Param('id') tenantId: string,
    @Body(new ZodValidationPipe(UpdateLoginSchema)) body: z.infer<typeof UpdateLoginSchema>,
    @Headers('x-ak-admin-key') providedKey?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    await this.verifyAdminAccess(providedKey, authHeader);
    const membership = await this.prisma.tenantMember.findFirst({ where: { tenantId, role: 'OWNER', isActive: true }, include: { user: true, tenant: true } });
    if (!membership) throw new NotFoundException('Customer login not found');
    const nextEmail = body.email?.toLowerCase();
    if (nextEmail && nextEmail !== membership.user.email && await this.prisma.user.findUnique({ where: { email: nextEmail }, select: { id: true } })) {
      throw new ForbiddenException('That email already has an account');
    }
    await this.prisma.user.update({ where: { id: membership.userId }, data: {
      ...(nextEmail ? { email: nextEmail } : {}),
      ...(body.password ? { passwordHash: await bcrypt.hash(body.password, 12) } : {}),
      ...(body.firstName ? { firstName: body.firstName } : {}),
      ...(body.lastName ? { lastName: body.lastName } : {}),
      ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
    } });
    if (nextEmail || body.phone !== undefined) await this.prisma.businessProfile.updateMany({ where: { tenantId }, data: {
      ...(nextEmail ? { email: nextEmail } : {}), ...(body.phone !== undefined ? { phone: body.phone || '' } : {}),
    } });
    return { success: true, customerEmail: nextEmail || membership.user.email, message: 'Customer login details updated.' };
  }

  @Post('tenants/:id/toggle-status')
  async toggleTenantStatus(
    @Param('id') tenantId: string,
    @Headers('x-ak-admin-key') providedKey?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    await this.verifyAdminAccess(providedKey, authHeader);

    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { isSuspended: !tenant.isSuspended },
    });

    return {
      success: true,
      tenantId: updated.id,
      name: updated.name,
      isSuspended: updated.isSuspended,
      message: `Tenant ${updated.name} is now ${updated.isSuspended ? 'SUSPENDED' : 'ACTIVE'}`,
    };
  }

  @Post('tenants')
  async createTenant(
    @Body() body: { name: string; slug: string; currency?: string },
    @Headers('x-ak-admin-key') providedKey?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    await this.verifyAdminAccess(providedKey, authHeader);

    if (!body.name || !body.slug) {
      throw new ForbiddenException('Tenant name and slug are required');
    }

    const tenant = await this.prisma.tenant.create({
      data: {
        name: body.name.trim(),
        slug: body.slug.toLowerCase().trim(),
        currency: body.currency || 'INR',
        businessProfile: {
          create: {
            legalName: body.name.trim(),
            email: `admin@${body.slug.toLowerCase().trim()}.com`,
            phone: '+91 98765 00000',
            streetAddress: 'Headquarters',
            city: 'Bengaluru',
            state: 'Karnataka',
            postalCode: '560001',
            invoicePrefix: 'INV-',
            invoiceNextNumber: 1,
          },
        },
      },
    });

    return {
      success: true,
      tenant,
      message: `Tenant workspace ${tenant.name} provisioned successfully`,
    };
  }
}

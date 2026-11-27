import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Patch,
  Delete,
  Ip,
  Query,
  HttpException,
  HttpStatus,
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
import { PasswordSchema } from '../../common/password.policy';

const CreateCustomerSchema = z.object({
  businessName: z.string().trim().min(2).max(160),
  email: z.string().trim().email().max(254),
  password: PasswordSchema,
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
  password: PasswordSchema.optional(),
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().max(40).optional(),
}).strict().refine((value) => Object.values(value).some((item) => item !== undefined), 'Provide at least one login field to update');

const UpdateMemberSchema = z.object({
  email: z.string().trim().email().max(254).optional(),
  password: PasswordSchema.optional(),
  firstName: z.string().trim().min(1).max(80).optional(),
  lastName: z.string().trim().min(1).max(80).optional(),
  phone: z.string().trim().max(40).optional(),
  isActive: z.boolean().optional(),
}).strict();

const SEMVER = /^\d+\.\d+\.\d+$/;
const ReleaseSchema = z.object({
  platform: z.enum(['windows', 'android', 'mac', 'linux', 'web']),
  version: z.string().trim().regex(SEMVER, 'Use a version like 1.2.0'),
  minSupported: z.string().trim().regex(SEMVER, 'Use a version like 1.0.0').optional(),
  downloadUrl: z.string().trim().url().max(500).optional(),
  sizeMb: z.number().min(0).max(5000).optional(),
  notes: z.string().trim().max(4000).optional(),
  mandatory: z.boolean().optional(),
  isPublished: z.boolean().optional(),
}).strict();
const ReleaseUpdateSchema = ReleaseSchema.partial().strict();

@Controller('api/v1/admin-bridge')
export class AdminBridgeController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
  ) {}

  /* ---------------- Admin console login (credentials live in apps/api/.env) ---------------- */

  private static readonly failedLogins = new Map<string, { count: number; until: number }>();

  private adminId() {
    return (this.config.get<string>('ADMIN_ID') || '').trim();
  }

  private adminSecret() {
    return `${this.config.getOrThrow<string>('JWT_SECRET')}::ollaibooks-admin-console`;
  }

  private safeEqual(a: string, b: string) {
    const ha = createHash('sha256').update(a).digest();
    const hb = createHash('sha256').update(b).digest();
    return timingSafeEqual(ha, hb);
  }

  @Post('login')
  async adminLogin(
    @Body(new ZodValidationPipe(z.object({ adminId: z.string().trim().min(1).max(120), password: z.string().min(1).max(200) }).strict())) body: { adminId: string; password: string },
    @Ip() ip: string,
  ) {
    const key = ip || 'unknown';
    const state = AdminBridgeController.failedLogins.get(key);
    if (state && state.until > Date.now()) {
      throw new HttpException(`Too many attempts. Try again in ${Math.ceil((state.until - Date.now()) / 60000)} minute(s).`, HttpStatus.TOO_MANY_REQUESTS);
    }
    const expectedId = this.adminId();
    const expectedPassword = this.config.get<string>('ADMIN_PASSWORD') || '';
    if (!expectedId || expectedPassword.length < 8) {
      throw new ForbiddenException('Admin login is not configured. Set ADMIN_ID and ADMIN_PASSWORD (8+ characters) in apps/api/.env');
    }
    const ok = this.safeEqual(body.adminId, expectedId) && this.safeEqual(body.password, expectedPassword);
    if (!ok) {
      const lockExpired = Boolean(state && state.until !== 0 && state.until <= Date.now());
      const count = (lockExpired ? 0 : state?.count || 0) + 1;
      AdminBridgeController.failedLogins.set(key, { count, until: count >= 5 ? Date.now() + 15 * 60_000 : 0 });
      throw new UnauthorizedException('Admin ID or password is incorrect');
    }
    AdminBridgeController.failedLogins.delete(key);
    const expiresInHours = 8;
    const token = this.jwt.sign({ sub: expectedId, typ: 'admin-console' }, { secret: this.adminSecret(), expiresIn: `${expiresInHours}h` });
    return { token, adminId: expectedId, expiresAt: new Date(Date.now() + expiresInHours * 3600_000).toISOString() };
  }

  @Get('session')
  async adminSession(@Headers('x-ak-admin-key') providedKey?: string, @Headers('authorization') authHeader?: string) {
    await this.verifyAdminAccess(providedKey, authHeader);
    return { ok: true, adminId: this.adminId() || 'platform-admin', serverTime: new Date().toISOString() };
  }

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
      const token = authHeader.slice(7).trim();
      // 2a. Admin-console session (ADMIN_ID / ADMIN_PASSWORD from .env), signed with a separate secret
      try {
        const adminPayload = this.jwt.verify(token, { secret: this.adminSecret() });
        if (adminPayload?.typ === 'admin-console' && adminPayload?.sub === this.adminId()) return true;
      } catch {
        // not an admin-console token
      }
      try {
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
    if (!businessName || !email || !firstName || !lastName || !password || password.length < 8 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ForbiddenException('Business, valid email, customer name, and a password of at least 8 characters are required');
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

  /* ---------------- Members: who uses ollaiBooks online / offline ---------------- */

  @Get('members')
  async members(@Headers('x-ak-admin-key') providedKey?: string, @Headers('authorization') authHeader?: string) {
    await this.verifyAdminAccess(providedKey, authHeader);
    const [users, offlineByTenant, crmByTenant] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 500,
        select: {
          id: true, email: true, firstName: true, lastName: true, phone: true, isActive: true, isPlatformAdmin: true,
          lastLoginAt: true, lastLoginMode: true, createdAt: true,
          tenantMemberships: {
            select: {
              role: true, isActive: true,
              tenant: {
                select: {
                  id: true, name: true, isSuspended: true,
                  subscriptions: { take: 1, orderBy: { createdAt: 'desc' }, select: { status: true, currentPeriodEnd: true, plan: { select: { code: true, name: true } } } },
                },
              },
            },
          },
        },
      }),
      this.prisma.offlinePosSale.groupBy({ by: ['tenantId'], _max: { syncedAt: true }, _count: { _all: true } }),
      this.prisma.crmRecord.groupBy({ by: ['tenantId'], _max: { updatedAt: true }, _count: { _all: true } }),
    ]);
    const offline = new Map(offlineByTenant.map((r) => [r.tenantId, { lastSyncAt: r._max.syncedAt, bills: r._count._all }]));
    const crmMap = new Map(crmByTenant.map((r) => [r.tenantId, { lastSyncAt: r._max.updatedAt, records: r._count._all }]));
    return {
      generatedAt: new Date().toISOString(),
      members: users.map(({ tenantMemberships, ...u }) => {
        const tenants = tenantMemberships.map((m) => ({
          id: m.tenant.id, name: m.tenant.name, role: m.role, memberActive: m.isActive, suspended: m.tenant.isSuspended,
          subscription: m.tenant.subscriptions[0] || null,
          offline: offline.get(m.tenant.id) || { lastSyncAt: null, bills: 0 },
          crm: crmMap.get(m.tenant.id) || { lastSyncAt: null, records: 0 },
        }));
        const syncTimes = tenants.map((t) => t.offline.lastSyncAt).filter((d): d is Date => Boolean(d)).sort((a, b) => a.getTime() - b.getTime());
        return { ...u, tenants, lastOfflineSyncAt: syncTimes.pop() || null, usesOfflineApp: tenants.some((t) => t.offline.bills > 0) };
      }),
    };
  }

  @Patch('users/:id')
  async updateUser(
    @Param('id') userId: string,
    @Body(new ZodValidationPipe(UpdateMemberSchema)) body: z.infer<typeof UpdateMemberSchema>,
    @Headers('x-ak-admin-key') providedKey?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    await this.verifyAdminAccess(providedKey, authHeader);
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
    if (!user) throw new NotFoundException('Member not found');
    const nextEmail = body.email?.toLowerCase();
    if (nextEmail && nextEmail !== user.email && await this.prisma.user.findUnique({ where: { email: nextEmail }, select: { id: true } })) {
      throw new ForbiddenException('That email already has an account');
    }
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(nextEmail ? { email: nextEmail } : {}),
        ...(body.password ? { passwordHash: await bcrypt.hash(body.password, 12) } : {}),
        ...(body.firstName ? { firstName: body.firstName } : {}),
        ...(body.lastName ? { lastName: body.lastName } : {}),
        ...(body.phone !== undefined ? { phone: body.phone || null } : {}),
        ...(typeof body.isActive === 'boolean' ? { isActive: body.isActive } : {}),
      },
      select: { id: true, email: true, isActive: true },
    });
    return {
      success: true,
      member: updated,
      message: body.password ? 'Password reset. The member must sign in online once so the offline app picks up the new password.' : 'Member updated.',
    };
  }

  /* ---------------- Version control: app releases ---------------- */

  @Get('releases')
  async listReleases(@Headers('x-ak-admin-key') providedKey?: string, @Headers('authorization') authHeader?: string) {
    await this.verifyAdminAccess(providedKey, authHeader);
    return { releases: await this.prisma.appRelease.findMany({ orderBy: [{ platform: 'asc' }, { createdAt: 'desc' }], take: 200 }) };
  }

  @Post('releases')
  async createRelease(
    @Body(new ZodValidationPipe(ReleaseSchema)) body: z.infer<typeof ReleaseSchema>,
    @Headers('x-ak-admin-key') providedKey?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    await this.verifyAdminAccess(providedKey, authHeader);
    const exists = await this.prisma.appRelease.findUnique({ where: { platform_version: { platform: body.platform, version: body.version } } });
    if (exists) throw new ForbiddenException(`Version ${body.version} already exists for ${body.platform}`);
    return { success: true, release: await this.prisma.appRelease.create({ data: body as { platform: string; version: string } }) };
  }

  @Patch('releases/:id')
  async updateRelease(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(ReleaseUpdateSchema)) body: z.infer<typeof ReleaseUpdateSchema>,
    @Headers('x-ak-admin-key') providedKey?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    await this.verifyAdminAccess(providedKey, authHeader);
    return { success: true, release: await this.prisma.appRelease.update({ where: { id }, data: body }) };
  }

  @Delete('releases/:id')
  async deleteRelease(@Param('id') id: string, @Headers('x-ak-admin-key') providedKey?: string, @Headers('authorization') authHeader?: string) {
    await this.verifyAdminAccess(providedKey, authHeader);
    await this.prisma.appRelease.delete({ where: { id } });
    return { success: true };
  }

  /* ---------------- Backups ---------------- */

  @Get('backups/summary')
  async backupSummary(@Headers('x-ak-admin-key') providedKey?: string, @Headers('authorization') authHeader?: string) {
    await this.verifyAdminAccess(providedKey, authHeader);
    const tenants = await this.prisma.tenant.findMany({
      orderBy: { name: 'asc' },
      take: 500,
      select: { id: true, name: true, _count: { select: { customers: true, products: true, invoices: true, orders: true, payments: true, offlinePosSales: true, crmRecords: true } } },
    });
    return { generatedAt: new Date().toISOString(), tenants };
  }

  @Get('tenants/:id/backup')
  async tenantBackup(
    @Param('id') tenantId: string,
    @Headers('x-ak-admin-key') providedKey?: string,
    @Headers('authorization') authHeader?: string,
  ) {
    await this.verifyAdminAccess(providedKey, authHeader);
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, include: { businessProfile: true } });
    if (!tenant) throw new NotFoundException('Workspace not found');
    const take = 20000;
    const [customers, products, invoices, payments, orders, offlinePosSales, crmRecords, subscriptions] = await Promise.all([
      this.prisma.customer.findMany({ where: { tenantId }, take }),
      this.prisma.product.findMany({ where: { tenantId }, take }),
      this.prisma.invoice.findMany({ where: { tenantId }, take, include: { items: true } }),
      this.prisma.payment.findMany({ where: { tenantId }, take }),
      this.prisma.order.findMany({ where: { tenantId }, take, include: { items: true } }),
      this.prisma.offlinePosSale.findMany({ where: { tenantId }, take }),
      this.prisma.crmRecord.findMany({ where: { tenantId }, take }),
      this.prisma.tenantSubscription.findMany({ where: { tenantId }, include: { plan: true } }),
    ]);
    return {
      format: 'ollaibooks-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      tenant: { id: tenant.id, name: tenant.name, slug: tenant.slug, businessProfile: tenant.businessProfile },
      counts: {
        customers: customers.length, products: products.length, invoices: invoices.length, payments: payments.length,
        orders: orders.length, offlinePosSales: offlinePosSales.length, crmRecords: crmRecords.length,
      },
      data: { customers, products, invoices, payments, orders, offlinePosSales, crmRecords, subscriptions },
    };
  }
}

/** Public, read-only: installed apps ask "is there a newer version?" (no customer data). */
@Controller('api/v1/app-releases')
export class AppReleasesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('latest')
  async latest(@Query('platform') platform = 'windows') {
    const release = await this.prisma.appRelease.findFirst({
      where: { platform: String(platform).slice(0, 20), isPublished: true },
      orderBy: { createdAt: 'desc' },
      select: { platform: true, version: true, minSupported: true, downloadUrl: true, sizeMb: true, notes: true, mandatory: true, createdAt: true },
    });
    return { release };
  }
}

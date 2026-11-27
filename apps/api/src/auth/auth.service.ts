import { Injectable, UnauthorizedException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async registerBusiness(dto: {
    businessName: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const slug = dto.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

    // Atomic transaction creating Tenant, Business Profile, User, Owner Membership, and Free Plan
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          firstName: dto.firstName?.trim() || dto.businessName.trim(),
          lastName: dto.lastName?.trim() || '',
          phone: dto.phone,
        },
      });

      const tenant = await tx.tenant.create({
        data: {
          name: dto.businessName,
          slug,
          currency: 'INR',
          timezone: 'Asia/Kolkata',
        },
      });

      await tx.businessProfile.create({
        data: {
          tenantId: tenant.id,
          legalName: dto.businessName,
          tradeName: dto.businessName,
          email: dto.email,
          phone: dto.phone || '',
          streetAddress: '',
          city: '',
          state: '',
          postalCode: '',
          invoicePrefix: 'INV-',
          invoiceNextNumber: 1001,
        },
      });

      await tx.tenantMember.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          role: 'OWNER',
          permissions: ['*'],
        },
      });

      // Default Starter Plan assignment
      let starterPlan = await tx.subscriptionPlan.findFirst({
        where: { code: 'STARTER' },
      });

      if (!starterPlan) {
        starterPlan = await tx.subscriptionPlan.create({
          data: {
            code: 'STARTER',
            name: 'Starter Plan',
            description: 'Essential billing and invoicing for small businesses',
            tier: 'STARTER',
            priceMonthly: 0,
            priceAnnual: 0,
            maxWebsites: 1,
            maxInvoicesMonthly: 500,
            maxWhatsAppMonthly: 1000,
            maxEmailsMonthly: 2000,
            maxVoiceMinutesMonthly: 0,
            maxStaff: 2,
          },
        });
      }

      const now = new Date();
      const nextMonth = new Date();
      nextMonth.setDate(now.getDate() + 30);

      await tx.tenantSubscription.create({
        data: {
          tenantId: tenant.id,
          planId: starterPlan.id,
          status: 'ACTIVE',
          billingInterval: 'monthly',
          currentPeriodStart: now,
          currentPeriodEnd: nextMonth,
        },
      });

      const token = this.generateJwt({
        sub: user.id,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          subscriptionEndsAt: nextMonth.toISOString(),
        },
        token,
      };
    });
  }

  async login(dto: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        tenantMemberships: {
          include: {
            tenant: { select: { id: true, name: true, slug: true, isActive: true, isSuspended: true, subscriptions: true } },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const activeMemberships = user.tenantMemberships.filter((membership) =>
      membership.tenant.isActive && !membership.tenant.isSuspended && membership.isActive && membership.tenant.subscriptions.some((sub) =>
        ['ACTIVE', 'TRIALING'].includes(sub.status) && sub.currentPeriodEnd > new Date(),
      ),
    );
    if (!user.isPlatformAdmin && activeMemberships.length === 0) {
      throw new ForbiddenException('No active subscription is available for this account. Contact your administrator.');
    }

    const memberships = activeMemberships.map((m) => ({
      tenantId: m.tenantId,
      role: m.role as any,
      permissions: m.permissions,
      tenantName: m.tenant.name,
      tenantSlug: m.tenant.slug,
      subscriptionEndsAt: m.tenant.subscriptions
        .filter((sub) => ['ACTIVE', 'TRIALING'].includes(sub.status) && sub.currentPeriodEnd > new Date())
        .sort((a, b) => b.currentPeriodEnd.getTime() - a.currentPeriodEnd.getTime())[0]?.currentPeriodEnd.toISOString(),
    }));
    if (user.isPlatformAdmin && memberships.length === 0) {
      memberships.push({ tenantId: '', role: 'ADMIN' as any, permissions: ['*'], tenantName: 'Platform Admin', tenantSlug: 'platform-admin', subscriptionEndsAt: undefined });
    }

    const token = this.generateJwt({
      sub: user.id,
    });

    // Admin console shows who signed in online and when
    await this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date(), lastLoginMode: 'online' } }).catch(() => undefined);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isPlatformAdmin: user.isPlatformAdmin,
      },
      workspaces: memberships,
      token,
    };
  }

  private generateJwt(payload: any): string {
    return this.jwtService.sign(payload);
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../database/prisma.service';

interface JwtPayload {
  sub: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload?.sub) throw new UnauthorizedException('Invalid access token');

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        tenantMemberships: {
          where: { isActive: true },
          include: { tenant: { include: { subscriptions: true } } },
        },
      },
    });

    if (!user?.isActive) throw new UnauthorizedException('Account is inactive');

    const activeMemberships = user.tenantMemberships
      .filter((membership) => membership.tenant.isActive && !membership.tenant.isSuspended && membership.tenant.subscriptions.some((sub) => ['ACTIVE', 'TRIALING'].includes(sub.status) && sub.currentPeriodEnd > new Date()))
      .map((membership) => ({
        tenantId: membership.tenantId,
        role: membership.role,
        permissions: membership.permissions,
        tenantName: membership.tenant.name,
        tenantSlug: membership.tenant.slug,
      }));
    if (!user.isPlatformAdmin && activeMemberships.length === 0) throw new UnauthorizedException('No active subscription is available for this account');

    return {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isPlatformAdmin: user.isPlatformAdmin,
      tenantMemberships: activeMemberships,
    };
  }
}

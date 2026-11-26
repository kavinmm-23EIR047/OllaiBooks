import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    // Platform admins can access cross-tenant with explicit header
    const requestedTenantId = request.headers['x-tenant-id'];

    if (user.isPlatformAdmin && requestedTenantId) {
      const tenant = await this.prisma.tenant.findFirst({
        where: { id: requestedTenantId, isActive: true, isSuspended: false },
        select: { id: true },
      });
      if (!tenant) throw new ForbiddenException('Tenant workspace is unavailable');
      request.activeTenantId = requestedTenantId;
      request.activeTenantRole = 'PLATFORM_ADMIN';
      request.activeTenantPermissions = ['*'];
      return true;
    }

    if (!requestedTenantId) {
      // If user has only one tenant membership, default to that
      if (user.tenantMemberships && user.tenantMemberships.length === 1) {
        request.activeTenantId = user.tenantMemberships[0].tenantId;
        request.activeTenantRole = user.tenantMemberships[0].role;
        request.activeTenantPermissions = user.tenantMemberships[0].permissions || [];
        return true;
      }
      throw new ForbiddenException('Select a workspace using the x-tenant-id header');
    }

    // Validate membership
    const membership = user.tenantMemberships?.find(
      (m: any) => m.tenantId === requestedTenantId,
    );

    if (!membership) {
      throw new ForbiddenException('You do not have access to this tenant workspace');
    }

    request.activeTenantId = requestedTenantId;
    request.activeTenantRole = membership.role;
    request.activeTenantPermissions = membership.permissions || [];

    return true;
  }
}

import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

const REQUIRED_PERMISSIONS = 'requiredPermissions';

export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(REQUIRED_PERMISSIONS, permissions);

const ROLE_PERMISSIONS: Record<string, string[]> = {
  OWNER: ['*'],
  ADMIN: ['*'],
  MANAGER: [
    'dashboard:read', 'customer:read', 'customer:write', 'product:read', 'product:write',
    'invoice:read', 'invoice:write', 'invoice:issue', 'payment:read', 'payment:record',
    'order:read', 'report:read', 'report:export', 'communication:read', 'communication:send', 'integration:manage',
    'automation:read', 'automation:write', 'subscription:read', 'integration:read', 'integration:manage', 'ai:use', 'business:read', 'business:manage',
  ],
  ACCOUNTANT: [
    'dashboard:read', 'customer:read', 'product:read', 'invoice:read', 'invoice:write',
    'invoice:issue', 'payment:read', 'payment:record', 'report:read', 'report:export',
    'invoice:credit', 'subscription:read', 'ai:use', 'business:read',
  ],
  SALES: ['dashboard:read', 'customer:read', 'customer:write', 'product:read', 'invoice:read', 'invoice:write', 'order:read'],
  STAFF: ['dashboard:read', 'customer:read', 'customer:write', 'product:read', 'invoice:read', 'invoice:write', 'order:read'],
  VIEWER: ['dashboard:read', 'customer:read', 'product:read', 'invoice:read', 'payment:read', 'order:read', 'report:read', 'subscription:read', 'ai:use', 'business:read'],
  AUDITOR: ['dashboard:read', 'invoice:read', 'payment:read', 'order:read', 'report:read', 'audit:read', 'ai:use', 'business:read'],
};

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(REQUIRED_PERMISSIONS, [
      context.getHandler(), context.getClass(),
    ]) || [];
    if (!required.length) return true;

    const request = context.switchToHttp().getRequest();
    const role = request.activeTenantRole as string | undefined;
    const explicit = (request.activeTenantPermissions || []) as string[];
    const grants = new Set([...(ROLE_PERMISSIONS[role || ''] || []), ...explicit]);
    if (grants.has('*') || required.every((permission) => grants.has(permission))) return true;
    throw new ForbiddenException('Your workspace role does not allow this action');
  }
}

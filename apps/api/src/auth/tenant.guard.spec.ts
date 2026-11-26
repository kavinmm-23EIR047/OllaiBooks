import { ForbiddenException } from '@nestjs/common';
import { TenantGuard } from './tenant.guard';

const contextFor = (request: any) => ({ switchToHttp: () => ({ getRequest: () => request }) }) as any;

describe('TenantGuard', () => {
  it('rejects a tenant outside the authenticated memberships', async () => {
    const guard = new TenantGuard({} as any);
    const request = { user: { isPlatformAdmin: false, tenantMemberships: [{ tenantId: 'tenant-a', role: 'OWNER' }] }, headers: { 'x-tenant-id': 'tenant-b' } };
    await expect(guard.canActivate(contextFor(request))).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('binds tenant context from a verified membership', async () => {
    const guard = new TenantGuard({} as any);
    const request: any = { user: { isPlatformAdmin: false, tenantMemberships: [{ tenantId: 'tenant-a', role: 'ACCOUNTANT', permissions: ['invoice:read'] }] }, headers: { 'x-tenant-id': 'tenant-a' } };
    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request.activeTenantId).toBe('tenant-a');
    expect(request.activeTenantRole).toBe('ACCOUNTANT');
  });
});

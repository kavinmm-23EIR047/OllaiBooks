export interface AuthUserPayload {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  isPlatformAdmin: boolean;
  tenantMemberships: Array<{
    tenantId: string;
    role: 'OWNER' | 'ADMIN' | 'MANAGER' | 'ACCOUNTANT' | 'SALES' | 'STAFF' | 'VIEWER' | 'AUDITOR';
    permissions: string[];
  }>;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUserPayload;
  activeTenantId?: string;
  activeTenantRole?: string;
}

'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ApiClient } from '@/lib/api-client';

export function AuthenticatedWorkspace({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    const token = sessionStorage.getItem('billpilot_jwt_token');
    if (!token) { router.replace('/login'); return; }
    ApiClient.get('/auth/me').then(() => setReady(true)).catch(() => {
      sessionStorage.removeItem('billpilot_jwt_token');
      sessionStorage.removeItem('billpilot_active_tenant_id');
      router.replace('/login');
    });
  }, [router]);
  if (!ready) return <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">Checking secure workspace session…</div>;
  return <>{children}</>;
}

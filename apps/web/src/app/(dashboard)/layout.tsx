import * as React from 'react';
import { DashboardShell } from '@/components/layout/dashboard-shell';
import { AuthenticatedWorkspace } from '@/components/layout/authenticated-workspace';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthenticatedWorkspace>
      <DashboardShell>{children}</DashboardShell>
    </AuthenticatedWorkspace>
  );
}

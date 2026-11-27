'use client';

import * as React from 'react';
import { CrmTopbar } from './crm-topbar';
import { AiVoiceActionWidget } from '@/components/ai/ai-voice-action-widget';
import { ToastProvider } from '@/components/ui/toast-provider';
import { useCrmBackgroundSync } from '@/lib/crm-store';

interface DashboardShellProps {
  children: React.ReactNode;
}

/** ollaiBooks CRM workspace: navy top bar + silver module tabs (Zoho-style layout, ollaiBooks design). */
export function DashboardShell({ children }: DashboardShellProps) {
  useCrmBackgroundSync();
  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col bg-silver-50 text-slate-900">
        <CrmTopbar />
        <main className="mx-auto w-full max-w-[1920px] flex-1 p-3 sm:p-5 lg:p-6">
          {children}
        </main>
        <AiVoiceActionWidget />
      </div>
    </ToastProvider>
  );
}

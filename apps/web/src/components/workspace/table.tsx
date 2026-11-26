import * as React from 'react';
import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';
import { LoadingSpinner } from '../ui/loading-spinner';

export function WorkspaceTablePanel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-[6px] border border-[#E2E8F0] bg-white shadow-xs',
        className,
      )}
    >
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

export function WorkspaceTableLoadingState({ message = 'Loading workspace records...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-[#334155] animate-pop-in">
      <LoadingSpinner size="lg" variant="brand" />
      <p className="text-[14px] font-semibold text-[#0F172A] mt-3">{message}</p>
      <span className="text-[12px] text-[#64748B] mt-0.5">Synchronizing multi-tenant ledger...</span>
    </div>
  );
}

export function WorkspaceTableEmptyState({
  title = 'No records found',
  description = 'Get started by creating a new entry or adjusting filters.',
  action,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-14 px-4 text-center animate-pop-in">
      <div className="rounded-[6px] bg-[#E6F4FF] border border-[#91CAFF] p-3 text-[#0066FF] mb-3">
        <Inbox className="h-6 w-6 text-[#0066FF]" />
      </div>
      <h3 className="text-[16px] font-bold text-[#0F172A] mb-1">{title}</h3>
      <p className="text-[13px] text-[#475569] max-w-sm mb-4 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
}

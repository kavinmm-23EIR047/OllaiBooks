'use client';

import * as React from 'react';
import Link from 'next/link';
import { Bell, Search, HelpCircle, Menu, X, Mic } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AiCopilotModal } from '../ai/ai-copilot-modal';
import { AiSymbol } from '../ui/ai-symbol';

export interface DashboardHeaderProps {
  mobileMenuOpen?: boolean;
  onToggleMobileMenu?: () => void;
}

export function DashboardHeader({ mobileMenuOpen, onToggleMobileMenu }: DashboardHeaderProps) {
  const router = useRouter();
  const [workspaces, setWorkspaces] = React.useState<Array<{ tenantId: string; tenantName: string }>>([]);
  const [tenantId, setTenantId] = React.useState('');
  const [isAiOpen, setIsAiOpen] = React.useState(false);

  React.useEffect(() => {
    try {
      setWorkspaces(JSON.parse(sessionStorage.getItem('billpilot_workspaces') || '[]'));
      setTenantId(sessionStorage.getItem('billpilot_active_tenant_id') || '');
    } catch {
      setWorkspaces([]);
    }
  }, []);

  const signOut = () => {
    sessionStorage.removeItem('billpilot_jwt_token');
    sessionStorage.removeItem('billpilot_active_tenant_id');
    sessionStorage.removeItem('billpilot_workspaces');
    router.replace('/login');
  };

  return (
    <>
      <header className="h-[60px] border-b border-[#E2E8F0] bg-white px-3 sm:px-5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-md">
          {/* Mobile Hamburger Toggle (Visible on Mobile & Tablet) */}
          {onToggleMobileMenu && (
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden flex h-9 w-9 items-center justify-center rounded-[3px] border border-[#CBD5E1] bg-white text-[#334155] hover:bg-[#F8FAFC] active:scale-95 transition-all"
              title={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          )}

          {/* Global Search - Legible 14px Input */}
          <div className="relative w-full hidden xs:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search invoices, customers, orders..."
              className="w-full h-[36px] rounded-[3px] border border-[#CBD5E1] bg-white pl-9 pr-3 text-[14px] text-[#0F172A] placeholder:text-[#64748B] focus:border-[#0066FF] focus:outline-none transition-colors"
            />
          </div>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* AI Voice Agent Action Trigger (Spoken instructions & auto execution) */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('billpilot:open-voice'))}
            className="flex items-center gap-1.5 h-[36px] px-3 rounded-[3px] bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-[13px] font-semibold transition-all cursor-pointer shadow-xs"
            title="Speak to AI Voice & Execute Actions"
          >
            <Mic className="h-4 w-4" />
            <span className="hidden sm:inline">AI Voice</span>
          </button>

          {/* AI Copilot Trigger Button (Brighter Secondary Accent) */}
          <button
            onClick={() => setIsAiOpen(true)}
            className="flex items-center gap-1.5 h-[36px] px-3 rounded-[3px] bg-[#E6F4FF] hover:bg-[#BAE0FF] active:scale-[0.98] text-[#0066FF] text-[13px] font-semibold border border-[#91CAFF] transition-all cursor-pointer shadow-xs"
            title="Open AI Business Copilot"
          >
            <AiSymbol className="h-4 w-4 fill-[#0066FF]" />
            <span className="hidden sm:inline">Copilot</span>
          </button>

          {/* Documentation Help */}
          <button
            className="flex h-[36px] w-[36px] items-center justify-center rounded-[3px] text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] active:scale-[0.98] transition-all"
            title="Documentation"
          >
            <HelpCircle className="h-4.5 w-4.5" />
          </button>

          {/* Notifications */}
          <button
            className="relative flex h-[36px] w-[36px] items-center justify-center rounded-[3px] text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] active:scale-[0.98] transition-all"
            title="Notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-[#0066FF]" />
          </button>

          <div className="h-4 w-px bg-[#E2E8F0] mx-1 hidden sm:block" />

          {/* Profile & Logout */}
          <div className="flex items-center gap-2">
            <div className="h-[30px] w-[30px] rounded-[3px] bg-[#0066FF] text-white flex items-center justify-center font-bold text-[13px]">
              A
            </div>
            <span className="text-[14px] font-semibold text-[#0F172A] hidden md:inline">
              Acme Corp
            </span>

            <button
              onClick={signOut}
              className="text-[13px] font-medium text-[#475569] hover:text-[#DC2626] ml-1 px-2 py-1 rounded-[2px] hover:bg-[#FEF2F2] transition-colors cursor-pointer"
              title="Sign Out"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* AI Assistant Modal */}
      <AiCopilotModal isOpen={isAiOpen} onClose={() => setIsAiOpen(false)} />
    </>
  );
}

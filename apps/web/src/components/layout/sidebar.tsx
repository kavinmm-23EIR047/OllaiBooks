'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutGrid,
  FileText,
  Users,
  CreditCard,
  Mic,
  MessageSquare,
  SlidersHorizontal,
  BarChart2,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Package,
  Zap,
  ShieldCheck,
  X,
  CakeSlice,
} from 'lucide-react';
import { AiSymbol } from '../ui/ai-symbol';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  aiBadge?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// Streamlined, focused, clean navigation without overwhelming bloat
const primaryNavigationSections: NavSection[] = [
  {
    title: 'CORE CRM & BILLING',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
      { name: 'Invoices', href: '/invoices', icon: FileText },
      { name: 'Offline Bakery POS', href: '/offline-pos', icon: CakeSlice },
      { name: 'Payments', href: '/payments', icon: CreditCard },
      { name: 'Customers', href: '/customers', icon: Users },
    ],
  },
  {
    title: 'AI & AUTOMATIONS',
    items: [
      { name: 'AI Voice Agent', href: '/voice-agent', icon: Mic, aiBadge: true },
      { name: 'WhatsApp Assistant', href: '/whatsapp', icon: MessageSquare },
      { name: 'Reports & Audits', href: '/reports', icon: BarChart2 },
      { name: 'Settings & GST', href: '/settings', icon: SlidersHorizontal },
    ],
  },
];

const secondaryNavItems: NavItem[] = [
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Products & Catalog', href: '/products', icon: Package },
  { name: 'Visual Automations', href: '/automations', icon: Zap },
  { name: 'Admin Console', href: '/admin', icon: ShieldCheck },
];

export function DashboardSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [showMoreTools, setShowMoreTools] = React.useState(false);

  return (
    <aside className="w-[230px] border-r border-[#E2E8F0] bg-white flex flex-col h-screen sticky top-0 z-30 select-none">
      {/* Brand Header */}
      <div className="h-[60px] flex items-center justify-between px-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-[#0066FF] text-white flex-shrink-0 shadow-sm">
            <AiSymbol className="h-4.5 w-4.5 fill-white" />
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-[#0F172A] text-[16px] tracking-tight block leading-none">
                ollaiBooks
              </span>
              <span className="text-[10px] font-extrabold text-[#0066FF] bg-[#E6F4FF] px-1.5 py-0.5 rounded-[2px] leading-tight border border-[#91CAFF]">
                AI CRM
              </span>
            </div>
            <span className="block text-[11px] text-[#475569] font-medium mt-0.5">
              Enterprise Billing & CRM
            </span>
          </div>
        </div>

        {/* Close Button on Mobile Drawer */}
        {onNavigate && (
          <button
            onClick={onNavigate}
            className="md:hidden p-1.5 rounded-[3px] text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
            title="Close Menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-3 space-y-4">
        {primaryNavigationSections.map((section, idx) => (
          <div key={section.title} className={cn(idx > 0 && 'pt-1')}>
            <div className="px-4 py-1 text-[10px] font-bold text-[#64748B] uppercase tracking-wider">
              {section.title}
            </div>

            <div className="mt-1 space-y-0.5">
              {section.items.map((item) => {
                const isActive = item.exact
                  ? pathname === item.href
                  : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      'group flex items-center justify-between h-[36px] px-4 text-[13px] transition-colors duration-100',
                      isActive
                        ? 'bg-[#E6F4FF] text-[#0066FF] font-semibold border-l-[3px] border-[#0066FF]'
                        : 'text-[#334155] hover:bg-[#F0F7FF] hover:text-[#0F172A] border-l-[3px] border-transparent'
                    )}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={cn(
                          'h-[17px] w-[17px] flex-shrink-0',
                          isActive
                            ? 'text-[#0066FF] stroke-[2.2]'
                            : 'text-[#64748B] group-hover:text-[#0F172A] stroke-[1.8]'
                        )}
                      />
                      <span className="truncate">{item.name}</span>
                    </div>

                    {item.aiBadge && (
                      <span
                        className={cn(
                          'rounded-[2px] px-1.5 py-0.2 text-[9px] font-bold uppercase border',
                          isActive
                            ? 'bg-white text-[#0066FF] border-[#91CAFF]'
                            : 'bg-[#F1F5F9] text-[#0066FF] border-[#E2E8F0]'
                        )}
                      >
                        VOICE
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* Clean Collapsible for Secondary Tools */}
        <div className="px-3 pt-1">
          <button
            type="button"
            onClick={() => setShowMoreTools(!showMoreTools)}
            className="flex w-full items-center justify-between px-2 py-1.5 text-[11px] font-semibold text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded transition-colors"
          >
            <span>{showMoreTools ? 'Hide Extra Tools' : 'More Tools (Orders, Catalog…)'}</span>
            {showMoreTools ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
          </button>

          {showMoreTools && (
            <div className="mt-1 space-y-0.5 border-l-2 border-[#E2E8F0] ml-2 pl-1 animate-pop-in">
              {secondaryNavItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      'flex items-center gap-2 h-[32px] px-2 text-[12px] rounded transition-colors',
                      isActive
                        ? 'bg-[#E6F4FF] text-[#0066FF] font-semibold'
                        : 'text-[#475569] hover:bg-[#F0F7FF] hover:text-[#0F172A]'
                    )}
                  >
                    <Icon className="h-4 w-4 text-[#64748B]" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Tenant Label & Public Website Link */}
      <div className="p-3 border-t border-[#E2E8F0] bg-[#F8FAFC] space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-[3px] bg-[#E6F4FF] text-[#0066FF] border border-[#91CAFF] flex items-center justify-center font-bold text-[12px] flex-shrink-0">
            A
          </div>
          <div className="truncate">
            <span className="block text-[12px] font-semibold text-[#0F172A] truncate leading-tight">
              Acme Corporation
            </span>
            <span className="block text-[10px] text-[#475569] leading-none mt-0.5">
              GSTIN: 29ABCDE1234F1Z5
            </span>
          </div>
        </div>

        <Link
          href="/"
          className="flex items-center justify-between text-[11px] font-semibold text-[#0066FF] hover:text-[#0052CC] bg-white border border-[#CBD5E1] rounded px-2.5 py-1.5 transition-colors"
          title="Open Public Marketing & Landing Homepage"
        >
          <span>View Public Homepage</span>
          <span className="text-[10px]">↗</span>
        </Link>
      </div>
    </aside>
  );
}

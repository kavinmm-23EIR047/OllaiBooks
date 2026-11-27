'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart2, Bell, Briefcase, CalendarCheck, ChevronDown, Cloud, CloudOff, CreditCard, FileText,
  LayoutGrid, LogOut, Menu, MessageSquare, Mic, Package, Plus, RefreshCw, Search, Settings2,
  ShieldCheck, ShoppingCart, Store, Target, Users, X, Zap, Plug, Repeat,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AiSymbol } from '../ui/ai-symbol';
import { AiCopilotModal } from '../ai/ai-copilot-modal';
import { useNotify } from '../ui/toast-provider';
import { syncCrm, useCrm, useOnlineStatus } from '@/lib/crm-store';

type Tab = { name: string; href: string; icon: React.ComponentType<{ className?: string }> };

export const CRM_TABS: Tab[] = [
  { name: 'Home', href: '/dashboard', icon: LayoutGrid },
  { name: 'Leads', href: '/leads', icon: Target },
  { name: 'Deals', href: '/deals', icon: Briefcase },
  { name: 'Contacts', href: '/customers', icon: Users },
  { name: 'Activities', href: '/activities', icon: CalendarCheck },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Payments', href: '/payments', icon: CreditCard },
  { name: 'Offline Billing', href: '/offline-pos', icon: Store },
];

export const CRM_MORE_TABS: Tab[] = [
  { name: 'Reports', href: '/reports', icon: BarChart2 },
  { name: 'Automations', href: '/automations', icon: Zap },
  { name: 'WhatsApp', href: '/whatsapp', icon: MessageSquare },
  { name: 'AI Voice Agent', href: '/voice-agent', icon: Mic },
  { name: 'Integrations', href: '/integrations', icon: Plug },
  { name: 'Subscriptions', href: '/subscriptions', icon: Repeat },
  { name: 'Settings & GST', href: '/settings', icon: Settings2 },
  { name: 'Admin Console', href: '/admin', icon: ShieldCheck },
];

const QUICK_CREATE = [
  { label: 'Lead', href: '/leads?new=1', icon: Target },
  { label: 'Deal', href: '/deals?new=1', icon: Briefcase },
  { label: 'Task / follow-up', href: '/activities?new=1', icon: CalendarCheck },
  { label: 'Invoice', href: '/invoices', icon: FileText },
  { label: 'Counter bill', href: '/offline-pos', icon: Store },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function useOutsideClose(open: boolean, close: () => void) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close(); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open, close]);
  return ref;
}

function GlobalSearch() {
  const router = useRouter();
  const { leads, deals } = useCrm();
  const [q, setQ] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const ref = useOutsideClose(open, () => setOpen(false));
  const term = q.trim().toLowerCase();
  const results = React.useMemo(() => {
    if (term.length < 2) return [];
    const leadHits = leads.filter((l) => [l.name, l.company, l.phone, l.email].some((v) => v?.toLowerCase().includes(term))).slice(0, 4)
      .map((l) => ({ id: l.id, label: l.name, sub: `Lead · ${l.company || l.phone || l.status}`, href: `/leads?open=${l.id}` }));
    const dealHits = deals.filter((d) => [d.title, d.contactName, d.company].some((v) => v?.toLowerCase().includes(term))).slice(0, 4)
      .map((d) => ({ id: d.id, label: d.title, sub: `Deal · ${d.contactName}`, href: `/deals?open=${d.id}` }));
    return [...leadHits, ...dealHits];
  }, [term, leads, deals]);

  return (
    <div ref={ref} className="relative w-full max-w-md">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/60" />
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder="Search leads, deals, contacts…"
        className="h-9 w-full rounded-md border border-white/15 bg-white/10 pl-9 pr-3 text-[13px] text-white placeholder:text-white/55 focus:border-white/40 focus:bg-white/15 focus:outline-none"
        aria-label="Global search"
      />
      {open && term.length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 overflow-hidden rounded-lg border border-silver-200 bg-white shadow-xl">
          {results.length ? results.map((r) => (
            <button key={r.id} type="button" onClick={() => { setOpen(false); setQ(''); router.push(r.href); }} className="flex w-full flex-col items-start px-3 py-2 text-left hover:bg-blue-50">
              <span className="text-[13px] font-semibold text-slate-900">{r.label}</span>
              <span className="text-[11px] text-silver-600">{r.sub}</span>
            </button>
          )) : <div className="px-3 py-3 text-[12px] text-silver-600">No leads or deals match “{q}”.</div>}
          <div className="flex gap-3 border-t border-silver-100 bg-silver-50 px-3 py-2 text-[11px] font-semibold">
            <Link href="/customers" onClick={() => setOpen(false)} className="text-blue-700 hover:underline">Search contacts →</Link>
            <Link href="/invoices" onClick={() => setOpen(false)} className="text-blue-700 hover:underline">Search invoices →</Link>
          </div>
        </div>
      )}
    </div>
  );
}

function SyncPill() {
  const online = useOnlineStatus();
  const { pendingCount, syncing, lastSyncedAt } = useCrm();
  const notify = useNotify();
  const onClick = async () => {
    if (!online) {
      notify('offline', 'You’re offline right now', pendingCount
        ? `${pendingCount} CRM change${pendingCount === 1 ? ' is' : 's are'} saved and encrypted on this device. They’ll sync automatically when the internet is back.`
        : 'Everything is already synced. Anything you add now is saved on this device and syncs later.', { duration: 7000 });
      return;
    }
    notify('sync', 'Syncing…', 'Sending your changes and fetching the latest from your team.', { duration: 2000 });
    const r = await syncCrm();
    if (r.status === 'ok') notify('success', 'All caught up', `${r.pushed} sent · ${r.pulled} updated from cloud${r.conflicts ? ` · ${r.conflicts} kept newer cloud copy` : ''}.`);
    else if (r.status === 'offline') notify('offline', 'You went offline', 'Your changes are safe here and will sync later.');
    else if (r.status === 'no-session') notify('warning', 'Please sign in again', 'Your session expired. Your changes are safe on this device.');
    else if (r.status === 'error') notify('error', 'Sync didn’t go through', `${r.message}. Your changes are safe and we’ll retry automatically.`);
  };
  return (
    <button
      type="button"
      onClick={onClick}
      title={lastSyncedAt ? `Last synced ${new Date(lastSyncedAt).toLocaleString('en-IN')}` : 'Sync now'}
      className={cn(
        'flex h-9 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-semibold transition-colors',
        !online ? 'bg-amber-400/20 text-amber-100 ring-1 ring-amber-300/50' : pendingCount ? 'bg-white/15 text-white ring-1 ring-white/25' : 'bg-emerald-400/15 text-emerald-100 ring-1 ring-emerald-300/30',
      )}
    >
      {!online ? <CloudOff className="h-4 w-4" /> : syncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
      <span className="hidden lg:inline">{!online ? 'Offline' : syncing ? 'Syncing' : pendingCount ? 'Sync' : 'Synced'}</span>
      {pendingCount > 0 && <span className="grid h-[18px] min-w-[18px] place-items-center rounded-full bg-white px-1 text-[10px] font-bold text-navy-800">{pendingCount}</span>}
    </button>
  );
}

export function CrmTopbar() {
  const pathname = usePathname() || '';
  const router = useRouter();
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [aiOpen, setAiOpen] = React.useState(false);
  const [workspace, setWorkspace] = React.useState('My business');
  const moreRef = useOutsideClose(moreOpen, () => setMoreOpen(false));
  const createRef = useOutsideClose(createOpen, () => setCreateOpen(false));
  const profileRef = useOutsideClose(profileOpen, () => setProfileOpen(false));
  const online = useOnlineStatus();

  React.useEffect(() => {
    try {
      const list = JSON.parse(sessionStorage.getItem('billpilot_workspaces') || '[]') as Array<{ tenantId: string; tenantName: string }>;
      const active = sessionStorage.getItem('billpilot_active_tenant_id');
      setWorkspace(list.find((w) => w.tenantId === active)?.tenantName || list[0]?.tenantName || 'My business');
    } catch { /* ignore */ }
  }, []);

  React.useEffect(() => { setDrawerOpen(false); setMoreOpen(false); }, [pathname]);

  const signOut = () => {
    sessionStorage.removeItem('billpilot_jwt_token');
    sessionStorage.removeItem('billpilot_active_tenant_id');
    sessionStorage.removeItem('billpilot_workspaces');
    router.replace('/login');
  };

  const moreActive = CRM_MORE_TABS.find((t) => isActive(pathname, t.href));

  return (
    <>
      <header className="sticky top-0 z-40">
        {/* Row 1 — navy chrome */}
        <div className="flex h-14 items-center gap-2 bg-gradient-to-r from-navy-900 via-navy-800 to-navy-700 px-3 text-white sm:gap-3 sm:px-5">
          <button type="button" onClick={() => setDrawerOpen(true)} className="grid h-9 w-9 place-items-center rounded-md hover:bg-white/10 lg:hidden" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="flex flex-shrink-0 items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-white shadow-sm">
              <AiSymbol className="h-4 w-4 fill-blue-600" />
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-[15px] font-extrabold tracking-tight">ollaiBooks</span>
              <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-silver-300">CRM · Billing</span>
            </span>
          </Link>

          <div className="mx-2 hidden flex-1 justify-center md:flex"><GlobalSearch /></div>
          <div className="flex-1 md:hidden" />

          <div ref={createRef} className="relative">
            <button type="button" onClick={() => setCreateOpen((v) => !v)} className="flex h-9 items-center gap-1 rounded-md bg-blue-500 px-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-blue-400" aria-haspopup="menu" aria-expanded={createOpen}>
              <Plus className="h-4 w-4" /><span className="hidden sm:inline">Create</span>
            </button>
            {createOpen && (
              <div role="menu" className="absolute right-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-lg border border-silver-200 bg-white py-1 text-slate-800 shadow-xl">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-silver-500">Quick create</div>
                {QUICK_CREATE.map((q) => (
                  <Link key={q.label} href={q.href} role="menuitem" onClick={() => setCreateOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium hover:bg-blue-50 hover:text-blue-700">
                    <q.icon className="h-4 w-4 text-silver-500" /> {q.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <SyncPill />

          <button type="button" onClick={() => window.dispatchEvent(new CustomEvent('billpilot:open-voice'))} className="hidden h-9 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-semibold hover:bg-white/10 sm:flex" title="AI Voice">
            <Mic className="h-4 w-4" /><span className="hidden xl:inline">Voice</span>
          </button>
          <button type="button" onClick={() => setAiOpen(true)} className="hidden h-9 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-semibold hover:bg-white/10 sm:flex" title="AI Copilot">
            <AiSymbol className="h-4 w-4 fill-white" /><span className="hidden xl:inline">Copilot</span>
          </button>
          <button type="button" className="relative hidden h-9 w-9 place-items-center rounded-md hover:bg-white/10 sm:grid" title="Notifications">
            <Bell className="h-4.5 w-4.5" />
          </button>

          <div ref={profileRef} className="relative">
            <button type="button" onClick={() => setProfileOpen((v) => !v)} className="flex items-center gap-2 rounded-md py-1 pl-1 pr-2 hover:bg-white/10" aria-haspopup="menu">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-silver-100 to-silver-300 text-[13px] font-extrabold text-navy-800">{workspace.slice(0, 1).toUpperCase()}</span>
              <ChevronDown className="hidden h-3.5 w-3.5 opacity-70 sm:block" />
            </button>
            {profileOpen && (
              <div role="menu" className="absolute right-0 top-full z-50 mt-1.5 w-60 overflow-hidden rounded-lg border border-silver-200 bg-white text-slate-800 shadow-xl">
                <div className="border-b border-silver-100 bg-silver-50 px-3 py-2.5">
                  <div className="text-[13px] font-bold">{workspace}</div>
                  <div className="flex items-center gap-1.5 text-[11px] text-silver-600">
                    <span className={cn('h-2 w-2 rounded-full', online ? 'bg-emerald-500' : 'bg-amber-500')} />
                    {online ? 'Online' : 'Offline — changes save on this device'}
                  </div>
                </div>
                <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-blue-50"><Settings2 className="h-4 w-4 text-silver-500" /> Settings &amp; GST</Link>
                <button type="button" onClick={signOut} className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-rose-600 hover:bg-rose-50"><LogOut className="h-4 w-4" /> Sign out</button>
              </div>
            )}
          </div>
        </div>

        {/* Row 2 — silver module tabs */}
        <nav className="hidden h-11 items-stretch border-b border-silver-300 bg-gradient-to-b from-silver-50 to-silver-100 px-3 lg:flex" aria-label="Modules">
          {CRM_TABS.map((t) => {
            const active = isActive(pathname, t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  'relative flex items-center gap-1.5 px-3 text-[13px] font-semibold transition-colors',
                  active ? 'bg-white text-blue-700 shadow-[inset_0_-3px_0_0_#2563eb]' : 'text-silver-700 hover:bg-white/70 hover:text-slate-900',
                )}
              >
                <t.icon className={cn('h-4 w-4', active ? 'text-blue-600' : 'text-silver-500')} />
                {t.name}
              </Link>
            );
          })}
          <div ref={moreRef} className="relative flex">
            <button type="button" onClick={() => setMoreOpen((v) => !v)} className={cn('flex items-center gap-1 px-3 text-[13px] font-semibold', moreActive ? 'bg-white text-blue-700 shadow-[inset_0_-3px_0_0_#2563eb]' : 'text-silver-700 hover:bg-white/70')} aria-haspopup="menu" aria-expanded={moreOpen}>
              {moreActive ? moreActive.name : 'More'} <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {moreOpen && (
              <div role="menu" className="absolute left-0 top-full z-50 mt-0.5 grid w-[420px] grid-cols-2 gap-0.5 rounded-lg border border-silver-200 bg-white p-1.5 shadow-xl">
                {CRM_MORE_TABS.map((t) => (
                  <Link key={t.href} href={t.href} role="menuitem" className={cn('flex items-center gap-2 rounded-md px-2.5 py-2 text-[13px] font-medium', isActive(pathname, t.href) ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-silver-50')}>
                    <t.icon className="h-4 w-4 text-silver-500" /> {t.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        {!online && (
          <div className="flex items-center justify-center gap-2 border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-center text-[12px] font-medium text-amber-900">
            <CloudOff className="h-3.5 w-3.5 flex-shrink-0" />
            You’re offline. Leads, deals and tasks you add are saved securely on this device and sync when you reconnect.
          </div>
        )}
      </header>

      {/* Mobile / tablet drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" aria-label="Close menu" className="absolute inset-0 bg-navy-900/50" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] max-w-[85vw] flex-col bg-white shadow-2xl">
            <div className="flex h-14 items-center justify-between bg-navy-800 px-4 text-white">
              <span className="font-extrabold">ollaiBooks</span>
              <button type="button" onClick={() => setDrawerOpen(false)} className="grid h-8 w-8 place-items-center rounded hover:bg-white/10" aria-label="Close"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-3 md:hidden"><div className="rounded-md bg-navy-800 p-1"><GlobalSearch /></div></div>
            <nav className="flex-1 overflow-y-auto px-2 pb-4">
              {[{ title: 'Modules', items: CRM_TABS }, { title: 'More', items: CRM_MORE_TABS }].map((g) => (
                <div key={g.title} className="mt-2">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-silver-500">{g.title}</div>
                  {g.items.map((t) => (
                    <Link key={t.href} href={t.href} className={cn('flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[14px] font-medium', isActive(pathname, t.href) ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-silver-50')}>
                      <t.icon className={cn('h-4 w-4', isActive(pathname, t.href) ? 'text-blue-600' : 'text-silver-500')} /> {t.name}
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <AiCopilotModal isOpen={aiOpen} onClose={() => setAiOpen(false)} />
    </>
  );
}

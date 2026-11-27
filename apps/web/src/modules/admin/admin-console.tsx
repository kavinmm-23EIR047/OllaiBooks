'use client';

import * as React from 'react';
import {
  Activity, AlertCircle, ArrowDownToLine, Building2, CheckCircle2, Clock, CloudOff, Database, Eye, EyeOff, KeyRound,
  LayoutGrid, Lock, LogOut, Menu, Package, Plus, RefreshCw, Rocket, Search, ShieldCheck, Trash2, UserCog, Users, Wifi, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AiSymbol } from '@/components/ui/ai-symbol';
import { ToastProvider, useNotify } from '@/components/ui/toast-provider';
import { Avatar, Btn, EmptyState, Field, inputCls, Pill, relativeTime, SidePanel, StatStrip } from '@/components/crm/crm-ui';

/* ------------------------------------------------------------------ */
/* Admin session + API                                                 */
/* ------------------------------------------------------------------ */

const SESSION_KEY = 'ollaibooks_admin_session';
type AdminSession = { token: string; adminId: string; expiresAt: string };

function readSession(): AdminSession | null {
  try {
    const s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') as AdminSession | null;
    return s && new Date(s.expiresAt).getTime() > Date.now() ? s : null;
  } catch { return null; }
}

class AdminAuthError extends Error {}

async function adminApi<T = any>(session: AdminSession, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/v1/admin-bridge${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.token}`, ...(init?.headers || {}) },
  });
  if (res.status === 401) throw new AdminAuthError('Your admin session ended. Please sign in again.');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message.join(', ') : data.message || `Request failed (${res.status})`);
  return data as T;
}

const PASSWORD_RULES = (p: string) => [
  { label: '8+ characters', ok: p.length >= 8 },
  { label: 'A letter', ok: /[A-Za-z]/.test(p) },
  { label: 'A number', ok: /\d/.test(p) },
];

function PasswordInput({ value, onChange, placeholder, autoComplete, id }: { value: string; onChange: (v: string) => void; placeholder?: string; autoComplete?: string; id?: string }) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="relative">
      <input id={id} type={show ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} className={cn(inputCls, 'pr-10')} />
      <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show} className="absolute inset-y-0 right-0 grid w-9 place-items-center text-silver-500 hover:text-blue-600">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return `${Array.from(bytes, (b) => chars[b % chars.length]).join('')}7k`;
}

function downloadJson(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ------------------------------------------------------------------ */
/* Login                                                               */
/* ------------------------------------------------------------------ */

function AdminLogin({ onLogin }: { onLogin: (s: AdminSession) => void }) {
  const [adminId, setAdminId] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) { setError('Admin password has at least 8 characters.'); return; }
    setBusy(true);
    try {
      const res = await fetch('/api/v1/admin-bridge/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminId: adminId.trim(), password }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Could not sign in.');
      const session: AdminSession = { token: data.token, adminId: data.adminId, expiresAt: data.expiresAt };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      onLogin(session);
    } catch (err) {
      setError(err instanceof TypeError ? 'Can’t reach the ollaiBooks API. Check that the server is running.' : (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-navy-900 via-navy-800 to-blue-700 px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-7 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-navy-800 text-white shadow-lg"><ShieldCheck className="h-5 w-5" /></span>
          <div>
            <h1 className="text-[19px] font-extrabold text-slate-900">ollaiBooks Admin</h1>
            <p className="text-[12px] text-silver-600">Platform control — authorised staff only</p>
          </div>
        </div>
        <div className="space-y-3">
          <Field label="Admin ID"><input className={inputCls} value={adminId} onChange={(e) => setAdminId(e.target.value)} autoComplete="username" autoFocus required /></Field>
          <Field label="Password"><PasswordInput value={password} onChange={setPassword} autoComplete="current-password" placeholder="At least 8 characters" /></Field>
        </div>
        {error && <p role="alert" className="mt-3 flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-medium text-rose-700"><AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />{error}</p>}
        <Btn type="submit" variant="primary" disabled={busy || !adminId || !password} className="mt-5 h-10 w-full">{busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Sign in securely</Btn>
        <p className="mt-4 text-center text-[11px] leading-relaxed text-silver-500">Credentials are set in <code className="rounded bg-silver-100 px-1">apps/api/.env</code> (ADMIN_ID, ADMIN_PASSWORD). 5 wrong attempts lock sign-in for 15 minutes.</p>
      </form>
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

type Section = 'overview' | 'members' | 'subscriptions' | 'versions' | 'backups' | 'security';
const NAV: Array<{ id: Section; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'members', label: 'Members & sign-ins', icon: Users },
  { id: 'subscriptions', label: 'Subscriptions', icon: Building2 },
  { id: 'versions', label: 'App versions', icon: Rocket },
  { id: 'backups', label: 'Backups & data', icon: Database },
  { id: 'security', label: 'Security', icon: ShieldCheck },
];

const DAY = 864e5;

function SectionCard({ title, subtitle, actions, children, className }: { title: string; subtitle?: string; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('overflow-hidden rounded-xl border border-silver-200 bg-white shadow-sm', className)}>
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-silver-200 bg-gradient-to-b from-white to-silver-50 px-4 py-3">
        <div><h2 className="text-[14px] font-extrabold text-slate-900">{title}</h2>{subtitle && <p className="text-[12px] text-silver-600">{subtitle}</p>}</div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </header>
      {children}
    </section>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
        <thead><tr className="border-b border-silver-200 bg-silver-50">{head.map((h) => <th key={h} className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-silver-600">{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function AdminApp({ session, onLogout }: { session: AdminSession; onLogout: () => void }) {
  const notify = useNotify();
  const [section, setSection] = React.useState<Section>('overview');
  const [navOpen, setNavOpen] = React.useState(false);
  const [overview, setOverview] = React.useState<any>(null);
  const [members, setMembers] = React.useState<any[]>([]);
  const [releases, setReleases] = React.useState<any[]>([]);
  const [backups, setBackups] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const call = React.useCallback(async <T,>(path: string, init?: RequestInit) => {
    try {
      return await adminApi<T>(session, path, init);
    } catch (e) {
      if (e instanceof AdminAuthError) { notify('warning', 'Signed out', e.message); onLogout(); }
      throw e;
    }
  }, [session, notify, onLogout]);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [o, m, r, b] = await Promise.all([
        call<any>('/overview'), call<any>('/members'), call<any>('/releases'), call<any>('/backups/summary'),
      ]);
      setOverview(o); setMembers(m.members || []); setReleases(r.releases || []); setBackups(b.tenants || []);
    } catch (e) {
      if (!(e instanceof AdminAuthError)) notify('error', 'Couldn’t load admin data', (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [call, notify]);

  React.useEffect(() => { void load(); }, [load]);

  // Auto sign-out when the 8-hour session ends
  React.useEffect(() => {
    const ms = new Date(session.expiresAt).getTime() - Date.now();
    const t = window.setTimeout(() => { notify('info', 'Admin session ended', 'Please sign in again.'); onLogout(); }, Math.max(0, ms));
    return () => window.clearTimeout(t);
  }, [session.expiresAt, notify, onLogout]);

  const onlineToday = members.filter((m) => m.lastLoginAt && Date.now() - new Date(m.lastLoginAt).getTime() < DAY).length;
  const offlineUsers = members.filter((m) => m.usesOfflineApp).length;

  return (
    <div className="flex min-h-screen bg-silver-50 text-slate-900">
      {/* Sidebar */}
      <aside className={cn('fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-gradient-to-b from-navy-900 to-navy-800 text-white transition-transform lg:static lg:translate-x-0', navOpen ? 'translate-x-0' : '-translate-x-full')}>
        <div className="flex h-14 items-center gap-2.5 border-b border-white/10 px-4">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-white"><AiSymbol className="h-4 w-4 fill-blue-600" /></span>
          <div className="leading-tight"><b className="block text-[14px]">ollaiBooks</b><span className="text-[10px] font-bold uppercase tracking-[0.14em] text-silver-300">Admin console</span></div>
          <button type="button" className="ml-auto grid h-8 w-8 place-items-center rounded hover:bg-white/10 lg:hidden" onClick={() => setNavOpen(false)} aria-label="Close menu"><X className="h-4 w-4" /></button>
        </div>
        <nav className="flex-1 space-y-0.5 p-2.5">
          {NAV.map((n) => (
            <button key={n.id} type="button" onClick={() => { setSection(n.id); setNavOpen(false); }} className={cn('flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-[13px] font-semibold transition-colors', section === n.id ? 'bg-white text-navy-800 shadow' : 'text-silver-200 hover:bg-white/10 hover:text-white')}>
              <n.icon className="h-4 w-4" /> {n.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3 text-[11px] text-silver-300">
          <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Session ends {relativeTime(session.expiresAt)}</div>
        </div>
      </aside>
      {navOpen && <button type="button" aria-label="Close menu" className="fixed inset-0 z-30 bg-navy-900/40 lg:hidden" onClick={() => setNavOpen(false)} />}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-silver-200 bg-white/95 px-4 backdrop-blur">
          <button type="button" className="grid h-9 w-9 place-items-center rounded-md border border-silver-300 lg:hidden" onClick={() => setNavOpen(true)} aria-label="Open menu"><Menu className="h-4 w-4" /></button>
          <h1 className="text-[16px] font-extrabold">{NAV.find((n) => n.id === section)?.label}</h1>
          <div className="ml-auto flex items-center gap-2">
            <Btn variant="ghost" onClick={() => void load()} disabled={loading}><RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> <span className="hidden sm:inline">Refresh</span></Btn>
            <span className="hidden items-center gap-2 rounded-full bg-silver-100 py-1 pl-1 pr-3 text-[12px] font-semibold sm:flex"><Avatar name={session.adminId} size={24} /> {session.adminId}</span>
            <Btn variant="secondary" onClick={onLogout}><LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Sign out</span></Btn>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1500px] flex-1 p-4 sm:p-6">
          {section === 'overview' && <OverviewSection overview={overview} members={members} onlineToday={onlineToday} offlineUsers={offlineUsers} go={setSection} />}
          {section === 'members' && <MembersSection members={members} call={call} reload={load} />}
          {section === 'subscriptions' && <SubscriptionsSection overview={overview} call={call} reload={load} />}
          {section === 'versions' && <VersionsSection releases={releases} call={call} reload={load} />}
          {section === 'backups' && <BackupsSection tenants={backups} call={call} />}
          {section === 'security' && <SecuritySection session={session} />}
        </main>
      </div>
    </div>
  );
}

type Call = <T>(path: string, init?: RequestInit) => Promise<T>;

function OverviewSection({ overview, members, onlineToday, offlineUsers, go }: { overview: any; members: any[]; onlineToday: number; offlineUsers: number; go: (s: Section) => void }) {
  const t = overview?.totals || {};
  const expiring = (overview?.tenants || []).filter((tn: any) => {
    const end = tn.subscriptions?.[0]?.currentPeriodEnd;
    return end && new Date(end).getTime() - Date.now() < 7 * DAY;
  });
  return (
    <div className="space-y-5">
      <StatStrip items={[
        { label: 'Businesses', value: t.tenants ?? '—', hint: `${t.activeTenants ?? 0} active · ${t.suspendedTenants ?? 0} suspended` },
        { label: 'Members', value: members.length, hint: `${onlineToday} signed in online today`, tone: 'silver' },
        { label: 'Offline app users', value: offlineUsers, hint: 'Members billing from the installed app', tone: 'amber' },
        { label: 'Invoices', value: t.invoices ?? '—', hint: `${t.totalOrders ?? 0} orders · ${t.customers ?? 0} customers`, tone: 'green' },
      ]} />
      <div className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Subscriptions needing attention" subtitle="Ending within 7 days or already expired" actions={<Btn onClick={() => go('subscriptions')}>Manage</Btn>}>
          {expiring.length ? (
            <ul>{expiring.slice(0, 8).map((tn: any) => { const end = tn.subscriptions[0].currentPeriodEnd; const expired = new Date(end).getTime() < Date.now(); return (
              <li key={tn.id} className="flex items-center justify-between gap-3 border-b border-silver-100 px-4 py-2.5 last:border-0">
                <span className="font-semibold">{tn.name}</span>
                <Pill tone={expired ? 'red' : 'amber'}>{expired ? 'Expired' : 'Ends'} {relativeTime(end)}</Pill>
              </li>
            ); })}</ul>
          ) : <p className="px-4 py-6 text-center text-[13px] text-silver-600">All subscriptions are healthy.</p>}
        </SectionCard>
        <SectionCard title="Recent sign-ins" subtitle="Online sign-ins and offline app syncs" actions={<Btn onClick={() => go('members')}>All members</Btn>}>
          <ul>{[...members].filter((m) => m.lastLoginAt || m.lastOfflineSyncAt).sort((a, b) => String(b.lastLoginAt || b.lastOfflineSyncAt).localeCompare(String(a.lastLoginAt || a.lastOfflineSyncAt))).slice(0, 8).map((m) => (
            <li key={m.id} className="flex items-center gap-3 border-b border-silver-100 px-4 py-2.5 last:border-0">
              <Avatar name={`${m.firstName} ${m.lastName}`} size={28} />
              <div className="min-w-0 flex-1"><div className="truncate font-semibold">{m.firstName} {m.lastName}</div><div className="truncate text-[12px] text-silver-600">{m.tenants?.[0]?.name || m.email}</div></div>
              <div className="text-right text-[11px] text-silver-600">
                {m.lastLoginAt && <div className="flex items-center justify-end gap-1"><Wifi className="h-3 w-3 text-emerald-600" /> {relativeTime(m.lastLoginAt)}</div>}
                {m.lastOfflineSyncAt && <div className="flex items-center justify-end gap-1"><CloudOff className="h-3 w-3 text-amber-600" /> synced {relativeTime(m.lastOfflineSyncAt)}</div>}
              </div>
            </li>
          ))}</ul>
          {!members.some((m) => m.lastLoginAt || m.lastOfflineSyncAt) && <p className="px-4 py-6 text-center text-[13px] text-silver-600">No sign-ins recorded yet.</p>}
        </SectionCard>
      </div>
    </div>
  );
}

function MembersSection({ members, call, reload }: { members: any[]; call: Call; reload: () => Promise<void> }) {
  const notify = useNotify();
  const [filter, setFilter] = React.useState<'all' | 'online' | 'offline' | 'disabled'>('all');
  const [q, setQ] = React.useState('');
  const [editing, setEditing] = React.useState<any>(null);
  const [form, setForm] = React.useState({ email: '', firstName: '', lastName: '', phone: '', password: '', isActive: true });
  const [saving, setSaving] = React.useState(false);

  const list = members.filter((m) => {
    const text = `${m.firstName} ${m.lastName} ${m.email} ${m.tenants?.map((t: any) => t.name).join(' ')}`.toLowerCase();
    if (q && !text.includes(q.toLowerCase())) return false;
    if (filter === 'online') return m.lastLoginAt && Date.now() - new Date(m.lastLoginAt).getTime() < DAY;
    if (filter === 'offline') return m.usesOfflineApp;
    if (filter === 'disabled') return !m.isActive;
    return true;
  });

  const open = (m: any) => { setEditing(m); setForm({ email: m.email, firstName: m.firstName, lastName: m.lastName, phone: m.phone || '', password: '', isActive: m.isActive }); };

  const save = async () => {
    if (form.password && !PASSWORD_RULES(form.password).every((r) => r.ok)) { notify('warning', 'Password too weak', 'Use 8+ characters with a letter and a number.'); return; }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (form.email !== editing.email) body.email = form.email;
      if (form.firstName !== editing.firstName) body.firstName = form.firstName;
      if (form.lastName !== editing.lastName) body.lastName = form.lastName;
      if (form.phone !== (editing.phone || '')) body.phone = form.phone;
      if (form.isActive !== editing.isActive) body.isActive = form.isActive;
      if (form.password) body.password = form.password;
      if (!Object.keys(body).length) { notify('info', 'Nothing changed'); return; }
      const res = await call<any>(`/users/${editing.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      notify('success', 'Member updated', res.message);
      setEditing(null);
      await reload();
    } catch (e) {
      notify('error', 'Update failed', (e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SectionCard
      title={`${list.length} member${list.length === 1 ? '' : 's'}`}
      subtitle="Online sign-ins come from the API; offline activity comes from bills synced by the installed app"
      actions={(
        <>
          <div className="relative"><Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-silver-400" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, business" className={cn(inputCls, 'w-60 pl-8')} /></div>
          <div className="inline-flex rounded-md border border-silver-300 bg-white p-0.5">
            {([['all', 'All'], ['online', 'Online today'], ['offline', 'Offline app'], ['disabled', 'Disabled']] as const).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setFilter(id)} className={cn('rounded px-2.5 py-1 text-[12px] font-semibold', filter === id ? 'bg-blue-600 text-white' : 'text-silver-700 hover:bg-silver-100')}>{label}</button>
            ))}
          </div>
        </>
      )}
    >
      {list.length ? (
        <Table head={['Member', 'Business & role', 'Status', 'Last online sign-in', 'Offline app', 'Subscription', '']}>
          {list.map((m) => {
            const t = m.tenants?.[0];
            const sub = t?.subscription;
            return (
              <tr key={m.id} className="border-b border-silver-100 last:border-0 hover:bg-blue-50/40">
                <td className="px-4 py-2.5"><div className="flex items-center gap-2.5"><Avatar name={`${m.firstName} ${m.lastName}`} /><div className="min-w-0"><div className="font-semibold">{m.firstName} {m.lastName} {m.isPlatformAdmin && <Pill tone="indigo">Platform admin</Pill>}</div><div className="text-[12px] text-silver-600">{m.email}</div></div></div></td>
                <td className="px-4 py-2.5">{t ? <><div className="font-medium">{t.name}</div><div className="text-[12px] text-silver-600">{t.role}{m.tenants.length > 1 ? ` · +${m.tenants.length - 1} more` : ''}</div></> : <span className="text-silver-400">—</span>}</td>
                <td className="px-4 py-2.5">{m.isActive ? <Pill tone="green">Active</Pill> : <Pill tone="red">Disabled</Pill>}</td>
                <td className="px-4 py-2.5 text-[12px]">{m.lastLoginAt ? <span className="inline-flex items-center gap-1"><Wifi className="h-3.5 w-3.5 text-emerald-600" />{relativeTime(m.lastLoginAt)}</span> : <span className="text-silver-400">Never</span>}</td>
                <td className="px-4 py-2.5 text-[12px]">{m.usesOfflineApp ? <span className="inline-flex flex-col"><span className="inline-flex items-center gap-1 font-semibold text-amber-700"><CloudOff className="h-3.5 w-3.5" />{t?.offline?.bills || 0} bills synced</span><span className="text-silver-500">last {relativeTime(m.lastOfflineSyncAt)}</span></span> : <span className="text-silver-400">Not used</span>}</td>
                <td className="px-4 py-2.5 text-[12px]">{sub ? <><Pill tone={sub.status === 'ACTIVE' ? 'blue' : 'amber'}>{sub.plan?.name} · {sub.status}</Pill><div className="mt-0.5 text-silver-500">till {new Date(sub.currentPeriodEnd).toLocaleDateString('en-IN')}</div></> : '—'}</td>
                <td className="px-4 py-2.5 text-right"><Btn className="h-8" onClick={() => open(m)}><UserCog className="h-3.5 w-3.5" /> Edit sign-in</Btn></td>
              </tr>
            );
          })}
        </Table>
      ) : <EmptyState title="No members match" body="Try another filter or search." />}

      <SidePanel open={Boolean(editing)} onClose={() => setEditing(null)} title={editing ? `${editing.firstName} ${editing.lastName}` : ''} subtitle="Edit sign-in details and access" footer={<><Btn onClick={() => setEditing(null)}>Cancel</Btn><Btn variant="primary" onClick={() => void save()} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Btn></>}>
        <div className="space-y-3 rounded-xl border border-silver-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="First name"><input className={inputCls} value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></Field>
            <Field label="Last name"><input className={inputCls} value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></Field>
          </div>
          <Field label="Sign-in email"><input className={inputCls} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Mobile"><input className={inputCls} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
          <Field label="Reset password (leave empty to keep)">
            <div className="flex gap-2"><div className="flex-1"><PasswordInput value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="New password" autoComplete="new-password" /></div><Btn onClick={() => setForm({ ...form, password: generatePassword() })}><KeyRound className="h-4 w-4" /> Generate</Btn></div>
            {form.password && <div className="mt-1 flex gap-3 text-[11px] font-semibold">{PASSWORD_RULES(form.password).map((r) => <span key={r.label} className={r.ok ? 'text-emerald-600' : 'text-silver-400'}>✓ {r.label}</span>)}</div>}
          </Field>
          <label className="flex items-center justify-between rounded-lg border border-silver-200 bg-silver-50 px-3 py-2.5">
            <span><b className="block text-[13px]">Allow sign-in</b><span className="text-[12px] text-silver-600">Turn off to block this member online. Their offline app stops working when its 7-day pass ends.</span></span>
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-5 w-5 accent-blue-600" />
          </label>
        </div>
      </SidePanel>
    </SectionCard>
  );
}

function SubscriptionsSection({ overview, call, reload }: { overview: any; call: Call; reload: () => Promise<void> }) {
  const notify = useNotify();
  const plans: Array<{ code: string; name: string; priceMonthly: any }> = overview?.plans || [];
  const tenants: any[] = overview?.tenants || [];
  const [edit, setEdit] = React.useState<any>(null);
  const [subForm, setSubForm] = React.useState({ planCode: 'STARTER', status: 'ACTIVE', periodDays: 30 });
  const [createOpen, setCreateOpen] = React.useState(false);
  const [c, setC] = React.useState({ businessName: '', firstName: '', lastName: '', email: '', phone: '', password: '', planCode: 'STARTER', periodDays: 30 });

  const saveSub = async () => {
    try {
      await call(`/tenants/${edit.id}/subscription`, { method: 'PATCH', body: JSON.stringify(subForm) });
      notify('success', 'Subscription updated', `${edit.name} · ${subForm.planCode} · ${subForm.periodDays} days`);
      setEdit(null); await reload();
    } catch (e) { notify('error', 'Update failed', (e as Error).message); }
  };
  const toggle = async (tn: any) => {
    if (!window.confirm(`${tn.isSuspended ? 'Reactivate' : 'Suspend'} ${tn.name}?`)) return;
    try { const r = await call<any>(`/tenants/${tn.id}/toggle-status`, { method: 'POST' }); notify('success', r.message); await reload(); } catch (e) { notify('error', 'Couldn’t change status', (e as Error).message); }
  };
  const create = async () => {
    if (!PASSWORD_RULES(c.password).every((r) => r.ok)) { notify('warning', 'Password too weak', 'Use 8+ characters with a letter and a number.'); return; }
    try {
      await call('/customers', { method: 'POST', body: JSON.stringify({ ...c, phone: c.phone || undefined }) });
      notify('success', 'Business created', `${c.businessName} can sign in with ${c.email}.`);
      setCreateOpen(false); setC({ businessName: '', firstName: '', lastName: '', email: '', phone: '', password: '', planCode: 'STARTER', periodDays: 30 });
      await reload();
    } catch (e) { notify('error', 'Couldn’t create business', (e as Error).message); }
  };

  return (
    <SectionCard title={`${tenants.length} businesses`} subtitle="Plans, renewal dates and access" actions={<Btn variant="primary" onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4" /> New business</Btn>}>
      <Table head={['Business', 'Owner', 'Plan', 'Status', 'Renews / ends', 'Usage', '']}>
        {tenants.map((tn) => {
          const sub = tn.subscriptions?.[0];
          const owner = tn.members?.find((m: any) => m.role === 'OWNER')?.user || tn.members?.[0]?.user;
          const daysLeft = sub ? Math.ceil((new Date(sub.currentPeriodEnd).getTime() - Date.now()) / DAY) : null;
          return (
            <tr key={tn.id} className="border-b border-silver-100 last:border-0 hover:bg-blue-50/40">
              <td className="px-4 py-2.5"><div className="font-semibold">{tn.name}</div><div className="text-[12px] text-silver-600">{tn.slug}</div></td>
              <td className="px-4 py-2.5 text-[12px]">{owner ? <>{owner.firstName} {owner.lastName}<div className="text-silver-500">{owner.email}</div></> : '—'}</td>
              <td className="px-4 py-2.5">{sub ? <Pill tone="blue">{sub.plan?.name}</Pill> : <Pill>None</Pill>}</td>
              <td className="px-4 py-2.5">{tn.isSuspended ? <Pill tone="red">Suspended</Pill> : sub ? <Pill tone={sub.status === 'ACTIVE' ? 'green' : 'amber'}>{sub.status}</Pill> : '—'}</td>
              <td className="px-4 py-2.5 text-[12px]">{sub ? <><div>{new Date(sub.currentPeriodEnd).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div><div className={daysLeft !== null && daysLeft < 7 ? 'font-semibold text-rose-600' : 'text-silver-500'}>{daysLeft !== null && daysLeft < 0 ? 'Expired' : `${daysLeft} days left`}</div></> : '—'}</td>
              <td className="px-4 py-2.5 text-[12px] text-silver-600">{tn._count?.invoices ?? 0} invoices · {tn._count?.customers ?? 0} customers</td>
              <td className="px-4 py-2.5 text-right">
                <div className="flex justify-end gap-1.5">
                  <Btn className="h-8" onClick={() => { setEdit(tn); setSubForm({ planCode: sub?.plan?.code || plans[0]?.code || 'STARTER', status: sub?.status === 'TRIALING' ? 'ACTIVE' : sub?.status || 'ACTIVE', periodDays: 30 }); }}>Edit plan</Btn>
                  <Btn className="h-8" variant={tn.isSuspended ? 'secondary' : 'danger'} onClick={() => void toggle(tn)}>{tn.isSuspended ? 'Reactivate' : 'Suspend'}</Btn>
                </div>
              </td>
            </tr>
          );
        })}
      </Table>

      <SidePanel open={Boolean(edit)} onClose={() => setEdit(null)} title={edit?.name} subtitle="Change plan or extend the subscription" footer={<><Btn onClick={() => setEdit(null)}>Cancel</Btn><Btn variant="primary" onClick={() => void saveSub()}>Save</Btn></>}>
        <div className="space-y-3 rounded-xl border border-silver-200 bg-white p-4 shadow-sm">
          <Field label="Plan"><select className={inputCls} value={subForm.planCode} onChange={(e) => setSubForm({ ...subForm, planCode: e.target.value })}>{plans.map((p) => <option key={p.code} value={p.code}>{p.name} · ₹{Number(p.priceMonthly).toLocaleString('en-IN')}/month</option>)}</select></Field>
          <Field label="Status"><select className={inputCls} value={subForm.status} onChange={(e) => setSubForm({ ...subForm, status: e.target.value })}>{['ACTIVE', 'PAST_DUE', 'CANCELED', 'UNPAID'].map((s) => <option key={s}>{s}</option>)}</select></Field>
          <Field label="Valid for (days from today)" hint="The member’s offline app access also follows this date."><input className={inputCls} type="number" min={1} max={366} value={subForm.periodDays} onChange={(e) => setSubForm({ ...subForm, periodDays: Number(e.target.value) })} /></Field>
          <div className="flex flex-wrap gap-1.5">{[30, 90, 180, 365].map((d) => <button key={d} type="button" onClick={() => setSubForm({ ...subForm, periodDays: d })} className={cn('rounded-full px-3 py-1 text-[12px] font-semibold ring-1', subForm.periodDays === d ? 'bg-blue-600 text-white ring-blue-600' : 'ring-silver-300 hover:bg-silver-50')}>{d === 365 ? '1 year' : `${d} days`}</button>)}</div>
        </div>
      </SidePanel>

      <SidePanel open={createOpen} onClose={() => setCreateOpen(false)} title="New business" subtitle="Creates the workspace, owner login and subscription" footer={<><Btn onClick={() => setCreateOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={() => void create()}>Create business</Btn></>}>
        <div className="grid gap-3 rounded-xl border border-silver-200 bg-white p-4 shadow-sm sm:grid-cols-2">
          <Field label="Business name" className="sm:col-span-2"><input className={inputCls} value={c.businessName} onChange={(e) => setC({ ...c, businessName: e.target.value })} /></Field>
          <Field label="Owner first name"><input className={inputCls} value={c.firstName} onChange={(e) => setC({ ...c, firstName: e.target.value })} /></Field>
          <Field label="Owner last name"><input className={inputCls} value={c.lastName} onChange={(e) => setC({ ...c, lastName: e.target.value })} /></Field>
          <Field label="Sign-in email"><input className={inputCls} type="email" value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} /></Field>
          <Field label="Mobile"><input className={inputCls} value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} /></Field>
          <Field label="Password" className="sm:col-span-2"><div className="flex gap-2"><div className="flex-1"><PasswordInput value={c.password} onChange={(v) => setC({ ...c, password: v })} autoComplete="new-password" /></div><Btn onClick={() => setC({ ...c, password: generatePassword() })}><KeyRound className="h-4 w-4" /> Generate</Btn></div></Field>
          <Field label="Plan"><select className={inputCls} value={c.planCode} onChange={(e) => setC({ ...c, planCode: e.target.value })}>{plans.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}</select></Field>
          <Field label="Days"><input className={inputCls} type="number" min={1} max={366} value={c.periodDays} onChange={(e) => setC({ ...c, periodDays: Number(e.target.value) })} /></Field>
        </div>
      </SidePanel>
    </SectionCard>
  );
}

function VersionsSection({ releases, call, reload }: { releases: any[]; call: Call; reload: () => Promise<void> }) {
  const notify = useNotify();
  const [open, setOpen] = React.useState(false);
  const [f, setF] = React.useState({ platform: 'windows', version: '', minSupported: '', downloadUrl: '', sizeMb: '', notes: '', mandatory: false, isPublished: true });
  const platforms = ['windows', 'android', 'mac', 'linux', 'web'];

  const create = async () => {
    try {
      await call('/releases', { method: 'POST', body: JSON.stringify({
        platform: f.platform, version: f.version.trim(), minSupported: f.minSupported.trim() || undefined, downloadUrl: f.downloadUrl.trim() || undefined,
        sizeMb: f.sizeMb ? Number(f.sizeMb) : undefined, notes: f.notes.trim() || undefined, mandatory: f.mandatory, isPublished: f.isPublished,
      }) });
      notify('success', `Version ${f.version} added`, f.isPublished ? 'Installed apps will see the update notice.' : 'Saved as a draft.');
      setOpen(false); await reload();
    } catch (e) { notify('error', 'Couldn’t add version', (e as Error).message); }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-[13px] text-blue-900">
        <b>How version control works:</b> publish a version here and installed apps ask <code className="rounded bg-white px-1">/api/v1/app-releases/latest</code> for it. Mark it <b>mandatory</b> or set a <b>minimum supported</b> version to require an update.
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {platforms.map((p) => {
          const list = releases.filter((r) => r.platform === p);
          return (
            <SectionCard key={p} title={p === 'mac' ? 'macOS' : p.charAt(0).toUpperCase() + p.slice(1)} subtitle={list[0] ? `Latest ${list.find((r) => r.isPublished)?.version || '—'}` : 'No versions yet'} actions={<Btn className="h-8" onClick={() => { setF({ ...f, platform: p, version: '' }); setOpen(true); }}><Plus className="h-3.5 w-3.5" /> Add version</Btn>}>
              {list.length ? (
                <ul>{list.map((r) => (
                  <li key={r.id} className="flex items-start gap-3 border-b border-silver-100 px-4 py-2.5 last:border-0">
                    <Package className="mt-0.5 h-4 w-4 text-silver-500" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5"><b>v{r.version}</b>{r.isPublished ? <Pill tone="green">Published</Pill> : <Pill>Draft</Pill>}{r.mandatory && <Pill tone="red">Mandatory</Pill>}{r.minSupported && <Pill tone="amber">Min {r.minSupported}</Pill>}{r.sizeMb ? <span className="text-[11px] text-silver-500">{r.sizeMb} MB</span> : null}</div>
                      {r.notes && <p className="mt-0.5 line-clamp-2 text-[12px] text-silver-600">{r.notes}</p>}
                      <div className="text-[11px] text-silver-500">{relativeTime(r.createdAt)}{r.downloadUrl ? <> · <a href={r.downloadUrl} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 hover:underline">download link</a></> : null}</div>
                    </div>
                    <div className="flex gap-1">
                      <Btn variant="ghost" className="h-8 px-2" onClick={async () => { try { await call(`/releases/${r.id}`, { method: 'PATCH', body: JSON.stringify({ isPublished: !r.isPublished }) }); await reload(); } catch (e) { notify('error', 'Update failed', (e as Error).message); } }}>{r.isPublished ? 'Unpublish' : 'Publish'}</Btn>
                      <Btn variant="ghost" className="h-8 px-2 text-rose-600" aria-label="Delete version" onClick={async () => { if (!window.confirm(`Delete v${r.version}?`)) return; try { await call(`/releases/${r.id}`, { method: 'DELETE' }); await reload(); } catch (e) { notify('error', 'Delete failed', (e as Error).message); } }}><Trash2 className="h-3.5 w-3.5" /></Btn>
                    </div>
                  </li>
                ))}</ul>
              ) : <p className="px-4 py-5 text-center text-[13px] text-silver-500">Nothing published for this platform.</p>}
            </SectionCard>
          );
        })}
      </div>
      <SidePanel open={open} onClose={() => setOpen(false)} title="Add app version" subtitle={f.platform} footer={<><Btn onClick={() => setOpen(false)}>Cancel</Btn><Btn variant="primary" onClick={() => void create()} disabled={!/^\d+\.\d+\.\d+$/.test(f.version)}>Save version</Btn></>}>
        <div className="grid gap-3 rounded-xl border border-silver-200 bg-white p-4 shadow-sm sm:grid-cols-2">
          <Field label="Platform"><select className={inputCls} value={f.platform} onChange={(e) => setF({ ...f, platform: e.target.value })}>{platforms.map((p) => <option key={p}>{p}</option>)}</select></Field>
          <Field label="Version" hint="Like 1.2.0"><input className={inputCls} value={f.version} onChange={(e) => setF({ ...f, version: e.target.value })} placeholder="1.1.0" /></Field>
          <Field label="Minimum supported" hint="Older apps must update"><input className={inputCls} value={f.minSupported} onChange={(e) => setF({ ...f, minSupported: e.target.value })} placeholder="1.0.0" /></Field>
          <Field label="Installer size (MB)"><input className={inputCls} type="number" min={0} value={f.sizeMb} onChange={(e) => setF({ ...f, sizeMb: e.target.value })} /></Field>
          <Field label="Download URL" className="sm:col-span-2"><input className={inputCls} value={f.downloadUrl} onChange={(e) => setF({ ...f, downloadUrl: e.target.value })} placeholder="https://…/ollaiBooks-Setup-1.1.0.exe" /></Field>
          <Field label="What’s new" className="sm:col-span-2"><textarea className={`${inputCls} h-24 py-2`} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></Field>
          <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={f.mandatory} onChange={(e) => setF({ ...f, mandatory: e.target.checked })} className="accent-blue-600" /> Mandatory update</label>
          <label className="flex items-center gap-2 text-[13px]"><input type="checkbox" checked={f.isPublished} onChange={(e) => setF({ ...f, isPublished: e.target.checked })} className="accent-blue-600" /> Publish now</label>
        </div>
      </SidePanel>
    </div>
  );
}

function BackupsSection({ tenants, call }: { tenants: any[]; call: Call }) {
  const notify = useNotify();
  const [busy, setBusy] = React.useState<string | null>(null);
  const download = async (tn: { id: string; name: string }) => {
    setBusy(tn.id);
    try {
      const data = await call<any>(`/tenants/${tn.id}/backup`);
      downloadJson(`ollaibooks-${tn.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.json`, data);
      notify('success', `Backup downloaded — ${tn.name}`, `${data.counts?.invoices ?? 0} invoices, ${data.counts?.customers ?? 0} customers, ${data.counts?.offlinePosSales ?? 0} offline bills.`);
    } catch (e) { notify('error', 'Backup failed', (e as Error).message); } finally { setBusy(null); }
  };
  const downloadAll = async () => { for (const tn of tenants) await download(tn); };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-3">
        {[
          { icon: Database, t: 'Server database', d: 'PostgreSQL holds every synced bill, invoice and CRM record. Schedule a nightly pg_dump on your server and keep 14 days.' },
          { icon: ArrowDownToLine, t: 'Per-business export', d: 'Download one JSON file per business below — useful before plan changes, deletions or migrations.' },
          { icon: CloudOff, t: 'Offline app copies', d: 'Each desktop app saves invoice PDFs and a daily backup in Documents › ollaiBooks on that laptop.' },
        ].map((c) => (
          <div key={c.t} className="rounded-xl border border-silver-200 bg-white p-4 shadow-sm">
            <c.icon className="h-5 w-5 text-blue-600" />
            <b className="mt-2 block text-[14px]">{c.t}</b>
            <p className="mt-1 text-[12px] leading-relaxed text-silver-600">{c.d}</p>
          </div>
        ))}
      </div>
      <SectionCard title="Business data" subtitle="Record counts stored on the server" actions={<Btn onClick={() => void downloadAll()} disabled={!tenants.length || Boolean(busy)}><ArrowDownToLine className="h-4 w-4" /> Download all</Btn>}>
        <Table head={['Business', 'Invoices', 'Customers', 'Products', 'Orders', 'Offline bills', 'CRM records', '']}>
          {tenants.map((tn) => (
            <tr key={tn.id} className="border-b border-silver-100 last:border-0 hover:bg-blue-50/40">
              <td className="px-4 py-2.5 font-semibold">{tn.name}</td>
              {['invoices', 'customers', 'products', 'orders', 'offlinePosSales', 'crmRecords'].map((k) => <td key={k} className="px-4 py-2.5 tabular-nums">{tn._count?.[k] ?? 0}</td>)}
              <td className="px-4 py-2.5 text-right"><Btn className="h-8" onClick={() => void download(tn)} disabled={busy === tn.id}>{busy === tn.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ArrowDownToLine className="h-3.5 w-3.5" />} Backup</Btn></td>
            </tr>
          ))}
        </Table>
      </SectionCard>
    </div>
  );
}

function SecuritySection({ session }: { session: AdminSession }) {
  const items = [
    { ok: true, t: 'Admin sign-in from .env', d: 'ADMIN_ID and ADMIN_PASSWORD live only in apps/api/.env on the server (never in the browser bundle). Change them there and restart the API.' },
    { ok: true, t: '8-hour admin sessions', d: `This session ends ${relativeTime(session.expiresAt)}. Admin tokens use a separate signing key from member logins.` },
    { ok: true, t: 'Brute-force lockout', d: 'After 5 wrong attempts from the same network, admin sign-in is locked for 15 minutes.' },
    { ok: true, t: 'Member password policy', d: 'At least 8 characters with a letter and a number, hashed with bcrypt. Offline app passwords are checked with PBKDF2 (310,000 rounds).' },
    { ok: true, t: 'Online-only website', d: 'The browser only works online after sign-in. Offline billing requires the installed app, with a 7-day offline pass tied to the subscription.' },
    { ok: false, t: 'Your checklist', d: 'Use a long unique ADMIN_PASSWORD, serve the API over HTTPS, back up PostgreSQL nightly, and never share admin credentials over chat.' },
  ];
  return (
    <SectionCard title="Security & authentication" subtitle="How access to ollaiBooks is protected">
      <ul className="divide-y divide-silver-100">
        {items.map((i) => (
          <li key={i.t} className="flex gap-3 px-4 py-3">
            {i.ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" /> : <Activity className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />}
            <div><b className="text-[13px]">{i.t}</b><p className="text-[12px] leading-relaxed text-silver-600">{i.d}</p></div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */

export function AdminConsole() {
  const [session, setSession] = React.useState<AdminSession | null | undefined>(undefined);
  React.useEffect(() => { setSession(readSession()); }, []);
  const logout = React.useCallback(() => { sessionStorage.removeItem(SESSION_KEY); setSession(null); }, []);
  if (session === undefined) return null;
  return (
    <ToastProvider>
      {session ? <AdminApp session={session} onLogout={logout} /> : <AdminLogin onLogin={setSession} />}
    </ToastProvider>
  );
}

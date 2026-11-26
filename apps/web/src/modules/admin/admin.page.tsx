'use client';

import * as React from 'react';
import { WorkspaceHeader } from '@/components/workspace/header';
import { WorkspaceTablePanel } from '@/components/workspace/table';
import { ApiClient } from '@/lib/api-client';
import {
  ShieldAlert,
  Building2,
  Users,
  FileText,
  CreditCard,
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Server,
  Zap,
} from 'lucide-react';
import { Modal, FormField } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

export function AdminPortalPage() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');
  const [actionMsg, setActionMsg] = React.useState('');
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [loginEdit, setLoginEdit] = React.useState<any>(null);
  const [loginPassword, setLoginPassword] = React.useState('');
  const [newName, setNewName] = React.useState('');
  const [customerEmail, setCustomerEmail] = React.useState('');
  const [customerFirstName, setCustomerFirstName] = React.useState('');
  const [customerLastName, setCustomerLastName] = React.useState('');
  const [customerPhone, setCustomerPhone] = React.useState('');
  const [customerPassword, setCustomerPassword] = React.useState('');
  const [customerPlan, setCustomerPlan] = React.useState('STARTER');
  const [customerPeriodDays, setCustomerPeriodDays] = React.useState(30);
  const [subscriptionEdits, setSubscriptionEdits] = React.useState<Record<string, { planCode: string; status: string; periodDays: number }>>({});
  const [creating, setCreating] = React.useState(false);

  const loadData = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await ApiClient.get<any>('/admin-bridge/overview');
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Could not load admin overview.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleToggleStatus(tenantId: string, currentSuspended: boolean) {
    setActionMsg('');
    try {
      const res = await ApiClient.post<any>(`/admin-bridge/tenants/${tenantId}/toggle-status`);
      setActionMsg(res.message || 'Tenant status updated');
      await loadData();
    } catch (err: any) {
      setActionMsg(`⚠️ Error: ${err.message}`);
    }
  }

  function handleSwitchWorkspace(tenantId: string, tenantName: string) {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('billpilot_active_tenant_id', tenantId);
    setActionMsg(`Switched active workspace to "${tenantName}". Reloading dashboard...`);
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 600);
  }

  async function handleCreateCustomer(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true); setActionMsg('');
    try {
      const res = await ApiClient.post<any>('/admin-bridge/customers', {
        businessName: newName.trim(), email: customerEmail.trim(), password: customerPassword,
        firstName: customerFirstName.trim(), lastName: customerLastName.trim(), phone: customerPhone.trim(),
        planCode: customerPlan, periodDays: customerPeriodDays,
      });
      setActionMsg(res.message || 'Customer account created');
      setIsCreateOpen(false); setNewName(''); setCustomerEmail(''); setCustomerPassword('');
      setCustomerFirstName(''); setCustomerLastName(''); setCustomerPhone('');
      await loadData();
    } catch (err: any) {
      setActionMsg(`⚠️ Creation failed: ${err.message}`);
    } finally { setCreating(false); }
  }

  async function handleSubscriptionSave(tenant: any) {
    const edit = subscriptionEdits[tenant.id] || {
      planCode: tenant.subscriptions?.[0]?.plan?.code || data?.plans?.[0]?.code || 'STARTER',
      status: tenant.subscriptions?.[0]?.status || 'ACTIVE', periodDays: 30,
    };
    try {
      const result = await ApiClient.request<any>(`/admin-bridge/tenants/${tenant.id}/subscription`, {
        method: 'PATCH', body: JSON.stringify(edit),
      });
      setActionMsg(result.message || 'Subscription updated'); await loadData();
    } catch (err: any) { setActionMsg(`⚠️ Subscription update failed: ${err.message}`); }
  }

  async function handleSaveLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginEdit) return;
    try {
      const result = await ApiClient.request<any>(`/admin-bridge/tenants/${loginEdit.id}/login`, {
        method: 'PATCH',
        body: JSON.stringify({ email: loginEdit.email, firstName: loginEdit.firstName, lastName: loginEdit.lastName, phone: loginEdit.phone, ...(loginPassword ? { password: loginPassword } : {}) }),
      });
      setActionMsg(result.message); setLoginEdit(null); setLoginPassword(''); await loadData();
    } catch (err: any) { setActionMsg(`⚠️ Login update failed: ${err.message}`); }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <WorkspaceHeader
        title="Platform Admin Console"
        description="Global multi-tenant governance, tenant workspace provisioning, cross-organization audits and health telemetry."
        badge="Root SuperAdmin"
        primaryAction={{
          label: 'Add customer account',
          onClick: () => { setCustomerPlan(data?.plans?.[0]?.code || 'STARTER'); setIsCreateOpen(true); },
          icon: <Plus className="h-3.5 w-3.5" />,
        }}
      />

      {/* Action Notification */}
      {actionMsg && (
        <div className="rounded-xl bg-blue-50/90 border border-blue-200 p-3 text-xs font-semibold text-blue-900 flex items-center justify-between">
          <span>{actionMsg}</span>
          <button onClick={() => setActionMsg('')} className="text-xs font-bold text-blue-600 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-700">
          <p className="font-bold">Access Warning:</p>
          <p>{error}</p>
          <p className="text-[11px] text-rose-600 mt-1">
            Ensure you are signed in as a platform administrator (e.g. <code>admin@billpilot.ai</code>).
          </p>
        </div>
      )}

      {/* Top 4 Global Telemetry Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Tenants */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Workspaces</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Building2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{data?.totals?.tenants ?? '…'}</span>
            <span className="text-xs font-bold text-emerald-600">
              {data?.totals?.activeTenants ?? 0} Active
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {data?.totals?.suspendedTenants ?? 0} suspended organizations
          </p>
        </div>

        {/* Global Orders */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Platform Orders</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{data?.totals?.totalOrders ?? '…'}</span>
            <span className="text-xs font-bold text-slate-500">Live Ingested</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Cross-tenant signed webhooks</p>
        </div>

        {/* Global Customers */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Customers</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">{data?.totals?.customers ?? '…'}</span>
            <span className="text-xs font-bold text-slate-500">Directories</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Isolated customer accounts</p>
        </div>

        {/* Recorded GMV */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Recorded GMV</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900">
              ₹{Number(data?.totals?.recordedPayments || 0).toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Total settled payments volume</p>
        </div>
      </div>

      {/* Platform Architecture & Infrastructure Status - Solid Zero Gradient */}
      <div className="rounded-[4px] border border-[#334155] bg-[#0F172A] p-4 text-white shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-[#0066FF] text-white">
            <Server className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-2">
              High-Scale Multi-Tenant Infrastructure Active
              <span className="rounded-[2px] bg-[#ECFDF5] px-2 py-0.2 text-[10px] font-bold text-[#059669] border border-[#A7F3D0]">
                1M+ Ready
              </span>
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Enterprise Cloud Engine · Automated AI Co-Pilot · Multi-Tenant Row Isolation
            </p>
          </div>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-3.5 py-2 text-xs font-bold text-white transition border border-white/10"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Metrics
        </button>
      </div>

      {/* Tenants Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Customer accounts ({data?.tenants?.length || 0})
          </h3>
        </div>

        <WorkspaceTablePanel>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Tenant Organization</th>
                <th className="px-4 py-3.5">Slug / Identifier</th>
                <th className="px-4 py-3.5">Plan & subscription</th>
                <th className="px-4 py-3.5">Members</th>
                <th className="px-4 py-3.5">Customers</th>
                <th className="px-4 py-3.5">Invoices</th>
                <th className="px-4 py-3.5">Orders</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Admin Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {data?.tenants?.map((tenant: any) => (
                <tr key={tenant.id} className="hover:bg-blue-50/30 transition">
                  <td className="px-6 py-4 font-bold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-xs">
                        {tenant.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span>{tenant.name}</span>
                        <span className="block text-[10px] text-slate-500">{tenant.members?.[0]?.user?.email || tenant.businessProfile?.email || 'No login email'}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          ID: {tenant.id.slice(0, 12)}…
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-slate-600">{tenant.slug}</td>
                  <td className="px-4 py-3 min-w-[190px]">
                    <div className="space-y-1.5">
                      <select value={subscriptionEdits[tenant.id]?.planCode || tenant.subscriptions?.[0]?.plan?.code || data?.plans?.[0]?.code || 'STARTER'} onChange={e => setSubscriptionEdits(prev => ({ ...prev, [tenant.id]: { planCode: e.target.value, status: prev[tenant.id]?.status || tenant.subscriptions?.[0]?.status || 'ACTIVE', periodDays: prev[tenant.id]?.periodDays || 30 } }))} className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-[10px]">{(data?.plans || []).map((plan: any) => <option key={plan.code} value={plan.code}>{plan.name}</option>)}</select>
                      <select value={subscriptionEdits[tenant.id]?.status || tenant.subscriptions?.[0]?.status || 'CANCELED'} onChange={e => setSubscriptionEdits(prev => ({ ...prev, [tenant.id]: { planCode: prev[tenant.id]?.planCode || tenant.subscriptions?.[0]?.plan?.code || data?.plans?.[0]?.code || 'STARTER', status: e.target.value, periodDays: prev[tenant.id]?.periodDays || 30 } }))} className="w-full rounded border border-slate-200 bg-white px-2 py-1.5 text-[10px]"><option value="ACTIVE">Active</option><option value="PAST_DUE">Past due</option><option value="CANCELED">Canceled</option><option value="UNPAID">Unpaid</option></select>
                      <input type="number" min={1} max={366} value={subscriptionEdits[tenant.id]?.periodDays || 30} onChange={e => setSubscriptionEdits(prev => ({ ...prev, [tenant.id]: { planCode: prev[tenant.id]?.planCode || tenant.subscriptions?.[0]?.plan?.code || data?.plans?.[0]?.code || 'STARTER', status: prev[tenant.id]?.status || tenant.subscriptions?.[0]?.status || 'ACTIVE', periodDays: Number(e.target.value) } }))} className="w-16 rounded border border-slate-200 px-2 py-1 text-[10px]" aria-label="Subscription duration in days" /> <span className="text-[9px] text-slate-400">days</span>
                      <div className="text-[9px] text-slate-400">Until {tenant.subscriptions?.[0]?.currentPeriodEnd ? new Date(tenant.subscriptions[0].currentPeriodEnd).toLocaleDateString('en-IN') : 'not set'}</div>
                      <button onClick={() => handleSubscriptionSave(tenant)} className="rounded bg-blue-600 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-blue-700">Save subscription</button>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{tenant._count?.members || 0}</td>
                  <td className="px-4 py-4 text-slate-600">{tenant._count?.customers || 0}</td>
                  <td className="px-4 py-4 text-slate-600">{tenant._count?.invoices || 0}</td>
                  <td className="px-4 py-4 font-bold text-blue-600">{tenant._count?.orders || 0}</td>
                  <td className="px-4 py-4">
                    {tenant.isSuspended ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 border border-rose-200">
                        <AlertTriangle className="h-3 w-3" />
                        Suspended
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" />
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          const owner = tenant.members?.find((member: any) => member.role === 'OWNER')?.user;
                          setLoginEdit({ id: tenant.id, name: tenant.name, email: owner?.email || tenant.businessProfile?.email || '', firstName: owner?.firstName || '', lastName: owner?.lastName || '', phone: owner?.phone || '' });
                        }}
                        className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
                        title="Edit the owner's login details"
                      >
                        <Users className="h-3 w-3" />
                        Edit login
                      </button>
                      <button
                        onClick={() => handleSwitchWorkspace(tenant.id, tenant.name)}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-blue-600 hover:text-white transition"
                        title="Enter and manage this workspace"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Enter
                      </button>
                      <button
                        onClick={() => handleToggleStatus(tenant.id, tenant.isSuspended)}
                        className={`inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-bold transition border ${
                          tenant.isSuspended
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {tenant.isSuspended ? 'Resume' : 'Suspend'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(!data?.tenants || data.tenants.length === 0) && !loading && (
            <div className="p-12 text-center text-sm font-semibold text-slate-500">
              No tenant workspaces found.
            </div>
          )}
        </WorkspaceTablePanel>
      </div>

      {/* Provision New Tenant Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create customer account"
        subtitle="Create the customer's email and password login and assign a subscription."
        icon={<Users className="h-4 w-4" />}
        maxWidth="md"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <FormField label="Business name" required>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. The Sugar Studio"
              className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Customer first name" required><input required value={customerFirstName} onChange={e => setCustomerFirstName(e.target.value)} className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] px-3 text-sm" /></FormField>
            <FormField label="Customer last name" required><input required value={customerLastName} onChange={e => setCustomerLastName(e.target.value)} className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] px-3 text-sm" /></FormField>
          </div>
          <FormField label="Sign-in email" required><input type="email" required value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} autoComplete="off" placeholder="owner@bakery.in" className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] px-3 text-sm" /></FormField>
          <FormField label="Temporary password (12 characters minimum)" required><input type="password" required minLength={12} value={customerPassword} onChange={e => setCustomerPassword(e.target.value)} autoComplete="new-password" className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] px-3 text-sm" /></FormField>
          <FormField label="Phone (optional)"><input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="+91…" className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] px-3 text-sm" /></FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Subscription plan" required><select value={customerPlan} onChange={e => setCustomerPlan(e.target.value)} className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-sm">{(data?.plans || [{ code: 'STARTER', name: 'Starter' }]).map((plan: any) => <option key={plan.code} value={plan.code}>{plan.name} · ₹{Number(plan.priceMonthly).toLocaleString('en-IN')}/mo</option>)}</select></FormField>
            <FormField label="Access period (days)" required><input type="number" required min={1} max={366} value={customerPeriodDays} onChange={e => setCustomerPeriodDays(Number(e.target.value))} className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] px-3 text-sm" /></FormField>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="h-[36px] px-4 rounded-[4px] border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={creating}
              className="h-[36px] px-5 rounded-[4px] bg-[#0066FF] hover:bg-[#0052CC] text-white font-medium shadow-none cursor-pointer disabled:opacity-50"
            >
              {creating ? 'Creating account…' : 'Create customer account'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!loginEdit} onClose={() => { setLoginEdit(null); setLoginPassword(''); }} title={`Manage login · ${loginEdit?.name || ''}`} subtitle="Update the customer's email, password, or contact details." icon={<Users className="h-4 w-4" />} maxWidth="md">
        {loginEdit && <form onSubmit={handleSaveLogin} className="space-y-4">
          <FormField label="Sign-in email" required><input type="email" required value={loginEdit.email} onChange={e => setLoginEdit({ ...loginEdit, email: e.target.value })} className="w-full h-[38px] rounded border border-slate-300 px-3 text-sm" /></FormField>
          <div className="grid grid-cols-2 gap-3"><FormField label="First name" required><input required value={loginEdit.firstName} onChange={e => setLoginEdit({ ...loginEdit, firstName: e.target.value })} className="w-full h-[38px] rounded border border-slate-300 px-3 text-sm" /></FormField><FormField label="Last name" required><input required value={loginEdit.lastName} onChange={e => setLoginEdit({ ...loginEdit, lastName: e.target.value })} className="w-full h-[38px] rounded border border-slate-300 px-3 text-sm" /></FormField></div>
          <FormField label="Phone"><input value={loginEdit.phone} onChange={e => setLoginEdit({ ...loginEdit, phone: e.target.value })} className="w-full h-[38px] rounded border border-slate-300 px-3 text-sm" /></FormField>
          <FormField label="New password (leave blank to keep current; at least 12 characters)"><input type="password" minLength={12} autoComplete="new-password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full h-[38px] rounded border border-slate-300 px-3 text-sm" /></FormField>
          <div className="flex justify-end gap-2 border-t pt-3"><Button type="button" variant="outline" onClick={() => { setLoginEdit(null); setLoginPassword(''); }}>Cancel</Button><Button type="submit" className="bg-blue-600 text-white">Save login details</Button></div>
        </form>}
      </Modal>
    </div>
  );
}


'use client';

import * as React from 'react';
import { WorkspaceHeader } from '@/components/workspace/header';
import { WorkspaceTablePanel } from '@/components/workspace/table';
import { formatMoney } from '@/lib/utils';
import {
  Plus,
  Users,
  Mail,
  Phone,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  MessageSquare,
  Bot,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import { AiPageAgentBanner } from '@/components/ai/ai-page-agent-banner';
import { Modal, FormField } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface CustomerAgentAutoFillStatus {
  active: boolean;
  step: number;
  currentField: 'name' | 'phone' | 'email' | 'location' | 'done';
  statusText: string;
  data: {
    name: string;
    phone: string;
    email: string;
    billingCity: string;
    billingState: string;
  };
}

export function CustomersPage() {
  const [customers, setCustomers] = React.useState<any[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    phone: '',
    billingCity: '',
    billingState: '',
  });

  const formRef = React.useRef(form);
  React.useEffect(() => {
    formRef.current = form;
  }, [form]);

  // Autonomous AI Agent Live Typing & Visual Auto-Fill State
  const [agentAutoFill, setAgentAutoFill] = React.useState<CustomerAgentAutoFillStatus | null>(null);
  const [viewNotice, setViewNotice] = React.useState<string | null>(null);

  const lastAutoFillTimestampRef = React.useRef(0);
  const sequenceTimersRef = React.useRef<NodeJS.Timeout[]>([]);

  const clearAllSequenceTimers = React.useCallback(() => {
    sequenceTimersRef.current.forEach((t) => clearTimeout(t));
    sequenceTimersRef.current = [];
  }, []);

  const loadCustomers = React.useCallback(() => {
    ApiClient.get<any>('/customers?limit=100')
      .then((data) => setCustomers(data.items || []))
      .catch((reason) => setError(reason.message));
  }, []);

  // Visual, paced auto-filling sequence (550ms intervals: readable, natural, and responsive)
  const runCustomerAutoFill = React.useCallback(
    (detail: any) => {
      const now = Date.now();
      if (now - lastAutoFillTimestampRef.current < 1500) {
        return; // Debounce rapid double calls
      }
      lastAutoFillTimestampRef.current = now;

      clearAllSequenceTimers();

      const custName = detail.customerName || detail.name || 'Tata Motors Ltd';
      const phone = detail.phone || '+91 98765 43210';
      const email = detail.email || `billing@${custName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'client'}.in`;
      const city = detail.billingCity || detail.city || 'Bengaluru';
      const state = detail.billingState || detail.state || 'Karnataka';

      // 1. Immediately open the form modal and pre-fill all fields so form is 100% valid
      setShowForm(true);
      setForm({
        name: custName,
        phone,
        email,
        billingCity: city,
        billingState: state,
      });

      // Step 1: Customer Name (550ms)
      setAgentAutoFill({
        active: true,
        step: 1,
        currentField: 'name',
        statusText: `🤖 Autonomous Agent: Typing Customer Name "${custName}"...`,
        data: {
          name: custName,
          phone,
          email,
          billingCity: city,
          billingState: state,
        },
      });

      const t1 = setTimeout(() => {
        // Step 2: Phone Number (550ms)
        setAgentAutoFill((prev) =>
          prev
            ? {
                ...prev,
                step: 2,
                currentField: 'phone',
                statusText: `🤖 Autonomous Agent: Entering Phone Number "${phone}"...`,
              }
            : null
        );
        setForm((prev) => ({ ...prev, phone }));

        const t2 = setTimeout(() => {
          // Step 3: Email Address (550ms)
          setAgentAutoFill((prev) =>
            prev
              ? {
                  ...prev,
                  step: 3,
                  currentField: 'email',
                  statusText: `🤖 Autonomous Agent: Setting Email Address "${email}"...`,
                }
              : null
          );
          setForm((prev) => ({ ...prev, email }));

          const t3 = setTimeout(() => {
            // Step 4: Billing Location (550ms)
            setAgentAutoFill((prev) =>
              prev
                ? {
                    ...prev,
                    step: 4,
                    currentField: 'location',
                    statusText: `🤖 Autonomous Agent: Assigning Location "${city}, ${state}"...`,
                  }
                : null
            );
            setForm((prev) => ({ ...prev, billingCity: city, billingState: state }));

            const t4 = setTimeout(() => {
              // Step 5: Completed & Requesting Confirmation
              setAgentAutoFill((prev) =>
                prev
                  ? {
                      ...prev,
                      step: 5,
                      currentField: 'done',
                      statusText: `✓ Customer details ready for "${custName}". Should I proceed: yes or no?`,
                    }
                  : null
              );
            }, 550);
            sequenceTimersRef.current.push(t4);
          }, 550);
          sequenceTimersRef.current.push(t3);
        }, 550);
        sequenceTimersRef.current.push(t2);
      }, 550);
      sequenceTimersRef.current.push(t1);
    },
    [clearAllSequenceTimers]
  );

  const handleAgentProceedSave = React.useCallback(async () => {
    const curForm = formRef.current;
    setSaving(true);
    try {
      await ApiClient.post('/customers', {
        name: curForm.name || 'Tata Motors Ltd',
        phone: curForm.phone || '+91 98765 43210',
        email: curForm.email || 'billing@tatamotors.in',
        billingCity: curForm.billingCity || 'Bengaluru',
        billingState: curForm.billingState || 'Karnataka',
      });
      await loadCustomers();
      setAgentAutoFill(null);
      setShowForm(false);
    } catch (err: any) {
      setError(err?.message || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  }, [loadCustomers]);

  React.useEffect(() => {
    loadCustomers();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autoCreate') === 'true' || params.get('create') === 'true') {
        const custName = params.get('name') || 'Tata Motors Ltd';
        const phone = params.get('phone') || '+91 98765 43210';
        runCustomerAutoFill({ customerName: custName, phone });
        window.history.replaceState(null, '', window.location.pathname);
      } else if (params.get('view') === 'true') {
        setViewNotice(
          'Active Clients retrieved: Acme Traders Ltd, TechNova Solutions, Tata Motors Ltd, Aakash Enterprises.'
        );
        window.history.replaceState(null, '', window.location.pathname);
      }

      const handleVoiceCreateEvent = (e: any) => {
        runCustomerAutoFill(e.detail || {});
      };

      const handleVoiceViewEvent = (e: any) => {
        const detail = e.detail || {};
        const names = Array.isArray(detail.customers) ? detail.customers.join(', ') : 'Acme Traders Ltd, TechNova Solutions, Tata Motors Ltd, Aakash Enterprises';
        setViewNotice(`Active Clients in CRM: ${names}`);
      };

      const handleConfirmSave = async () => {
        await handleAgentProceedSave();
      };

      const handleCancelCustomer = () => {
        clearAllSequenceTimers();
        setAgentAutoFill(null);
        setShowForm(false);
      };

      window.addEventListener('billpilot:create-customer' as any, handleVoiceCreateEvent);
      window.addEventListener('billpilot:view-customers' as any, handleVoiceViewEvent);
      window.addEventListener('billpilot:customer-created' as any, handleConfirmSave);
      window.addEventListener('billpilot:cancel-customer' as any, handleCancelCustomer);

      return () => {
        window.removeEventListener('billpilot:create-customer' as any, handleVoiceCreateEvent);
        window.removeEventListener('billpilot:view-customers' as any, handleVoiceViewEvent);
        window.removeEventListener('billpilot:customer-created' as any, handleConfirmSave);
        window.removeEventListener('billpilot:cancel-customer' as any, handleCancelCustomer);
      };
    }
  }, [loadCustomers, runCustomerAutoFill, handleAgentProceedSave]);

  async function createCustomer(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await ApiClient.post('/customers', form);
      setForm({ name: '', email: '', phone: '', billingCity: '', billingState: '' });
      setAgentAutoFill(null);
      setShowForm(false);
      await loadCustomers();
    } catch (reason: any) {
      setError(reason.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateConsent(customer: any) {
    const current = customer.communicationConsents?.[0]?.status === 'GRANTED';
    const source = window.prompt(
      current ? 'Why are you revoking consent?' : 'Enter consent source or record reference (for example, signed form ID):'
    );
    if (source === null || !source.trim()) return;
    try {
      await ApiClient.post(`/whatsapp/consent/${customer.id}`, { granted: !current, source: source.trim() });
      await loadCustomers();
    } catch (reason: any) {
      setError(reason.message);
    }
  }

  const filteredCustomers = customers.filter(
    (c) =>
      !search ||
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) ||
      c.billingCity?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title="Customer Directory"
        description="Unified customer repository with transaction histories and balances."
        primaryAction={{
          label: 'Add Customer',
          onClick: () => {
            setAgentAutoFill(null);
            setShowForm((value) => !value);
          },
          icon: <Plus className="h-3.5 w-3.5" />,
        }}
      />

      {/* Autonomous AI Guidance Agent Banner */}
      <AiPageAgentBanner module="customers" onActionComplete={loadCustomers} />

      {/* AI View Customers Notice Banner */}
      {viewNotice && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/90 p-4 flex items-center justify-between animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <Bot className="h-5 w-5 text-blue-600 animate-pulse flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-blue-950">
                Autonomous Agent Query: Active Customers Directory
              </h4>
              <p className="text-[12px] text-blue-800 font-medium mt-0.5">
                {viewNotice}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewNotice(null)}
            className="text-xs h-7 border-blue-300 text-blue-700 hover:bg-blue-100 font-bold"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Add Customer Form Modal (Popup Style) */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          clearAllSequenceTimers();
          setAgentAutoFill(null);
          setShowForm(false);
        }}
        title="Add New Customer"
        subtitle="Create customer profile with contact information and tax location"
        icon={<Plus className="h-4 w-4" />}
        maxWidth="md"
      >
        <form onSubmit={createCustomer} className="space-y-4">
          {/* Autonomous AI Agent Live Auto-fill Indicator Banner */}
          {agentAutoFill?.active && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/90 p-3.5 flex items-center justify-between text-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-blue-600 animate-pulse flex-shrink-0" />
                <span className="font-bold text-blue-950">
                  {agentAutoFill.statusText}
                </span>
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full flex-shrink-0">
                Autonomous Typing
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Customer / Business Name" required className="sm:col-span-2">
              <div className="relative">
                <input
                  required
                  maxLength={160}
                  placeholder="e.g. Acme Retailers Pvt Ltd"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`w-full h-[38px] rounded-[4px] border bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none transition-all ${
                    agentAutoFill?.currentField === 'name'
                      ? 'border-blue-500 ring-2 ring-blue-500 shadow-md bg-blue-50/30'
                      : 'border-[#CBD5E1] focus:border-[#0066FF]'
                  }`}
                />
                {agentAutoFill?.currentField === 'name' && (
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded animate-pulse">
                    🤖 Auto-typing...
                  </span>
                )}
              </div>
            </FormField>

            <FormField label="Email Address" className="sm:col-span-2">
              <div className="relative">
                <input
                  type="email"
                  placeholder="billing@acmeretail.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={`w-full h-[38px] rounded-[4px] border bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none transition-all ${
                    agentAutoFill?.currentField === 'email'
                      ? 'border-blue-500 ring-2 ring-blue-500 shadow-md bg-blue-50/30'
                      : 'border-[#CBD5E1] focus:border-[#0066FF]'
                  }`}
                />
                {agentAutoFill?.currentField === 'email' && (
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded animate-pulse">
                    🤖 Auto-typing...
                  </span>
                )}
              </div>
            </FormField>

            <FormField label="Phone Number (E.164 WhatsApp)" className="sm:col-span-2">
              <div className="relative">
                <input
                  placeholder="+91 98765 43210"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={`w-full h-[38px] rounded-[4px] border bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none transition-all ${
                    agentAutoFill?.currentField === 'phone'
                      ? 'border-blue-500 ring-2 ring-blue-500 shadow-md bg-blue-50/30'
                      : 'border-[#CBD5E1] focus:border-[#0066FF]'
                  }`}
                />
                {agentAutoFill?.currentField === 'phone' && (
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded animate-pulse">
                    🤖 Auto-entering...
                  </span>
                )}
              </div>
            </FormField>

            <FormField label="Billing City">
              <div className="relative">
                <input
                  placeholder="e.g. Bengaluru"
                  value={form.billingCity}
                  onChange={(e) => setForm({ ...form, billingCity: e.target.value })}
                  className={`w-full h-[38px] rounded-[4px] border bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none transition-all ${
                    agentAutoFill?.currentField === 'location'
                      ? 'border-blue-500 ring-2 ring-blue-500 shadow-md bg-blue-50/30'
                      : 'border-[#CBD5E1] focus:border-[#0066FF]'
                  }`}
                />
                {agentAutoFill?.currentField === 'location' && (
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded animate-pulse">
                    🤖 Auto-setting...
                  </span>
                )}
              </div>
            </FormField>

            <FormField label="Billing State">
              <div className="relative">
                <input
                  placeholder="e.g. Karnataka"
                  value={form.billingState}
                  onChange={(e) => setForm({ ...form, billingState: e.target.value })}
                  className={`w-full h-[38px] rounded-[4px] border bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none transition-all ${
                    agentAutoFill?.currentField === 'location'
                      ? 'border-blue-500 ring-2 ring-blue-500 shadow-md bg-blue-50/30'
                      : 'border-[#CBD5E1] focus:border-[#0066FF]'
                  }`}
                />
              </div>
            </FormField>
          </div>

          {/* Interactive Agent Confirmation Box */}
          {agentAutoFill?.currentField === 'done' && (
            <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/90 p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-emerald-700 animate-pulse flex-shrink-0" />
                  <span className="text-xs font-bold text-emerald-950">
                    Agent Directive: &quot;I have prepared customer details for &apos;{form.name}&apos;. Should I proceed: yes or no?&quot;
                  </span>
                </div>
                <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-800 flex-shrink-0">
                  Ready to Save
                </span>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAgentAutoFill(null)}
                >
                  Cancel / No
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAgentProceedSave}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {saving ? 'Saving...' : 'Yes, Proceed & Save Customer'}
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                clearAllSequenceTimers();
                setAgentAutoFill(null);
                setShowForm(false);
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={saving}
            >
              {saving ? 'Saving Customer…' : 'Save Customer'}
            </Button>
          </div>
        </form>
      </Modal>

      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 border border-rose-200">
          {error}
        </p>
      )}

      {/* Zoho-Style Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customers by name, phone, or city..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              aria-label="Filter city"
              className="appearance-none rounded-xl border border-slate-200 bg-slate-50/70 pl-3 pr-8 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <option>All Cities</option>
              <option>Bengaluru</option>
              <option>Mumbai</option>
              <option>Delhi</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              aria-label="Filter customer status"
              className="appearance-none rounded-xl border border-slate-200 bg-slate-50/70 pl-3 pr-8 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Overdue Balance</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table */}
      <WorkspaceTablePanel>
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3.5">Name</th>
              <th className="px-4 py-3.5">Contact</th>
              <th className="px-4 py-3.5">City</th>
              <th className="px-4 py-3.5">Orders</th>
              <th className="px-4 py-3.5">Balance</th>
              <th className="px-4 py-3.5">WhatsApp Consent</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredCustomers.map((c) => (
              <tr key={c.id} className="hover:bg-blue-50/30 transition">
                <td className="px-6 py-4 font-bold text-slate-900">
                  {c.name}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-1.5 font-mono text-slate-700">
                    <Phone className="h-3 w-3 text-slate-400" />
                    <span>{c.phone || '—'}</span>
                  </div>
                  {c.email && (
                    <div className="flex items-center gap-1.5 text-slate-400 text-[10px] mt-0.5">
                      <Mail className="h-3 w-3" />
                      <span>{c.email}</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-4 text-slate-600 font-semibold">{c.billingCity || '—'}</td>
                <td className="px-4 py-4 font-bold text-slate-800">{c.totalOrdersCount || 1}</td>
                <td className="px-4 py-4 font-mono font-bold text-slate-900">
                  {formatMoney(Number(c.balanceDue || 0))}
                </td>
                <td className="px-4 py-4">
                  <button
                    type="button"
                    onClick={() => updateConsent(c)}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border transition ${
                      c.communicationConsents?.[0]?.status === 'GRANTED' || c.communicationConsent
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}
                  >
                    <ShieldCheck className="h-3 w-3" />
                    {c.communicationConsents?.[0]?.status === 'GRANTED' || c.communicationConsent
                      ? 'Consent Granted'
                      : 'Record Consent'}
                  </button>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => alert(`Customer ${c.name} profile opened.`)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filteredCustomers.length && (
          <p className="p-8 text-center text-sm font-semibold text-slate-500">
            No customers found.
          </p>
        )}

        {filteredCustomers.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 text-xs font-bold text-slate-600 bg-slate-50/50">
            <span>Showing {filteredCustomers.length} customers</span>
            <div className="flex items-center gap-1">
              <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                1
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50">
                2
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50">
                3
              </button>
            </div>
          </div>
        )}
      </WorkspaceTablePanel>
    </div>
  );
}

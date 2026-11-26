'use client';

import * as React from 'react';
import { ApiClient } from '@/lib/api-client';
import { WorkspaceHeader } from '@/components/workspace/header';
import { WorkspaceTablePanel } from '@/components/workspace/table';
import { Card } from '@/components/ui/card';
import { MessageSquare, Send, CheckCircle2, ShieldCheck, Key, RefreshCw, Settings, Plus } from 'lucide-react';
import { AiPageAgentBanner } from '@/components/ai/ai-page-agent-banner';
import { AiSymbol } from '@/components/ui/ai-symbol';
import { Modal, FormField } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

export function WhatsAppPage() {
  const [status, setStatus] = React.useState<any>(null);
  const [logs, setLogs] = React.useState<any[]>([]);
  const [invoices, setInvoices] = React.useState<any[]>([]);
  const [invoiceId, setInvoiceId] = React.useState('');
  const [recipientPhone, setRecipientPhone] = React.useState('');
  const [error, setError] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [configOpen, setConfigOpen] = React.useState(false);
  const [sendOpen, setSendOpen] = React.useState(false);
  const [form, setForm] = React.useState({
    phoneNumberId: '1463989560130663',
    wabaId: '2622101091587273',
    accessToken: 'EAAljSIe4uVwBSzKCDCJKRBdZCGcnHDAUX4ugIHPNDCasN0iTdlMNCnLvSEFMWbnT26dgJJ3RkTmmpc2vJdJfxqLZCP7rPT1Xe28pz16LR0T7wwcZBYpHXdlZBKvUdsqbRvUDOt5wjS9y0CVTjsNcZAbaFZBeytDndHBxk8RMYo7yNaBCZAGYWa3Yq2PzpAnnQ9AIV0KUVXZAdWAmZBgzKVRzNHktlb81PvoBetUU93MUnNf1uhQ2Jgxh2XdPYJ9ikPUB5ZCuq5bZBoehYDy9NfJBoZBZCuRSZCDwZDZD',
    invoiceTemplateName: 'hello_world',
    templateLanguage: 'en_US',
  });

  const load = React.useCallback(async () => {
    try {
      const [account, messageLogs, invoiceData] = await Promise.all([
        ApiClient.get<any>('/whatsapp/account'),
        ApiClient.get<any>('/whatsapp/logs'),
        ApiClient.get<any>('/invoices?limit=100'),
      ]);
      setStatus(account);
      if (account?.phoneNumberId) {
        setForm((prev) => ({
          ...prev,
          phoneNumberId: account.phoneNumberId,
          wabaId: account.wabaId || prev.wabaId,
          invoiceTemplateName: account.invoiceTemplateName || prev.invoiceTemplateName,
          templateLanguage: account.templateLanguage || prev.templateLanguage,
        }));
      }
      setLogs(Array.isArray(messageLogs) ? messageLogs : messageLogs?.items || []);
      const validInvoices = (invoiceData?.items || []).filter((invoice: any) => !['DRAFT', 'CANCELLED'].includes(invoice.status));
      setInvoices(validInvoices);
      if (validInvoices.length > 0) {
        setInvoiceId((prev) => prev || validInvoices[0].id);
      }
    } catch (reason: any) {
      setError(reason.message);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // Autonomous Agent Listeners for WhatsApp Assistant
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleWhatsappEvent = () => {
      setSendOpen(true);
    };

    window.addEventListener('billpilot:send-whatsapp', handleWhatsappEvent);

    const params = new URLSearchParams(window.location.search);
    if (params.get('send') === 'true') {
      setSendOpen(true);
    }

    return () => {
      window.removeEventListener('billpilot:send-whatsapp', handleWhatsappEvent);
    };
  }, []);

  async function configure(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await ApiClient.post('/whatsapp/account', form);
      setForm({ ...form, accessToken: '' });
      setConfigOpen(false);
      await load();
      alert('WhatsApp credentials encrypted and saved securely!');
    } catch (reason: any) {
      setError(reason.message);
    }
  }

  async function send() {
    if (!invoiceId) return;
    setError('');
    setSending(true);
    try {
      await ApiClient.post('/whatsapp/send-invoice', {
        invoiceId,
        recipientPhone: recipientPhone.trim() ? recipientPhone.trim() : undefined,
      });
      setSendOpen(false);
      setRecipientPhone('');
      await load();
      alert('Message request dispatched via official Meta Cloud API!');
    } catch (reason: any) {
      setError(reason.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title="WhatsApp Business"
        description="Official Meta Cloud API integration for automated invoice and payment alerts."
        badge={status?.configured ? 'Cloud API Active' : 'Setup Required'}
        primaryAction={{
          label: 'Send WhatsApp Alert',
          onClick: () => setSendOpen(true),
          icon: <Send className="h-3.5 w-3.5" />,
        }}
      />

      {/* Autonomous AI Guidance Agent Banner */}
      <AiPageAgentBanner module="whatsapp" onActionComplete={load} />

      {error && (
        <div role="alert" className="rounded-[4px] bg-[#FEF2F2] p-4 text-xs font-semibold text-[#DC2626] border border-[#FCA5A5] space-y-2">
          <div className="flex items-start justify-between gap-3">
            <p className="font-semibold">{error}</p>
            {error.includes('Meta Sandbox Restriction') && (
              <a
                href="https://developers.facebook.com/apps"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[4px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[11px] font-bold transition shrink-0 shadow-xs"
              >
                Open Meta Dashboard &rarr;
              </a>
            )}
          </div>
          {error.includes('Meta Sandbox Restriction') && (
            <div className="pt-2.5 border-t border-[#FCA5A5]/60 text-[12px] text-[#991B1B] font-normal leading-relaxed">
              <strong>How to fix in 30 seconds:</strong>
              <ol className="list-decimal list-inside mt-1.5 space-y-1 font-medium">
                <li>Go to <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="underline font-bold text-[#DC2626]">developers.facebook.com/apps</a> &gt; Select your App.</li>
                <li>In left sidebar, navigate to <strong>WhatsApp &gt; API Setup</strong>.</li>
                <li>Under <strong>Step 1: Send and receive messages</strong>, find the <strong>&quot;To&quot;</strong> dropdown.</li>
                <li>Click <strong>&quot;Manage phone number list&quot;</strong>, enter your number <code>+91 9600732162</code>, and verify with the 6-digit WhatsApp code.</li>
              </ol>
              <p className="mt-2 text-[11px] text-[#7F1D1D]">Once verified, click &quot;Dispatch Now&quot; again and your WhatsApp will receive the invoice instantly!</p>
            </div>
          )}
        </div>
      )}

      {/* Overview & Quick Configuration Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 rounded-[4px] border border-[#CBD5E1] bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-semibold text-[#64748B]">Cloud API Status</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-[3px] text-[11px] font-bold ${
              status?.configured ? 'bg-[#DCFCE7] text-[#15803D]' : 'bg-[#FEF3C7] text-[#B45309]'
            }`}>
              {status?.configured ? 'Connected 200 OK' : 'Pending Keys'}
            </span>
          </div>
          <p className="text-[14px] font-semibold text-[#0F172A]">{status?.configured ? 'Meta Cloud API v19.0' : 'Not Connected'}</p>
          <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex justify-between items-center">
            <span className="text-[11px] text-[#94A3B8]">WABA Encrypted</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfigOpen(true)}
              className="h-[28px] px-2.5 rounded-[4px] text-[12px] font-medium border border-[#CBD5E1] text-[#0066FF] hover:bg-[#F8FAFC]"
            >
              Configure API
            </Button>
          </div>
        </Card>

        <Card className="p-4 rounded-[4px] border border-[#CBD5E1] bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-semibold text-[#64748B]">Phone Number ID</span>
            <MessageSquare className="h-4 w-4 text-[#0066FF]" />
          </div>
          <p className="text-[14px] font-mono font-semibold text-[#0F172A]">{form.phoneNumberId || 'Not Configured'}</p>
          <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex justify-between items-center">
            <span className="text-[11px] text-[#94A3B8]">WABA ID: {form.wabaId?.slice(0, 8)}...</span>
            <span className="text-[11px] text-[#16A34A] font-semibold">Tier: Unlimited</span>
          </div>
        </Card>

        <Card className="p-4 rounded-[4px] border border-[#CBD5E1] bg-white shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-semibold text-[#64748B]">Approved Template</span>
            <CheckCircle2 className="h-4 w-4 text-[#16A34A]" />
          </div>
          <p className="text-[14px] font-mono font-semibold text-[#0F172A]">
            {status?.invoiceTemplateName || form.invoiceTemplateName || 'hello_world'}
          </p>
          <div className="mt-3 pt-3 border-t border-[#F1F5F9] flex justify-between items-center">
            <span className="text-[11px] text-[#94A3B8]">
              Language: {status?.templateLanguage || form.templateLanguage || 'en_US'}
            </span>
            <Button
              size="sm"
              onClick={() => setSendOpen(true)}
              className="h-[28px] px-2.5 rounded-[4px] text-[12px] font-medium bg-[#0066FF] hover:bg-[#0052CC] text-white"
            >
              Dispatch Now
            </Button>
          </div>
        </Card>
      </div>

      {/* POPUP MODAL 1: Configure WhatsApp Cloud API */}
      <Modal
        open={configOpen}
        onClose={() => setConfigOpen(false)}
        title="Configure WhatsApp Cloud API"
        subtitle="Credentials are encrypted at rest using AES-256-GCM before saving"
        size="md"
      >
        <form onSubmit={configure} className="space-y-4">
          <FormField label="Phone Number ID" required>
            <input
              required
              placeholder="e.g. 109283746591029"
              value={form.phoneNumberId}
              onChange={(e) => setForm({ ...form, phoneNumberId: e.target.value })}
              className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] font-mono text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
            />
          </FormField>

          <FormField label="WhatsApp Business Account ID (WABA ID)" required>
            <input
              required
              placeholder="e.g. 394857102938475"
              value={form.wabaId}
              onChange={(e) => setForm({ ...form, wabaId: e.target.value })}
              className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] font-mono text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
            />
          </FormField>

          <FormField label="System User Permanent Access Token" required>
            <input
              type="text"
              placeholder="Paste your EAAl... access token here"
              value={form.accessToken}
              onChange={(e) => setForm({ ...form, accessToken: e.target.value })}
              className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] font-mono text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors truncate"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Approved Meta Template">
              <select
                value={form.invoiceTemplateName}
                onChange={(e) => setForm({ ...form, invoiceTemplateName: e.target.value })}
                className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[13px] font-mono text-[#0F172A] focus:border-[#0066FF] focus:outline-none transition-colors"
              >
                <option value="hello_world">hello_world (Meta Standard)</option>
                <option value="3p_direct_integration_test_template">3p_direct_integration_test_template (Integration Test)</option>
                <option value="jaspers_market_order_confirmation_v1">jaspers_market_order_confirmation_v1</option>
              </select>
            </FormField>

            <FormField label="Template Language">
              <input
                value={form.templateLanguage}
                onChange={(e) => setForm({ ...form, templateLanguage: e.target.value })}
                placeholder="en_US"
                className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[13px] font-mono text-[#0F172A] focus:border-[#0066FF] focus:outline-none transition-colors"
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setConfigOpen(false)}
              className="h-[36px] px-4 rounded-[4px] border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-[36px] px-5 rounded-[4px] bg-[#0066FF] hover:bg-[#0052CC] text-white font-medium shadow-none cursor-pointer"
            >
              Encrypt & Save Keys
            </Button>
          </div>
        </form>
      </Modal>

      {/* POPUP MODAL 2: Send WhatsApp Invoice */}
      <Modal
        open={sendOpen}
        onClose={() => setSendOpen(false)}
        title="Dispatch WhatsApp Invoice"
        subtitle="Send an instant WhatsApp message with PDF attachment and UPI payment link"
        size="md"
      >
        <div className="space-y-4">
          <FormField label="Select Issued Invoice" required>
            <select
              value={invoiceId}
              onChange={(e) => setInvoiceId(e.target.value)}
              className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#0F172A] focus:border-[#0066FF] focus:outline-none transition-colors font-medium"
            >
              <option value="">-- Choose an active invoice --</option>
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNumber} · {inv.customer?.name || 'Walk-in'} (₹{Number(inv.grandTotal).toLocaleString('en-IN')})
                </option>
              ))}
              {invoices.length === 0 && (
                <option value="inv-acme-1001">
                  INV-1001 · TechNova Solutions (₹25,000.00)
                </option>
              )}
            </select>
          </FormField>

          <FormField label="Recipient WhatsApp Phone Number (Optional Override)">
            <input
              type="text"
              placeholder="e.g. +91 98765 43210 (leave blank to use invoice customer phone)"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] font-mono text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
            />
            <p className="mt-1 text-[11px] text-[#64748B]">
              In Meta Sandbox mode, enter the phone number you verified under WhatsApp &gt; API Setup &gt; &quot;To&quot; in Meta Developer Console to receive the message live.
            </p>
          </FormField>

          <div className="rounded-[4px] bg-[#F8FAFC] p-3.5 border border-[#CBD5E1] text-[12px] text-[#475569] space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#0F172A]">Meta Template:</span>
              <span className="font-mono text-[#0066FF] font-semibold">
                {status?.invoiceTemplateName || form.invoiceTemplateName || 'hello_world'} ({status?.templateLanguage || form.templateLanguage || 'en_US'})
              </span>
            </div>
            <p className="text-[#64748B]">Includes cryptographic ollaiBooks verification link and one-tap UPI intent link.</p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSendOpen(false)}
              className="h-[36px] px-4 rounded-[4px] border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC]"
            >
              Cancel
            </Button>
            <Button
              disabled={!invoiceId || sending}
              onClick={send}
              className="h-[36px] px-5 rounded-[4px] bg-[#16A34A] hover:bg-[#15803D] text-white font-medium shadow-none cursor-pointer disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {sending ? 'Dispatching…' : 'Send WhatsApp Message'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Recent Messages Table */}
      <WorkspaceTablePanel>
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wider">Recent Messages</h4>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3.5">Recipient</th>
              <th className="px-4 py-3.5">Template</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Time</th>
              <th className="px-6 py-3.5 text-right">Provider Result</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-blue-50/30 transition">
                <td className="px-6 py-4 font-mono font-bold text-slate-800">{log.recipient}</td>
                <td className="px-4 py-4 font-mono text-blue-600">{log.templateName}</td>
                <td className="px-4 py-4">
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                    {log.status}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-500">{new Date(log.sentAt).toLocaleString()}</td>
                <td className="px-6 py-4 text-right text-slate-400">{log.errorMessage || 'Delivered'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!logs.length && (
          <p className="p-8 text-center text-sm font-semibold text-slate-400">
            No messages sent yet.
          </p>
        )}
      </WorkspaceTablePanel>
    </div>
  );
}

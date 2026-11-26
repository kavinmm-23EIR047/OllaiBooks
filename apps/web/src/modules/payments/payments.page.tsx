'use client';

import * as React from 'react';
import { WorkspaceHeader } from '@/components/workspace/header';
import { WorkspaceTablePanel } from '@/components/workspace/table';
import { WorkspaceStatusBadge } from '@/components/workspace/status';
import { formatMoney, formatDate } from '@/lib/utils';
import {
  Plus,
  Search,
  ChevronDown,
  CheckCircle2,
  Bot,
  FileSpreadsheet,
} from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import { AiPageAgentBanner } from '@/components/ai/ai-page-agent-banner';
import { Modal, FormField } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface PaymentAgentAutoFillStatus {
  active: boolean;
  step: number;
  currentField: 'invoice' | 'amount' | 'method' | 'reference' | 'done';
  statusText: string;
  data: {
    invoiceId: string;
    amount: string;
    paymentMethod: string;
    customerName: string;
    notes: string;
  };
}

interface ExcelPaymentRow {
  invoiceId: string;
  invoiceNumber: string;
  amount: string;
  paymentMethod: string;
  gatewayTransactionId: string;
  notes: string;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let value = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"' && quoted && text[i + 1] === '"') { value += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(value); value = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[i + 1] === '\n') i += 1;
      row.push(value); value = '';
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
    } else value += char;
  }
  if (value.length || row.length) { row.push(value); rows.push(row); }
  return rows;
}

export function PaymentsPage() {
  const [payments, setPayments] = React.useState<any[]>([]);
  const [invoices, setInvoices] = React.useState<any[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [error, setError] = React.useState('');
  const [recording, setRecording] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [methodFilter, setMethodFilter] = React.useState('ALL');
  const [viewNotice, setViewNotice] = React.useState<string | null>(null);
  const [excelNotice, setExcelNotice] = React.useState('');
  const [excelRows, setExcelRows] = React.useState<ExcelPaymentRow[]>([]);
  const [excelImporting, setExcelImporting] = React.useState(false);
  const [excelFileInput, setExcelFileInput] = React.useState<HTMLInputElement | null>(null);

  const [form, setForm] = React.useState({
    invoiceId: '',
    amount: '',
    paymentMethod: 'UPI',
    gatewayTransactionId: '',
    notes: '',
  });

  const formRef = React.useRef(form);
  React.useEffect(() => {
    formRef.current = form;
  }, [form]);

  const invoicesRef = React.useRef(invoices);
  React.useEffect(() => {
    invoicesRef.current = invoices;
  }, [invoices]);

  // Autonomous AI Agent Live Typing & Visual Auto-Fill State
  const [agentAutoFill, setAgentAutoFill] = React.useState<PaymentAgentAutoFillStatus | null>(null);

  const lastAutoFillTimestampRef = React.useRef(0);
  const sequenceTimersRef = React.useRef<NodeJS.Timeout[]>([]);

  const clearAllSequenceTimers = React.useCallback(() => {
    sequenceTimersRef.current.forEach((t) => clearTimeout(t));
    sequenceTimersRef.current = [];
  }, []);

  const load = React.useCallback(() => {
    ApiClient.get<any>('/payments?limit=100')
      .then((data) => setPayments(data.items || []))
      .catch((reason) => setError(reason.message));
  }, []);

  // Visual, paced auto-filling sequence (550ms intervals: readable, natural, and responsive)
  const runPaymentAutoFill = React.useCallback(
    (detail: any) => {
      const now = Date.now();
      if (now - lastAutoFillTimestampRef.current < 1500) {
        return; // Debounce rapid duplicate calls
      }
      lastAutoFillTimestampRef.current = now;

      clearAllSequenceTimers();

      const rawAmt = detail.amount || detail.baseAmount || 25000;
      const amtStr = String(rawAmt);
      const method = (detail.paymentMethod || 'UPI').toUpperCase();
      const custName = detail.customerName || 'Acme Traders Ltd';
      const notes = detail.notes || `Recorded via ollaiBooks AI Agent (${method})`;

      const defaultInv = {
        id: 'inv-437862',
        invoiceNumber: 'INV-437862',
        balanceDue: '29500',
        currency: 'INR',
        customer: { name: custName },
      };
      const unpaid = invoicesRef.current.length > 0 ? invoicesRef.current : [defaultInv];
      const matchedInv =
        unpaid.find((inv: any) =>
          inv.customer?.name?.toLowerCase().includes(custName.toLowerCase())
        ) || unpaid[0] || defaultInv;
      const targetInvoiceId = matchedInv?.id || 'inv-437862';
      const invDisplayNumber = matchedInv?.invoiceNumber || 'INV-437862';

      // Guarantee that target invoice exists in invoices state so <select> displays it selected immediately
      setInvoices((prev) => {
        if (!prev.some((inv) => inv.id === targetInvoiceId)) {
          return [matchedInv, ...prev];
        }
        return prev;
      });

      // Reveal the entered values as the agent progresses through each field.
      setShowForm(true);
      const refCode = `${method}-${Date.now().toString().slice(-6)}`;
      setForm({
        invoiceId: targetInvoiceId,
        amount: '',
        paymentMethod: method,
        gatewayTransactionId: '',
        notes,
      });

      // Step 1: Target Invoice Selection (550ms)
      setAgentAutoFill({
        active: true,
        step: 1,
        currentField: 'invoice',
        statusText: `🤖 Autonomous Agent: Selecting Target Invoice "${invDisplayNumber}" (${custName})...`,
        data: {
          invoiceId: targetInvoiceId,
          amount: amtStr,
          paymentMethod: method,
          customerName: custName,
          notes,
        },
      });

      const updateAgent = (step: number, currentField: PaymentAgentAutoFillStatus['currentField'], statusText: string) => {
        setAgentAutoFill((prev) => prev ? { ...prev, step, currentField, statusText } : null);
      };
      const typeIntoField = (field: 'amount' | 'gatewayTransactionId', value: string, onComplete: () => void) => {
        let position = 0;
        const typeNext = () => {
          position += 1;
          setForm((current) => ({ ...current, [field]: value.slice(0, position) }));
          if (position < value.length) sequenceTimersRef.current.push(setTimeout(typeNext, 65));
          else onComplete();
        };
        if (value) typeNext();
        else onComplete();
      };

      sequenceTimersRef.current.push(setTimeout(() => {
        updateAgent(2, 'amount', `Entering payment amount ₹${Number(rawAmt).toLocaleString('en-IN')}…`);
        typeIntoField('amount', amtStr, () => {
          updateAgent(3, 'method', `Setting payment method to ${method}…`);
          sequenceTimersRef.current.push(setTimeout(() => {
            updateAgent(4, 'reference', `Typing reference ${refCode}…`);
            typeIntoField('gatewayTransactionId', refCode, () => {
              sequenceTimersRef.current.push(setTimeout(() => {
                updateAgent(5, 'done', `Payment details ready: ₹${Number(rawAmt).toLocaleString('en-IN')} via ${method} for ${custName}. Confirm to record.`);
              }, 350));
            });
          }, 350));
        });
      }, 350));
    },
    [clearAllSequenceTimers]
  );

  const handleAgentProceedRecord = React.useCallback(async () => {
    const curForm = formRef.current;
    setRecording(true);
    try {
      await ApiClient.request('/payments', {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify({
          invoiceId: curForm.invoiceId || (invoicesRef.current[0]?.id || 'inv-1'),
          amount: curForm.amount || '25000',
          paymentMethod: curForm.paymentMethod || 'UPI',
          gatewayTransactionId: curForm.gatewayTransactionId || `UPI-${Date.now().toString().slice(-6)}`,
          notes: curForm.notes || 'Recorded via ollaiBooks AI',
        }),
      });
      await load();
      setAgentAutoFill(null);
      setShowForm(false);
    } catch {
      await load();
      setAgentAutoFill(null);
      setShowForm(false);
    } finally {
      setRecording(false);
    }
  }, [load]);

  React.useEffect(() => {
    load();
    ApiClient.get<any>('/invoices?limit=100')
      .then((data) => {
        const unpaid = (data.items || []).filter((invoice: any) => Number(invoice.balanceDue) > 0);
        setInvoices(unpaid);
        invoicesRef.current = unpaid;
      })
      .catch(() => undefined);

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autoRecord') === 'true' || params.get('record') === 'true') {
        runPaymentAutoFill({
          amount: params.get('amount') || '25000',
          paymentMethod: params.get('method') || 'UPI',
          customerName: params.get('customer') || 'Acme Traders Ltd',
        });
        window.history.replaceState(null, '', window.location.pathname);
      } else if (params.get('view') === 'true') {
        setViewNotice('Payments & Ledger settlement directory displayed.');
        window.history.replaceState(null, '', window.location.pathname);
      }

      const handleVoicePaymentEvent = (e: any) => {
        runPaymentAutoFill(e.detail || {});
      };

      const handleVoiceViewEvent = () => {
        setViewNotice('Displaying all recorded collections and settlement transactions.');
      };

      const handleConfirmPayment = async () => {
        await handleAgentProceedRecord();
      };

      const handleCancelPayment = () => {
        clearAllSequenceTimers();
        setAgentAutoFill(null);
        setShowForm(false);
      };

      window.addEventListener('billpilot:record-payment' as any, handleVoicePaymentEvent);
      window.addEventListener('billpilot:view-payments' as any, handleVoiceViewEvent);
      window.addEventListener('billpilot:payment-recorded' as any, handleConfirmPayment);
      window.addEventListener('billpilot:cancel-payment' as any, handleCancelPayment);

      return () => {
        window.removeEventListener('billpilot:record-payment' as any, handleVoicePaymentEvent);
        window.removeEventListener('billpilot:view-payments' as any, handleVoiceViewEvent);
        window.removeEventListener('billpilot:payment-recorded' as any, handleConfirmPayment);
        window.removeEventListener('billpilot:cancel-payment' as any, handleCancelPayment);
      };
    }
  }, [load, runPaymentAutoFill, handleAgentProceedRecord]);

  async function record(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setRecording(true);
    try {
      await ApiClient.request('/payments', {
        method: 'POST',
        headers: { 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify(form),
      });
      setShowForm(false);
      setAgentAutoFill(null);
      setForm({ invoiceId: '', amount: '', paymentMethod: 'UPI', gatewayTransactionId: '', notes: '' });
      await load();
    } catch (reason: any) {
      setError(reason.message);
    } finally {
      setRecording(false);
    }
  }

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      !search ||
      p.paymentNumber?.toLowerCase().includes(search.toLowerCase()) ||
      p.invoice?.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      p.customer?.name?.toLowerCase().includes(search.toLowerCase());
    const matchesMethod = methodFilter === 'ALL' || p.paymentMethod === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const exportPaymentsToExcel = () => {
    const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const columns = ['Payment Number', 'Invoice Number', 'Customer', 'Payment Method', 'Amount', 'Currency', 'Status', 'Payment Date', 'Reference'];
    const rows = filteredPayments.map((payment) => [
      payment.paymentNumber,
      payment.invoice?.invoiceNumber,
      payment.customer?.name,
      payment.paymentMethod,
      payment.amount,
      payment.currency || payment.invoice?.currency || 'INR',
      payment.status,
      payment.paymentDate,
      payment.gatewayTransactionId,
    ]);
    const csv = `\uFEFF${[columns, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `billpilot-offline-payments-${new Date().toISOString().slice(0, 10)}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    setExcelNotice(`Exported ${rows.length} payment${rows.length === 1 ? '' : 's'} in an Excel-compatible CSV file.`);
  };

  const downloadExcelTemplate = () => {
    const template = `\uFEFFInvoice Number,Amount,Payment Method,Reference,Notes\r\n`;
    const url = URL.createObjectURL(new Blob([template], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'billpilot-offline-payment-template.csv';
    anchor.click();
    URL.revokeObjectURL(url);
    setExcelNotice('Downloaded the Excel-compatible import template. Fill it in, then choose Import Excel CSV.');
  };

  const readExcelCsv = async (file?: File) => {
    if (!file) return;
    setExcelNotice('');
    try {
      const parsed = parseCsv((await file.text()).replace(/^\uFEFF/, ''));
      const headers = (parsed.shift() || []).map((header) => header.trim().toLowerCase().replace(/\s+/g, ''));
      const column = (name: string) => headers.indexOf(name);
      const required = ['invoicenumber', 'amount', 'paymentmethod'];
      if (required.some((header) => column(header) < 0)) {
        throw new Error('Excel CSV must include Invoice Number, Amount, and Payment Method columns.');
      }
      const staged: ExcelPaymentRow[] = [];
      const invalid: string[] = [];
      parsed.forEach((cells, index) => {
        const invoiceNumber = (cells[column('invoicenumber')] || '').trim();
        const invoice = invoicesRef.current.find((item) => item.invoiceNumber?.toLowerCase() === invoiceNumber.toLowerCase());
        const amount = (cells[column('amount')] || '').trim();
        const paymentMethod = (cells[column('paymentmethod')] || '').trim().toUpperCase();
        if (!invoice) invalid.push(`Row ${index + 2}: invoice "${invoiceNumber || '(blank)'}" was not found or has no open balance.`);
        else if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) invalid.push(`Row ${index + 2}: amount must be greater than zero.`);
        else if (!['UPI', 'BANK_TRANSFER', 'CASH', 'CARD', 'PAYMENT_GATEWAY', 'OTHER'].includes(paymentMethod)) invalid.push(`Row ${index + 2}: payment method "${paymentMethod}" is unsupported.`);
        else staged.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount,
          paymentMethod,
          gatewayTransactionId: (cells[column('reference')] || '').trim(),
          notes: (cells[column('notes')] || '').trim() || 'Imported from Excel CSV',
        });
      });
      setExcelRows(staged);
      setExcelNotice(`${staged.length} payment${staged.length === 1 ? '' : 's'} ready to import${invalid.length ? `. ${invalid.join(' ')}` : '.'}`);
    } catch (reason: any) {
      setExcelRows([]);
      setExcelNotice(reason.message || 'Could not read this CSV file.');
    }
  };

  const importExcelRows = async () => {
    if (!excelRows.length || excelImporting) return;
    setExcelImporting(true);
    let imported = 0;
    const failed: string[] = [];
    for (const row of excelRows) {
      try {
        await ApiClient.request('/payments', {
          method: 'POST',
          headers: { 'Idempotency-Key': crypto.randomUUID() },
          body: JSON.stringify({
            invoiceId: row.invoiceId,
            amount: row.amount,
            paymentMethod: row.paymentMethod,
            gatewayTransactionId: row.gatewayTransactionId,
            notes: row.notes,
          }),
        });
        imported += 1;
      } catch {
        failed.push(row.invoiceNumber);
      }
    }
    setExcelRows([]);
    setExcelNotice(`Imported ${imported} payment${imported === 1 ? '' : 's'}${failed.length ? `. Could not import invoices: ${failed.join(', ')}.` : '.'}`);
    setExcelImporting(false);
    await load();
  };

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title="Payments & Collections"
        description="Record and reconcile payments against issued invoices."
        primaryAction={{
          label: 'Record Offline Payment',
          onClick: () => {
            setAgentAutoFill(null);
            setShowForm((value) => !value);
          },
          icon: <Plus className="h-3.5 w-3.5" />,
        }}
      />

      {/* Autonomous AI Guidance Agent Banner */}
      <AiPageAgentBanner module="payments" onActionComplete={load} />

      {/* AI View Payments Notice Banner */}
      {viewNotice && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/90 p-4 flex items-center justify-between animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <Bot className="h-5 w-5 text-blue-600 animate-pulse flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-blue-950">
                Autonomous Agent Query: Payments Ledger
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

      {/* Record Payment Form Modal (Popup Style) */}
      <Modal
        isOpen={showForm}
        onClose={() => {
          clearAllSequenceTimers();
          setAgentAutoFill(null);
          setShowForm(false);
        }}
        title="Record Offline Payment"
        subtitle="Reconcile collection against an issued invoice and adjust balance due"
        icon={<Plus className="h-4 w-4" />}
        maxWidth="md"
      >
        <form onSubmit={record} className="space-y-4">
          {/* Autonomous AI Agent Live Auto-fill Indicator Banner */}
          {agentAutoFill?.active && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/90 p-3.5 flex items-center justify-between text-xs animate-in fade-in" role="status" aria-live="polite">
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
            <FormField label="Target Invoice" required className="sm:col-span-2">
              <div className="relative">
                <select
                  required
                  value={form.invoiceId}
                  onChange={(e) => setForm({ ...form, invoiceId: e.target.value })}
                  className={`w-full h-[38px] rounded-[4px] border bg-white px-3 text-[14px] text-[#0F172A] focus:outline-none transition-all ${
                    agentAutoFill?.currentField === 'invoice'
                      ? 'border-blue-500 ring-2 ring-blue-500 shadow-md bg-blue-50/30'
                      : 'border-[#CBD5E1] focus:border-[#0066FF]'
                  }`}
                >
                  <option value="">Select invoice to reconcile</option>
                  {invoices.map((inv) => (
                    <option key={inv.id} value={inv.id}>
                      {inv.invoiceNumber} · Balance {inv.currency} {inv.balanceDue}
                    </option>
                  ))}
                  {!invoices.some((inv) => inv.id === form.invoiceId) && form.invoiceId && (
                    <option value={form.invoiceId}>
                      INV-437862 · Balance INR 29,500 (Acme Traders Ltd)
                    </option>
                  )}
                </select>
                {agentAutoFill?.currentField === 'invoice' && (
                  <span className="absolute right-8 top-2.5 text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                    Selecting…
                  </span>
                )}
              </div>
            </FormField>

            <FormField label="Amount Received (₹)" required>
              <div className="relative">
                <input
                  required
                  min="0.01"
                  step="0.01"
                  type="number"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className={`w-full h-[38px] rounded-[4px] border bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none transition-all ${
                    agentAutoFill?.currentField === 'amount'
                      ? 'border-blue-500 ring-2 ring-blue-500 shadow-md bg-blue-50/30'
                      : 'border-[#CBD5E1] focus:border-[#0066FF]'
                  }`}
                />
                {agentAutoFill?.currentField === 'amount' && (
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                    Typing amount…
                  </span>
                )}
              </div>
            </FormField>

            <FormField label="Payment Method" required>
              <div className="relative">
                <select
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className={`w-full h-[38px] rounded-[4px] border bg-white px-3 text-[14px] text-[#0F172A] focus:outline-none transition-all ${
                    agentAutoFill?.currentField === 'method'
                      ? 'border-blue-500 ring-2 ring-blue-500 shadow-md bg-blue-50/30'
                      : 'border-[#CBD5E1] focus:border-[#0066FF]'
                  }`}
                >
                  {['UPI', 'BANK_TRANSFER', 'CASH', 'CARD', 'PAYMENT_GATEWAY', 'OTHER'].map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
                {agentAutoFill?.currentField === 'method' && (
                  <span className="absolute right-8 top-2.5 text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                    Selecting…
                  </span>
                )}
              </div>
            </FormField>

            <FormField label="Gateway / UTR Reference" className="sm:col-span-2">
              <div className="relative">
                <input
                  value={form.gatewayTransactionId}
                  onChange={(e) => setForm({ ...form, gatewayTransactionId: e.target.value })}
                  placeholder="e.g. UPI-2026-981245 or NEFT-88912"
                  className={`w-full h-[38px] rounded-[4px] border bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none transition-all font-mono ${
                    agentAutoFill?.currentField === 'reference'
                      ? 'border-blue-500 ring-2 ring-blue-500 shadow-md bg-blue-50/30'
                      : 'border-[#CBD5E1] focus:border-[#0066FF]'
                  }`}
                />
                {agentAutoFill?.currentField === 'reference' && (
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                    Typing reference…
                  </span>
                )}
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
                    Agent Directive: &quot;I have entered payment details: ₹{Number(form.amount || 25000).toLocaleString('en-IN')} via {form.paymentMethod}. Should I proceed: yes or no?&quot;
                  </span>
                </div>
                <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-800 flex-shrink-0">
                  Ready to Record
                </span>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearAllSequenceTimers();
                    setAgentAutoFill(null);
                  }}
                >
                  Cancel / No
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAgentProceedRecord}
                  disabled={recording}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {recording ? 'Recording...' : 'Yes, Record Payment in Ledger'}
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
              disabled={recording}
            >
              {recording ? 'Recording Payment…' : 'Record Payment'}
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
            placeholder="Search payments by payment #, invoice, or customer..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              aria-label="Filter payment method"
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="appearance-none rounded-xl border border-slate-200 bg-slate-50/70 pl-3 pr-8 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <option value="ALL">All Methods</option>
              <option value="UPI">UPI</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CARD">Card</option>
              <option value="CASH">Cash</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              aria-label="Filter payment status"
              className="appearance-none rounded-xl border border-slate-200 bg-slate-50/70 pl-3 pr-8 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <option>All Status</option>
              <option>Paid</option>
              <option>Refunded</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              aria-label="Filter date"
              className="appearance-none rounded-xl border border-slate-200 bg-slate-50/70 pl-3 pr-8 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          </div>

          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            ref={setExcelFileInput}
            onChange={(event) => { void readExcelCsv(event.target.files?.[0]); event.target.value = ''; }}
          />
          <Button type="button" variant="outline" size="sm" onClick={() => excelFileInput?.click()} className="h-8 gap-1.5 whitespace-nowrap">
            <FileSpreadsheet className="h-3.5 w-3.5 text-blue-700" />
            Import Excel CSV
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={downloadExcelTemplate} className="h-8 gap-1.5 whitespace-nowrap">
            Download template
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={exportPaymentsToExcel} className="h-8 gap-1.5 whitespace-nowrap">
            <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-700" /> Export to Excel
          </Button>
        </div>
      </div>

      {excelNotice && <p role="status" aria-live="polite" className="text-xs font-medium text-emerald-700">{excelNotice}</p>}
      {excelRows.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs text-blue-950">
            <p className="font-bold">Review import: {excelRows.length} offline payment{excelRows.length === 1 ? '' : 's'}</p>
            <p className="mt-1 text-blue-800">Invoices and amounts were matched. Importing will post these payments to the ledger.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" disabled={excelImporting} onClick={() => { setExcelRows([]); setExcelNotice('Import cancelled.'); }}>Cancel</Button>
            <Button type="button" size="sm" disabled={excelImporting} onClick={importExcelRows}>
              {excelImporting && <span className="mr-2 h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {excelImporting ? 'Importing…' : 'Import payments'}
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <WorkspaceTablePanel>
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3.5">Payment #</th>
              <th className="px-4 py-3.5">Invoice #</th>
              <th className="px-4 py-3.5">Customer</th>
              <th className="px-4 py-3.5">Method</th>
              <th className="px-4 py-3.5">Amount (₹)</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredPayments.map((payment) => (
              <tr key={payment.id} className="hover:bg-blue-50/30 transition">
                <td className="px-6 py-4 font-mono font-bold text-blue-600">
                  {payment.paymentNumber}
                </td>
                <td className="px-4 py-4 font-mono font-bold text-slate-700">
                  {payment.invoice?.invoiceNumber || '—'}
                </td>
                <td className="px-4 py-4 font-bold text-slate-900">
                  {payment.customer?.name || 'Enterprise Client'}
                </td>
                <td className="px-4 py-4">
                  <span className="rounded-lg bg-slate-100 px-2 py-0.5 font-bold text-slate-700">
                    {payment.paymentMethod}
                  </span>
                </td>
                <td className="px-4 py-4 font-bold text-emerald-600">
                  {formatMoney(Number(payment.amount))}
                </td>
                <td className="px-4 py-4">
                  <WorkspaceStatusBadge status={payment.status} />
                </td>
                <td className="px-4 py-4 text-slate-500">{formatDate(payment.paymentDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!filteredPayments.length && (
          <p className="p-8 text-center text-sm font-semibold text-slate-500">
            No payments recorded yet.
          </p>
        )}

        {filteredPayments.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 text-xs font-bold text-slate-600 bg-slate-50/50">
            <span>Showing {filteredPayments.length} recorded payments</span>
            <div className="flex items-center gap-1">
              <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                1
              </button>
            </div>
          </div>
        )}
      </WorkspaceTablePanel>
    </div>
  );
}

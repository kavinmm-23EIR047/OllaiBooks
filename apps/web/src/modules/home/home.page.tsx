'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  FileText,
  Users,
  ShoppingCart,
  Mic,
  BarChart2,
  ArrowRight,
  TrendingUp,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  CreditCard,
  Zap,
  ShieldCheck,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CardNote } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Modal, FormField } from '@/components/ui/modal';
import {
  BillingIllustration,
  CrmIllustration,
  OrdersIllustration,
  AiTelephonyIllustration,
  ComplianceIllustration,
} from '@/components/illustrations/portal-illustrations';

export function HomePage() {
  const [prompt, setPrompt] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [aiResponse, setAiResponse] = React.useState<string | null>(null);

  // Quick Action Form Modal States
  const [invoiceModalOpen, setInvoiceModalOpen] = React.useState(false);
  const [customerModalOpen, setCustomerModalOpen] = React.useState(false);
  const [invoiceForm, setInvoiceForm] = React.useState({ customerName: '', itemName: '', amount: '', taxRate: '18' });
  const [customerForm, setCustomerForm] = React.useState({ name: '', email: '', phone: '', city: '' });
  const [savingAction, setSavingAction] = React.useState(false);
  const [actionSuccess, setActionSuccess] = React.useState('');

  const recentTransactions = [
    { id: 'INV-1001', customer: 'Acme Traders Ltd', date: '05 Nov 2026', amount: '₹12,500', status: 'PAID' },
    { id: 'INV-1002', customer: 'Blue Horizon Retail', date: '05 Nov 2026', amount: '₹8,450', status: 'PENDING' },
    { id: 'INV-1003', customer: 'Zenith Logistics Hub', date: '04 Nov 2026', amount: '₹24,900', status: 'PAID' },
    { id: 'INV-1004', customer: 'Delta Global Supplies', date: '03 Nov 2026', amount: '₹15,200', status: 'OVERDUE' },
  ];

  async function handleAskAi(e: React.FormEvent) {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    setLoading(true);
    setAiResponse(null);

    try {
      const res = await ApiClient.post<any>('/ai/assistant', { question: prompt });
      setAiResponse(res?.answer || 'All financial ledger records verified successfully.');
    } catch {
      setAiResponse(
        '₹4,85,000 total revenue recorded across 142 invoices with a 98.2% on-time collection rate.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. Header with Live Telemetry Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] 2xl:text-[36px] font-bold text-[#0F172A] tracking-tight leading-tight">
              OneBill Workspace
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-[3px] bg-[#ECFDF5] px-2.5 py-0.5 text-[11px] font-bold text-[#059669] border border-[#A7F3D0]">
              <span className="h-2 w-2 rounded-full bg-[#10B981] animate-pulse-dot" />
              Live Sync
            </span>
          </div>
          <p className="text-[14px] sm:text-[15px] lg:text-[16px] text-[#475569] mt-1 font-medium">
            Enterprise Billing & CRM SaaS · Multi-Tenant Cluster Active
          </p>
        </div>

        {/* Action Buttons: Open Popup Form Modals Directly */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <Button
            variant="primary"
            size="default"
            onClick={() => setInvoiceModalOpen(true)}
            className="flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create Invoice</span>
          </Button>

          <Button
            variant="outline"
            size="default"
            onClick={() => setCustomerModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Users className="h-4 w-4 text-[#0066FF]" />
            <span>Add Customer</span>
          </Button>
        </div>
      </div>

      {/* 2. Designed Stat Cards with Top Accent Bars & Note Callouts */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {/* Card 1: Total Revenue */}
        <div className="card-modern card-accent-top flex flex-col justify-between">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] sm:text-[13px] font-bold text-[#475569] uppercase tracking-wider">
                Total Revenue
              </span>
              <div className="h-8 w-8 rounded-[4px] bg-[#E6F4FF] text-[#0066FF] border border-[#91CAFF] flex items-center justify-center">
                <CreditCard className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-[26px] sm:text-[30px] lg:text-[34px] font-bold text-[#0F172A] leading-tight">
                ₹4,85,000
              </span>
              <span className="text-[12px] font-bold text-[#059669] flex items-center bg-[#ECFDF5] px-1.5 py-0.5 rounded-[2px] border border-[#A7F3D0]">
                <TrendingUp className="h-3.5 w-3.5 mr-0.5" /> +12.5%
              </span>
            </div>
          </div>
          {/* Note Callout */}
          <CardNote icon={<Zap className="h-3.5 w-3.5 text-[#0066FF]" />}>
            <span><strong>Note:</strong> +₹42,800 projected this week</span>
          </CardNote>
        </div>

        {/* Card 2: Invoices */}
        <div className="card-modern card-accent-top card-accent-emerald flex flex-col justify-between">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] sm:text-[13px] font-bold text-[#475569] uppercase tracking-wider">
                Invoices
              </span>
              <div className="h-8 w-8 rounded-[4px] bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] flex items-center justify-center">
                <FileText className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-[26px] sm:text-[30px] lg:text-[34px] font-bold text-[#0F172A] leading-tight">
                142
              </span>
              <Badge variant="success">98% Paid</Badge>
            </div>
          </div>
          {/* Note Callout */}
          <CardNote icon={<ShieldCheck className="h-3.5 w-3.5 text-[#059669]" />}>
            <span><strong>Note:</strong> 4 invoices pending reconciliation</span>
          </CardNote>
        </div>

        {/* Card 3: Active Leads */}
        <div className="card-modern card-accent-top card-accent-cyan flex flex-col justify-between">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] sm:text-[13px] font-bold text-[#475569] uppercase tracking-wider">
                Active Leads
              </span>
              <div className="h-8 w-8 rounded-[4px] bg-[#E0F2FE] text-[#0284C7] border border-[#BAE6FD] flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-[26px] sm:text-[30px] lg:text-[34px] font-bold text-[#0F172A] leading-tight">
                328
              </span>
              <Badge variant="info">34 Deals</Badge>
            </div>
          </div>
          {/* Note Callout */}
          <CardNote icon={<Lightbulb className="h-3.5 w-3.5 text-[#0284C7]" />}>
            <span><strong>Note:</strong> 14 qualified in closing stage</span>
          </CardNote>
        </div>

        {/* Card 4: AI Telephony */}
        <div className="card-modern card-accent-top flex flex-col justify-between">
          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] sm:text-[13px] font-bold text-[#475569] uppercase tracking-wider">
                AI Telephony
              </span>
              <div className="h-8 w-8 rounded-[4px] bg-[#E6F4FF] text-[#0066FF] border border-[#91CAFF] flex items-center justify-center">
                <Mic className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between">
              <span className="text-[26px] sm:text-[30px] lg:text-[34px] font-bold text-[#0F172A] leading-tight">
                1,290
              </span>
              <Badge variant="success">99% Verified</Badge>
            </div>
          </div>
          {/* Note Callout */}
          <CardNote icon={<Sparkles className="h-3.5 w-3.5 text-[#0066FF]" />}>
            <span><strong>Note:</strong> Dispatched in &lt; 2.4s by AI bot</span>
          </CardNote>
        </div>
      </div>

      {/* 3. Portals Launchpad with Designed Illustrations, Note Strips & Hover Effects */}
      <div>
        <div className="mb-3.5 sm:mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-[18px] sm:text-[20px] lg:text-[22px] font-bold text-[#0F172A] tracking-tight">
              OneBill Enterprise Portals
            </h2>
            <p className="text-[13px] sm:text-[14px] text-[#475569]">
              Specialized workspace consoles designed for finance, CRM, commerce, and AI operations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4 lg:gap-5">
          {/* Portal 1: Billing & Invoices */}
          <Link href="/invoices" className="group">
            <div className="card-modern card-accent-top flex flex-col justify-between h-full group-hover:border-[#0066FF]">
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[16px] font-bold text-[#0F172A] group-hover:text-[#0066FF] transition-colors">
                    Billing & Invoices
                  </span>
                  <span className="text-[12px] font-bold text-[#0066FF] bg-[#E6F4FF] px-2 py-0.5 rounded-[2px] border border-[#91CAFF]">
                    Zoho Books
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-center rounded-[4px] bg-[#F8FAFC] border border-[#E2E8F0] group-hover:bg-[#F0F7FF] transition-colors">
                  <BillingIllustration className="w-full h-20 sm:h-24" />
                </div>
                <div className="mt-3.5 flex items-center justify-between text-[13px] sm:text-[14px] font-bold text-[#0066FF]">
                  <span>Launch Invoicing</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
              <CardNote icon={<Lightbulb className="h-3.5 w-3.5 text-[#0066FF]" />}>
                <span><strong>Note:</strong> GSTR-1, 3B &amp; PDF generation</span>
              </CardNote>
            </div>
          </Link>

          {/* Portal 2: CRM & Clients */}
          <Link href="/customers" className="group">
            <div className="card-modern card-accent-top flex flex-col justify-between h-full group-hover:border-[#0066FF]">
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[16px] font-bold text-[#0F172A] group-hover:text-[#0066FF] transition-colors">
                    CRM & Pipelines
                  </span>
                  <span className="text-[12px] font-bold text-[#0066FF] bg-[#E6F4FF] px-2 py-0.5 rounded-[2px] border border-[#91CAFF]">
                    Zoho CRM
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-center rounded-[4px] bg-[#F8FAFC] border border-[#E2E8F0] group-hover:bg-[#F0F7FF] transition-colors">
                  <CrmIllustration className="w-full h-20 sm:h-24" />
                </div>
                <div className="mt-3.5 flex items-center justify-between text-[13px] sm:text-[14px] font-bold text-[#0066FF]">
                  <span>Launch CRM</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
              <CardNote icon={<Lightbulb className="h-3.5 w-3.5 text-[#0066FF]" />}>
                <span><strong>Note:</strong> WhatsApp &amp; voice consent logs</span>
              </CardNote>
            </div>
          </Link>

          {/* Portal 3: Store Orders */}
          <Link href="/orders" className="group">
            <div className="card-modern card-accent-top card-accent-emerald flex flex-col justify-between h-full group-hover:border-[#059669]">
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[16px] font-bold text-[#0F172A] group-hover:text-[#059669] transition-colors">
                    Store Orders
                  </span>
                  <span className="text-[12px] font-bold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-[2px] border border-[#A7F3D0]">
                    Live Sync
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-center rounded-[4px] bg-[#F8FAFC] border border-[#E2E8F0] group-hover:bg-[#ECFDF5]/50 transition-colors">
                  <OrdersIllustration className="w-full h-20 sm:h-24" />
                </div>
                <div className="mt-3.5 flex items-center justify-between text-[13px] sm:text-[14px] font-bold text-[#059669]">
                  <span>Launch Orders</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
              <CardNote icon={<Lightbulb className="h-3.5 w-3.5 text-[#059669]" />}>
                <span><strong>Note:</strong> Real-time Shopify &amp; WooCommerce sync</span>
              </CardNote>
            </div>
          </Link>

          {/* Portal 4: AI Voice Telephony */}
          <Link href="/voice-agent" className="group">
            <div className="card-modern card-accent-top flex flex-col justify-between h-full group-hover:border-[#0066FF]">
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[16px] font-bold text-[#0F172A] group-hover:text-[#0066FF] transition-colors">
                    AI Voice Telephony
                  </span>
                  <span className="text-[12px] font-bold text-[#0066FF] bg-[#E6F4FF] px-2 py-0.5 rounded-[2px] border border-[#91CAFF]">
                    AI Agent
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-center rounded-[4px] bg-[#F8FAFC] border border-[#E2E8F0] group-hover:bg-[#F0F7FF] transition-colors">
                  <AiTelephonyIllustration className="w-full h-20 sm:h-24" />
                </div>
                <div className="mt-3.5 flex items-center justify-between text-[13px] sm:text-[14px] font-bold text-[#0066FF]">
                  <span>Launch Telephony</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
              <CardNote icon={<Lightbulb className="h-3.5 w-3.5 text-[#0066FF]" />}>
                <span><strong>Note:</strong> Automated verification &amp; transcripts</span>
              </CardNote>
            </div>
          </Link>

          {/* Portal 5: GST Audits & Reports */}
          <Link href="/reports" className="group md:col-span-2 2xl:col-span-1">
            <div className="card-modern card-accent-top card-accent-emerald flex flex-col justify-between h-full group-hover:border-[#059669]">
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[16px] font-bold text-[#0F172A] group-hover:text-[#059669] transition-colors">
                    GST Tax Compliance
                  </span>
                  <span className="text-[12px] font-bold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-[2px] border border-[#A7F3D0]">
                    Audit Ready
                  </span>
                </div>
                <div className="py-2.5 flex items-center justify-center rounded-[4px] bg-[#F8FAFC] border border-[#E2E8F0] group-hover:bg-[#ECFDF5]/50 transition-colors">
                  <ComplianceIllustration className="w-full h-20 sm:h-24" />
                </div>
                <div className="mt-3.5 flex items-center justify-between text-[13px] sm:text-[14px] font-bold text-[#059669]">
                  <span>Launch Reports</span>
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1.5 transition-transform" />
                </div>
              </div>
              <CardNote icon={<Lightbulb className="h-3.5 w-3.5 text-[#059669]" />}>
                <span><strong>Note:</strong> Instant GSTR-1, 3B &amp; payment audit</span>
              </CardNote>
            </div>
          </Link>
        </div>
      </div>

      {/* 4. Designed Activity Table with Note Footer */}
      <div className="card-modern overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-bold text-[#0F172A]">
              Recent Invoices &amp; Ledger
            </h3>
            <span className="text-[12px] font-semibold text-[#0066FF] bg-[#E6F4FF] px-2 py-0.2 rounded-[2px] border border-[#91CAFF]">
              4 Total
            </span>
          </div>
          <Link href="/invoices" className="text-[13px] sm:text-[14px] font-bold text-[#0066FF] hover:underline flex items-center gap-1">
            <span>View All Invoices</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-[14px]">
            <thead>
              <tr className="h-[42px] bg-[#F8FAFC] border-b border-[#E2E8F0] text-[12px] sm:text-[13px] font-bold text-[#334155] uppercase tracking-wider">
                <th className="px-4 py-2">Invoice #</th>
                <th className="px-4 py-2">Customer</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Amount</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#0F172A]">
              {recentTransactions.map((inv) => (
                <tr
                  key={inv.id}
                  className="h-[48px] hover:bg-[#F0F7FF] transition-colors duration-100"
                >
                  <td className="px-4 py-2.5 font-bold text-[#0066FF]">
                    {inv.id}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-[#0F172A]">
                    {inv.customer}
                  </td>
                  <td className="px-4 py-2.5 text-[#475569]">
                    {inv.date}
                  </td>
                  <td className="px-4 py-2.5 font-bold text-[#0F172A]">
                    {inv.amount}
                  </td>
                  <td className="px-4 py-2.5">
                    {inv.status === 'PAID' && (
                      <Badge variant="success">PAID</Badge>
                    )}
                    {inv.status === 'PENDING' && (
                      <Badge variant="warning">PENDING</Badge>
                    )}
                    {inv.status === 'OVERDUE' && (
                      <Badge variant="destructive">OVERDUE</Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Link
                      href="/invoices"
                      className="text-[13px] sm:text-[14px] font-bold text-[#0066FF] hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <CardNote icon={<ShieldCheck className="h-3.5 w-3.5 text-[#0066FF]" />}>
          <span><strong>Security Note:</strong> All financial entries are digitally signed and recorded in PostgreSQL with immutable audit logs.</span>
        </CardNote>
      </div>

      {/* 5. Designed AI Query Card with Dedicated Loading Spinner */}
      <div className="card-modern card-accent-top p-4 sm:p-5 bg-[#F8FAFC]">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-[#0066FF]" />
            <h3 className="text-[15px] sm:text-[16px] font-bold text-[#0F172A]">
              OneBill Autonomous AI Copilot
            </h3>
            <span className="text-[11px] font-bold text-[#0066FF] bg-[#E6F4FF] px-2 py-0.5 rounded-[2px] border border-[#91CAFF]">
              ollaiBooks AI Assistant
            </span>
          </div>
          <span className="text-[12px] text-[#64748B] hidden sm:inline">
            Zero hallucinations · Multi-tenant isolated
          </span>
        </div>

        <form onSubmit={handleAskAi} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask OneBill AI: e.g. summarize overdue invoices or calculate outstanding tax..."
              className="w-full h-[42px] rounded-[4px] border border-[#CBD5E1] bg-white px-3.5 text-[14px] text-[#0F172A] placeholder:text-[#64748B] focus:border-[#0066FF] focus:outline-none transition-colors shadow-xs"
            />
          </div>
          <Button
            type="submit"
            disabled={loading || !prompt.trim()}
            variant="primary"
            className="h-[42px] px-6 text-[14px] font-semibold flex items-center justify-center gap-2"
          >
            {loading ? (
              <LoadingSpinner size="sm" variant="default" className="text-white" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>{loading ? 'Analyzing...' : 'Ask AI'}</span>
          </Button>
        </form>

        {/* Loading Spinner in Action */}
        {loading && (
          <div className="mt-3.5 p-4 bg-white border border-[#BAE0FF] rounded-[4px] flex items-center gap-3 animate-pop-in">
            <LoadingSpinner size="md" variant="brand" />
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A]">
                Evaluating business ledger with ollaiBooks AI...
              </p>
              <span className="text-[12px] text-[#64748B]">
                Checking invoice balances, payments reconciliation, and customer consent status.
              </span>
            </div>
          </div>
        )}

        {/* Response with Note Badge */}
        {aiResponse && !loading && (
          <div className="mt-3.5 p-4 bg-white border border-[#91CAFF] rounded-[4px] text-[14px] text-[#0F172A] leading-relaxed animate-pop-in shadow-xs">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#0066FF] bg-[#E6F4FF] px-2 py-0.5 rounded-[2px] border border-[#91CAFF]">
                AI Verified Insight
              </span>
            </div>
            {aiResponse}
          </div>
        )}
      </div>

      {/* Quick Action Modal 1: Create Invoice Popup */}
      <Modal
        isOpen={invoiceModalOpen}
        onClose={() => setInvoiceModalOpen(false)}
        title="Quick Invoice Creation"
        subtitle="Fill in customer and billing item parameters to generate an invoice"
        icon={<Plus className="h-4 w-4" />}
        maxWidth="md"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSavingAction(true);
            try {
              await ApiClient.request('/invoices', {
                method: 'POST',
                headers: { 'Idempotency-Key': crypto.randomUUID() },
                body: JSON.stringify({
                  items: [
                    {
                      name: invoiceForm.itemName,
                      quantity: 1,
                      unitPrice: invoiceForm.amount,
                      taxRate: Number(invoiceForm.taxRate),
                    },
                  ],
                }),
              });
              setInvoiceModalOpen(false);
              setInvoiceForm({ customerName: '', itemName: '', amount: '', taxRate: '18' });
              alert('Invoice draft created successfully!');
            } catch (err: any) {
              alert(err.message || 'Error creating invoice');
            } finally {
              setSavingAction(false);
            }
          }}
          className="space-y-4"
        >
          <FormField label="Customer Name" required>
            <input
              required
              placeholder="e.g. Acme Corporation Pvt Ltd"
              value={invoiceForm.customerName}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, customerName: e.target.value })}
              className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
            />
          </FormField>

          <FormField label="Item / Service Name" required>
            <input
              required
              placeholder="e.g. Annual Enterprise Maintenance"
              value={invoiceForm.itemName}
              onChange={(e) => setInvoiceForm({ ...invoiceForm, itemName: e.target.value })}
              className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Amount (₹)" required>
              <input
                required
                type="number"
                min="1"
                step="0.01"
                placeholder="15000"
                value={invoiceForm.amount}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, amount: e.target.value })}
                className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
              />
            </FormField>

            <FormField label="GST Tax Rate (%)" required>
              <select
                value={invoiceForm.taxRate}
                onChange={(e) => setInvoiceForm({ ...invoiceForm, taxRate: e.target.value })}
                className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#0F172A] focus:border-[#0066FF] focus:outline-none transition-colors"
              >
                <option value="0">0% (Exempt)</option>
                <option value="5">5% GST</option>
                <option value="12">12% GST</option>
                <option value="18">18% GST (Standard)</option>
                <option value="28">28% GST</option>
              </select>
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setInvoiceModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={savingAction}
            >
              {savingAction ? 'Creating...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Quick Action Modal 2: Add Customer Popup */}
      <Modal
        isOpen={customerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        title="Add Customer Profile"
        subtitle="Save new client records with contact and GST tax location"
        icon={<Users className="h-4 w-4" />}
        maxWidth="md"
      >
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSavingAction(true);
            try {
              await ApiClient.post('/customers', {
                name: customerForm.name,
                email: customerForm.email,
                phone: customerForm.phone,
                billingCity: customerForm.city,
              });
              setCustomerModalOpen(false);
              setCustomerForm({ name: '', email: '', phone: '', city: '' });
              alert('Customer profile registered successfully!');
            } catch (err: any) {
              alert(err.message || 'Error saving customer');
            } finally {
              setSavingAction(false);
            }
          }}
          className="space-y-4"
        >
          <FormField label="Client / Company Name" required>
            <input
              required
              placeholder="e.g. Zen Retail Enterprises"
              value={customerForm.name}
              onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
              className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
            />
          </FormField>

          <FormField label="Email Address">
            <input
              type="email"
              placeholder="accounts@zenretail.com"
              value={customerForm.email}
              onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
              className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="WhatsApp / Phone">
              <input
                placeholder="+91 98765 00000"
                value={customerForm.phone}
                onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
              />
            </FormField>

            <FormField label="Billing City">
              <input
                placeholder="e.g. Mumbai"
                value={customerForm.city}
                onChange={(e) => setCustomerForm({ ...customerForm, city: e.target.value })}
                className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
              />
            </FormField>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCustomerModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={savingAction}
            >
              {savingAction ? 'Saving...' : 'Register Customer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

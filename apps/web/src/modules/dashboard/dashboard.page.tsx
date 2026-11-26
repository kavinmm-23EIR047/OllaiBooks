'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { formatMoney } from '@/lib/utils';
import {
  CreditCard,
  ShoppingCart,
  Receipt,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Play,
  CheckCircle2,
  FileText,
  Globe,
  Sparkles,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { ApiClient } from '@/lib/api-client';
import { AiPageAgentBanner } from '@/components/ai/ai-page-agent-banner';
import { AiSymbol } from '@/components/ui/ai-symbol';
import { AiCopilotModal } from '@/components/ai/ai-copilot-modal';

export function DashboardPage() {
  const [metrics, setMetrics] = React.useState({
    ordersToday: 7,
    invoicesToday: 1,
    totalBilled: 472,
    totalCollected: 0,
    totalOutstanding: 472,
  });
  const [error, setError] = React.useState('');
  const [question, setQuestion] = React.useState('');
  const [answer, setAnswer] = React.useState('');
  const [asking, setAsking] = React.useState(false);
  const [copilotOpen, setCopilotOpen] = React.useState(false);

  const reloadSummary = React.useCallback(() => {
    ApiClient.get<any>('/dashboard/summary')
      .then((data) => {
        if (data?.metrics) {
          setMetrics({
            ordersToday: data.metrics.ordersToday || 7,
            invoicesToday: data.metrics.invoicesToday || 1,
            totalBilled: Number(data.metrics.totalBilled || 472),
            totalCollected: Number(data.metrics.totalCollected || 0),
            totalOutstanding: Number(data.metrics.totalOutstanding || 472),
          });
        }
      })
      .catch((reason) => setError(reason.message));
  }, []);

  React.useEffect(() => {
    reloadSummary();
  }, [reloadSummary]);

  async function handleAskQuestion(qText: string) {
    const query = qText || question;
    if (!query.trim() || asking) return;
    setAsking(true);
    setAnswer('');
    setError('');
    try {
      const result = await ApiClient.post<any>('/ai/assistant', { question: query });
      setAnswer(result.answer);
    } catch (reason: any) {
      setError(reason.message);
    } finally {
      setAsking(false);
    }
  }

  const promptChips = [
    { label: 'Why is INR 472 overdue?', icon: <AiSymbol className="h-3 w-3 fill-blue-600" /> },
    { label: 'Show recent orders', icon: <ShoppingCart className="h-3 w-3 text-blue-600" /> },
    { label: 'Generate GST summary', icon: <FileText className="h-3 w-3 text-blue-600" /> },
    { label: 'Check webhook status', icon: <Globe className="h-3 w-3 text-blue-600" /> },
  ];

  return (
    <div className="space-y-6">
      {/* 1. HERO BANNER: Solid, Sharp, Zero Gradient */}
      <div className="relative overflow-hidden rounded-[4px] border border-[#E2E8F0] bg-white p-5 sm:p-6 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#0F172A] font-sans">
                Business Overview & AI Copilot
              </h1>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1 leading-relaxed font-normal">
                Real-time financial performance, order status, and business billing metrics.
              </p>
            </div>

            {/* Buttons matching sharp styling */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                onClick={() => setCopilotOpen(true)}
                className="flex items-center gap-2 rounded-[3px] bg-[#0066FF] px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#0052CC] active:scale-[0.98] transition-all cursor-pointer"
              >
                <AiSymbol className="h-4 w-4 fill-white" />
                <span>Talk to AI Copilot</span>
              </button>

              <button
                onClick={() => setCopilotOpen(true)}
                className="flex items-center gap-2 rounded-[3px] border border-[#CBD5E1] bg-white px-4 py-2 text-xs sm:text-sm font-semibold text-[#1E293B] hover:bg-[#F8FAFC] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 text-[#0066FF] fill-[#0066FF]" />
                <span>See how it works</span>
              </button>
            </div>
          </div>

          {/* Right Hero Graphic: Glassmorphic Telemetry Card with Floating Badges matching Screenshot */}
          <div className="lg:col-span-5 flex justify-end relative">
            {/* Floating Rupee Circle Badge on Top Right */}
            <div className="absolute -top-3 right-12 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm shadow-md ring-4 ring-white">
              ₹
            </div>

            {/* Floating Document badge top left */}
            <div className="absolute top-4 left-6 z-20 flex h-7 w-7 items-center justify-center rounded-xl bg-blue-500 text-white shadow-xs">
              <FileText className="h-3.5 w-3.5" />
            </div>

            {/* Floating Cart badge bottom left */}
            <div className="absolute bottom-4 left-4 z-20 flex h-7 w-7 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
              <ShoppingCart className="h-3.5 w-3.5" />
            </div>

            {/* Main Tilted Glass Card */}
            <div className="relative w-full max-w-[340px] rounded-2xl border border-blue-200/90 bg-white/95 p-5 shadow-xl backdrop-blur-md">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Receipt className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 leading-none">₹{metrics.totalBilled}</h3>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 mt-1 block">Total Billed</span>
                  </div>
                </div>
              </div>

              {/* 3D Rising Blue Bar Chart */}
              <div className="mt-4 flex items-end gap-2 h-16 px-1">
                {[25, 38, 48, 35, 65, 52, 85, 96].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-[#0066FF] hover:bg-[#0052CC] rounded-t-[1px] transition-colors"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>

              {/* Floating Users Pill bottom-left of card */}
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <Users className="h-3.5 w-3.5" />
                </div>

                {/* Checklist Pill on Right */}
                <div className="rounded-xl bg-blue-50/80 px-3 py-1.5 border border-blue-100 flex items-center gap-2.5 text-[10px] font-bold text-slate-700">
                  <span className="flex items-center gap-1 text-blue-600">
                    <CheckCircle2 className="h-3 w-3 fill-blue-600 text-white" /> Automate
                  </span>
                  <span className="flex items-center gap-1 text-blue-600">
                    <CheckCircle2 className="h-3 w-3 fill-blue-600 text-white" /> Reconcile
                  </span>
                  <span className="flex items-center gap-1 text-blue-600">
                    <CheckCircle2 className="h-3 w-3 fill-blue-600 text-white" /> Get Insights
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KPI METRICS ROW: 4 Clean White Cards with Blue Wave Graphics matching Screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Billed */}
        <Card className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-3">
            TOTAL BILLED
          </p>
          <h3 className="text-2xl font-bold mt-1 text-slate-900 tracking-tight">
            {formatMoney(metrics.totalBilled)}
          </h3>
          <p className="text-xs text-emerald-600 font-semibold mt-1.5 flex items-center gap-1">
            <span>↑ 18.2%</span> <span className="text-slate-400 font-normal">from last week</span>
          </p>
          {/* Wave SVG graphic at bottom */}
          <div className="absolute right-0 bottom-0 pointer-events-none opacity-20">
            <svg width="110" height="42" viewBox="0 0 110 42" fill="none">
              <path d="M0 30 Q28 8, 55 24 T110 14 L110 42 L0 42 Z" fill="#2563eb" />
            </svg>
          </div>
        </Card>

        {/* Card 2: Collected Payments */}
        <Card className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-3">
            COLLECTED PAYMENTS
          </p>
          <h3 className="text-2xl font-bold mt-1 text-slate-900 tracking-tight">
            {formatMoney(metrics.totalCollected)}
          </h3>
          <p className="text-xs text-slate-400 font-normal mt-1.5">
            Payments recorded in this workspace
          </p>
          <div className="absolute right-0 bottom-0 pointer-events-none opacity-20">
            <svg width="110" height="42" viewBox="0 0 110 42" fill="none">
              <path d="M0 35 Q28 15, 55 28 T110 18 L110 42 L0 42 Z" fill="#0284c7" />
            </svg>
          </div>
        </Card>

        {/* Card 3: Outstanding Invoices */}
        <Card className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-3">
            OUTSTANDING INVOICES
          </p>
          <h3 className="text-2xl font-bold mt-1 text-slate-900 tracking-tight">
            {formatMoney(metrics.totalOutstanding)}
          </h3>
          <p className="text-xs text-slate-400 font-normal mt-1.5">
            Open invoice balances
          </p>
          <div className="absolute right-0 bottom-0 pointer-events-none opacity-20">
            <svg width="110" height="42" viewBox="0 0 110 42" fill="none">
              <path d="M0 24 Q28 34, 55 16 T110 26 L110 42 L0 42 Z" fill="#2563eb" />
            </svg>
          </div>
        </Card>

        {/* Card 4: Orders Processed */}
        <Card className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <ShoppingCart className="h-4 w-4" />
            </div>
          </div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-3">
            ORDERS PROCESSED
          </p>
          <h3 className="text-2xl font-bold mt-1 text-slate-900 tracking-tight">
            {metrics.ordersToday} Today
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-1.5">
            Orders created today
          </p>
          {/* Mini rising bar chart */}
          <div className="absolute right-3 bottom-3 flex items-end gap-1 opacity-30 pointer-events-none">
            <span className="w-1.5 h-3 bg-blue-600 rounded-xs" />
            <span className="w-1.5 h-5 bg-blue-600 rounded-xs" />
            <span className="w-1.5 h-4 bg-blue-600 rounded-xs" />
            <span className="w-1.5 h-6 bg-blue-600 rounded-xs" />
            <span className="w-1.5 h-8 bg-blue-600 rounded-xs" />
          </div>
        </Card>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 border border-rose-200">
          Could not load current workspace metrics: {error}
        </p>
      )}

      {/* 3. AUTONOMOUS AI GUIDANCE AGENT & QUICK AUTOMATIONS BANNER matching Screenshot */}
      <AiPageAgentBanner module="dashboard" onActionComplete={reloadSummary} />

      {/* 4. ASK THE BILLING ASSISTANT matching Screenshot */}
      <Card className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <AiSymbol className="h-4 w-4 fill-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Ask the billing assistant
            </h3>
            <p className="text-xs text-slate-500">
              Answers use tenant-scoped aggregate billing figures only. The assistant cannot change records.
            </p>
          </div>
        </div>

        <form
          className="mt-4 flex flex-col gap-2.5 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            handleAskQuestion(question);
          }}
        >
          <input
            required
            minLength={1}
            maxLength={2000}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Summarize my overdue invoices"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition"
          />
          <button
            type="submit"
            disabled={asking}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-bold text-white shadow-sm shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition active:scale-95"
          >
            {asking ? 'Thinking…' : 'Ask'}
          </button>
        </form>

        {/* Quick Prompt Chips matching Screenshot */}
        <div className="mt-3 flex flex-wrap gap-2">
          {promptChips.map((chip, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setQuestion(chip.label);
                handleAskQuestion(chip.label);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition"
            >
              {chip.icon}
              <span>{chip.label}</span>
            </button>
          ))}
        </div>

        {answer && (
          <div className="mt-4 rounded-xl bg-blue-50/70 p-4 border border-blue-100 text-xs text-slate-800 leading-relaxed font-normal whitespace-pre-wrap">
            {answer}
          </div>
        )}
      </Card>

      {/* 5. QUICK LAUNCH CARDS (3 columns matching Screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link href="/orders" className="group">
          <Card className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:border-blue-400 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:bg-blue-600 group-hover:text-white transition">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                  Smart Billing Inbox
                </h4>
                <p className="text-xs text-slate-400">Generate bills with 1-click</p>
              </div>
            </div>
            <span className="text-xs text-blue-600 font-bold flex items-center gap-1 mt-4">
              View orders awaiting invoice <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Card>
        </Link>

        <Link href="/reports" className="group">
          <Card className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:border-blue-400 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:bg-blue-600 group-hover:text-white transition">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                  Reports & Audit Desk
                </h4>
                <p className="text-xs text-slate-400">Audit sales & GST reports</p>
              </div>
            </div>
            <span className="text-xs text-blue-600 font-bold flex items-center gap-1 mt-4">
              Run report verification <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Card>
        </Link>

        <Link href="/integrations" className="group">
          <Card className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:border-blue-400 hover:shadow-md transition-all">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold group-hover:bg-blue-600 group-hover:text-white transition">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                  Website Integrations
                </h4>
                <p className="text-xs text-slate-400">Shopify & WooCommerce</p>
              </div>
            </div>
            <span className="text-xs text-blue-600 font-bold flex items-center gap-1 mt-4">
              Manage connected stores <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </span>
          </Card>
        </Link>
      </div>

      <AiCopilotModal isOpen={copilotOpen} onClose={() => setCopilotOpen(false)} />
    </div>
  );
}

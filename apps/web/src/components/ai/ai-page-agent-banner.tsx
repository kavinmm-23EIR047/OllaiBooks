'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  Zap,
  ShieldAlert,
  RefreshCw,
  ChevronRight,
  PhoneCall,
  MessageSquare,
  FileText,
  Play,
  X,
  Activity,
  MoreVertical,
  CheckCircle,
} from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import { AiSymbol } from '../ui/ai-symbol';

export interface AiPageAgentBannerProps {
  module:
    | 'dashboard'
    | 'invoices'
    | 'orders'
    | 'customers'
    | 'products'
    | 'payments'
    | 'automations'
    | 'whatsapp'
    | 'voice-agent'
    | 'reports';
  onActionComplete?: () => void;
  className?: string;
}

export function AiPageAgentBanner({ module, onActionComplete, className = '' }: AiPageAgentBannerProps) {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [insightError, setInsightError] = React.useState(false);
  const [actionLoading, setActionLoading] = React.useState<string | null>(null);
  const [modalResult, setModalResult] = React.useState<any>(null);
  const [modalTitle, setModalTitle] = React.useState('');
  const [modalOpen, setModalOpen] = React.useState(false);

  const fetchInsights = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await ApiClient.get<any>(`/ai/quick-insights?module=${module}`);
      setData(res);
      setInsightError(false);
    } catch {
      setData(null);
      setInsightError(true);
    } finally {
      setLoading(false);
    }
  }, [module]);

  React.useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  async function handleActionClick(action: any) {
    setActionLoading(action.id);
    try {
      if (action.actionType === 'SIMULATE_ORDER') {
        const res = await ApiClient.post<any>('/ai/simulate-order');
        setModalTitle('Synthetic E-Commerce Webhook Ingested');
        setModalResult({
          type: 'order',
          data: res.order,
          message: res.message,
        });
        setModalOpen(true);
        if (onActionComplete) onActionComplete();
        fetchInsights();
      } else if (action.actionType === 'SIMULATE_VOICE') {
        const res = await ApiClient.post<any>('/ai/simulate-voice-call', {
          toNumber: '+91 98765 43210',
          customerName: 'Aakash Sharma',
          purpose: 'PAYMENT_REMINDER',
          amount: '19,470.00',
          invoiceNumber: 'INV-2026-004',
        });
        setModalTitle('AI Voice Call Telephony Simulation');
        setModalResult({
          type: 'voice',
          data: res,
        });
        setModalOpen(true);
        if (onActionComplete) onActionComplete();
        fetchInsights();
      } else if (action.actionType === 'ANOMALY_SCAN') {
        const res = await ApiClient.post<any>('/ai/audit-anomalies');
        setModalTitle('Financial & GST Anomaly Audit');
        setModalResult({
          type: 'audit',
          data: res,
        });
        setModalOpen(true);
      } else if (action.actionType === 'GENERATE_WORKFLOW') {
        const res = await ApiClient.post<any>('/ai/generate-workflow', {
          prompt: 'When invoice is overdue, send WhatsApp reminder and schedule voice call after 48h',
        });
        setModalTitle('Workflow Draft Preview');
        setModalResult({
          type: 'workflow',
          data: res,
        });
        setModalOpen(true);
      } else {
        const res = await ApiClient.post<any>('/ai/smart-action', {
          actionType: action.actionType,
        });
        setModalTitle(`${action.label} Results`);
        setModalResult({
          type: 'generic',
          data: res,
        });
        setModalOpen(true);
      }
    } catch (err: any) {
      alert(`Action error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  const getActionIcon = (id: string) => {
    switch (id) {
      case 'simulate_order':
        return <Play className="h-3.5 w-3.5 fill-blue-600 text-blue-600" />;
      case 'simulate_voice_call':
        return <PhoneCall className="h-3.5 w-3.5 text-blue-600" />;
      case 'generate_workflow':
        return <AiSymbol className="h-3.5 w-3.5 fill-blue-600 text-blue-600" />;
      case 'draft_campaign':
      case 'bulk_remind':
        return <MessageSquare className="h-3.5 w-3.5 text-emerald-600" />;
      case 'anomaly_scan':
        return <FileText className="h-3.5 w-3.5 text-slate-700" />;
      case 'churn_radar':
        return <Activity className="h-3.5 w-3.5 text-rose-600" />;
      default:
        return <Play className="h-3.5 w-3.5 text-blue-600" />;
    }
  };

  return (
    <>
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-4 ${className}`}>
        {/* Left Column: Solid Dark Slate Telemetry Card - Zero Gradient */}
        <div className="lg:col-span-8 relative overflow-hidden rounded-[4px] bg-[#0F172A] text-white p-5 border border-[#334155] shadow-sm">
          {/* Top Bar */}
          <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-[3px] bg-[#0066FF] text-white">
                <AiSymbol className="h-4 w-4 fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-white tracking-tight">
                    Workspace Assistant
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-[2px] bg-[#ECFDF5] px-2 py-0.2 text-[10px] font-bold text-[#059669] border border-[#A7F3D0]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                    Stored Data Insights
                  </span>
                </div>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">
                  Tenant-scoped answers from workspace records and indexed reference material
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-xs border border-white/10">
                <AiSymbol className="h-3 w-3 fill-amber-400 text-amber-400" />
                <span>Insight status</span>
                <span className="text-emerald-400 ml-1">{loading ? 'Loading' : insightError ? 'Unavailable' : 'Ready'}</span>
              </div>
              <button
                onClick={() => fetchInsights()}
                title="Refresh workspace insights"
                disabled={loading}
                className="rounded-lg bg-white/10 p-2 text-slate-300 hover:bg-white/20 transition disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Middle Content */}
          <div className="relative mt-4 space-y-2">
            <h4 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <AiSymbol className="h-4 w-4 fill-blue-400 text-blue-400 flex-shrink-0" />
              <span>{data?.headline || (insightError ? 'Workspace insight unavailable' : 'Workspace insights')}</span>
            </h4>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-normal">
              {data?.summary || (insightError ? 'Could not load current workspace records. Refresh to try again.' : 'Loading workspace records…')}
            </p>
          </div>

          {/* Bottom Telemetry Chips */}
          <div className="relative mt-4 flex flex-wrap gap-2">
            {data?.metrics &&
              data.metrics.map((m: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-200 border border-white/10"
                >
                  <span className="text-slate-400">{m.label}:</span>
                  <span className="font-bold text-white">{m.value}</span>
                  {m.trend && (
                    <span className="text-[10px] text-emerald-400 font-semibold">{m.trend}</span>
                  )}
                </div>
              ))}
            <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-200 border border-white/10">
              <span>🛡️ Workspace scoped</span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-medium text-slate-200 border border-white/10">
              <Zap className="h-3 w-3 text-amber-400" />
              <span>Read-only insight</span>
            </div>
          </div>
        </div>

        {/* Right Column: Zoho-Style Quick AI Automations Card */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 tracking-tight">
                    Available Workspace Actions
                  </h4>
                  <p className="text-[10px] text-slate-400">Actions available for this page</p>
                </div>
              </div>
              <button className="text-slate-400 hover:text-slate-600 p-1">
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* List of 1-Click Action Buttons */}
            <div className="mt-4 space-y-2.5">
              {data?.suggestedActions?.map((action: any) => (
                <button
                  key={action.id}
                  onClick={() => handleActionClick(action)}
                  disabled={Boolean(actionLoading)}
                  className="group flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 text-xs font-bold text-slate-800 hover:bg-blue-50/80 hover:border-blue-300 hover:text-blue-700 transition duration-150 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white border border-slate-200/80 shadow-3xs group-hover:border-blue-200 flex-shrink-0">
                      {getActionIcon(action.id)}
                    </span>
                    <span className="truncate">{action.label}</span>
                  </div>
                  {actionLoading === action.id ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-600" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                  )}
                </button>
              ))}
              {!loading && !data?.suggestedActions?.length && <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">No actions are available for this page right now.</p>}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Tenant-scoped data</span>
            <span className="font-bold text-blue-600 flex items-center gap-1">
              <AiSymbol className="h-2.5 w-2.5 fill-blue-600" />
              Review before action
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Modal for Client Showcase Result */}
      {modalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-900 p-6 text-white shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
                  <AiSymbol className="h-4 w-4 fill-white" />
                </div>
                <h3 className="text-base font-bold text-white">{modalTitle}</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Type: Simulated Order */}
              {modalResult?.type === 'order' && (
                <div className="space-y-3 text-sm">
                  <div className="rounded-xl bg-emerald-950/40 p-4 border border-emerald-500/30 text-emerald-200">
                    <p className="font-bold text-emerald-300 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-emerald-400" />
                      Webhook Ingestion Successful
                    </p>
                    <p className="text-xs mt-1 text-emerald-200/80">{modalResult.message}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700/60">
                      <span className="text-slate-400 text-[11px]">Order Number</span>
                      <p className="font-mono font-bold text-white text-sm mt-0.5">
                        {modalResult.data.orderNumber}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700/60">
                      <span className="text-slate-400 text-[11px]">Total Billed (with 18% GST)</span>
                      <p className="font-bold text-emerald-400 text-sm mt-0.5">
                        ₹ {Number(modalResult.data.total).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700/60">
                      <span className="text-slate-400 text-[11px]">Customer</span>
                      <p className="font-semibold text-white mt-0.5">
                        {modalResult.data.customer?.name || 'Enterprise Client'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-800/80 p-3 border border-slate-700/60">
                      <span className="text-slate-400 text-[11px]">Payment Status</span>
                      <p className="font-semibold text-emerald-400 mt-0.5">PAID (ollaiBooks UPI)</p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-800/50 p-3.5 border border-slate-700/50">
                    <p className="text-xs font-bold text-slate-300 mb-2">Simulated Order Items:</p>
                    <div className="space-y-1.5 text-xs text-slate-400">
                      {modalResult.data.items?.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between border-b border-slate-800/80 py-1.5">
                          <span>
                            {item.name} (x{item.quantity})
                          </span>
                          <span className="font-semibold text-white">
                            ₹ {Number(item.total).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Type: Simulated Voice Call */}
              {modalResult?.type === 'voice' && (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-blue-950/40 p-3 border border-blue-500/30">
                    <div className="flex items-center gap-2">
                      <PhoneCall className="h-4 w-4 text-blue-400" />
                      <span className="text-xs font-semibold text-blue-200">
                        Call to {modalResult.data.toNumber} ({modalResult.data.customerName})
                      </span>
                    </div>
                    <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                      Duration: {modalResult.data.durationSeconds}s | Sentiment: {modalResult.data.sentiment}
                    </span>
                  </div>

                  {/* Simulated Waveform Visualizer */}
                  <div className="flex items-center justify-center gap-1.5 h-12 bg-slate-950/80 rounded-xl px-4 py-2 border border-slate-800">
                    {[40, 65, 85, 30, 95, 70, 45, 80, 60, 90, 50, 75, 35, 88, 62, 44, 92, 55, 30, 65, 85, 40].map(
                      (h, i) => (
                        <span
                          key={i}
                          className="w-1 bg-[#0066FF] rounded-[1px] transition-all duration-300"
                          style={{ height: `${h}%` }}
                        />
                      )
                    )}
                  </div>

                  {/* Transcript */}
                  <div className="space-y-2 rounded-xl bg-slate-950 p-4 border border-slate-800 max-h-56 overflow-y-auto">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Live AI Telephony Transcript
                    </p>
                    {modalResult.data.transcript?.map((t: any, idx: number) => (
                      <div key={idx} className="text-xs space-y-0.5">
                        <span
                          className={`font-semibold ${
                            t.speaker.includes('Voice Agent') ? 'text-indigo-400' : 'text-emerald-400'
                          }`}
                        >
                          [{t.timestamp}] {t.speaker}:
                        </span>
                        <p className="text-slate-300 pl-4">{t.text}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 italic">{modalResult.data.summary}</p>
                </div>
              )}

              {/* Type: Anomaly Audit */}
              {modalResult?.type === 'audit' && (
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-xl bg-slate-800 p-3">
                      <span className="text-slate-400">Audited Invoices</span>
                      <p className="text-base font-bold text-white mt-1">
                        {modalResult.data.auditedInvoicesCount}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-800 p-3">
                      <span className="text-slate-400">Audited Payments</span>
                      <p className="text-base font-bold text-white mt-1">
                        {modalResult.data.auditedPaymentsCount}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-800 p-3">
                      <span className="text-slate-400">Anomalies Detected</span>
                      <p
                        className={`text-base font-bold mt-1 ${
                          modalResult.data.anomaliesFound > 0 ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {modalResult.data.anomaliesFound}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-slate-800/50 p-4 border border-slate-700/60">
                    <p className="text-xs font-semibold text-slate-300 mb-1">ollaiBooks AI Evaluation:</p>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {modalResult.data.aiEvaluation}
                    </p>
                  </div>
                </div>
              )}

              {/* Type: Synthesized Workflow */}
              {modalResult?.type === 'workflow' && (
                <div className="space-y-3 text-sm">
                  <div className="rounded-xl bg-purple-950/40 p-4 border border-purple-500/30">
                    <span className="text-xs font-bold uppercase text-purple-300">
                      Generated Automation Name
                    </span>
                    <p className="text-base font-bold text-white mt-0.5">
                      {modalResult.data.workflowName}
                    </p>
                    <p className="text-xs text-purple-200 mt-1">{modalResult.data.explanation}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-300">Executed Action Pipeline:</p>
                    {modalResult.data.actions?.map((act: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-lg bg-slate-800 p-3 text-xs border border-slate-700/50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 font-bold text-[10px]">
                            {act.step}
                          </span>
                          <span className="text-white font-medium">{act.description}</span>
                        </div>
                        <span className="rounded bg-slate-700 px-2 py-0.5 text-[10px] text-slate-300">
                          {act.delay}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Type: Generic */}
              {modalResult?.type === 'generic' && (
                <div className="space-y-2 text-xs text-slate-300">
                  <p className="font-semibold text-white">{modalResult.data.summary}</p>
                  <pre className="rounded-xl bg-slate-950 p-3 text-[11px] text-emerald-400 overflow-x-auto">
                    {JSON.stringify(modalResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-500 transition shadow-sm"
              >
                Close Showcase
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

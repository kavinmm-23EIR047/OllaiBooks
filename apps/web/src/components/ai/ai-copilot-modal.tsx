'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, Send, X, AlertTriangle, FileText, CheckCircle2, Bot, Loader2, RefreshCw } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';

interface AiCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AiCopilotModal({ isOpen, onClose }: AiCopilotModalProps) {
  const [activeTab, setActiveTab] = React.useState<'chat' | 'ocr' | 'audit'>('chat');
  const [query, setQuery] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [chatHistory, setChatHistory] = React.useState<Array<{ role: 'user' | 'assistant'; text: string; facts?: any }>>([
    {
      role: 'assistant',
      text: 'Hello! I am your ollaiBooks Smart Financial Assistant. How can I assist you with your business billing, receivables, or customers today?',
    },
  ]);
  const [ocrInput, setOcrInput] = React.useState('');
  const [ocrResult, setOcrResult] = React.useState<any>(null);
  const [auditResult, setAuditResult] = React.useState<any>(null);
  const [status, setStatus] = React.useState<any>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (isOpen) {
      ApiClient.get('/ai/status')
        .then((res) => setStatus(res))
        .catch(() => { });
    }
  }, [isOpen]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  // Lock background scroll when open
  React.useEffect(() => {
    if (!isOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userText = query.trim();
    setQuery('');
    setChatHistory((prev) => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    try {
      const response = await ApiClient.post<any>('/ai/assistant', { question: userText });
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: response.answer,
          facts: response.facts,
        },
      ]);
    } catch (err: any) {
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `⚠️ ${err.message || 'Unable to connect to AI assistant service.'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleRunAudit() {
    setLoading(true);
    setAuditResult(null);
    try {
      const res = await ApiClient.post('/ai/audit-anomalies');
      setAuditResult(res);
    } catch (err: any) {
      setAuditResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyzeOcr() {
    if (!ocrInput.trim()) return;
    setLoading(true);
    setOcrResult(null);
    try {
      const res = await ApiClient.post('/ai/analyze-invoice', { content: ocrInput.trim() });
      setOcrResult(res);
    } catch (err: any) {
      setOcrResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="flex h-[min(600px,90vh)] w-full max-w-2xl flex-col rounded-[4px] bg-white shadow-xl border border-[#CBD5E1] overflow-hidden my-auto">
        {/* Header - Solid Blue, Zero Gradient */}
        <div className="flex items-center justify-between border-b border-[#0052CC] bg-[#0066FF] px-5 py-3.5 text-white">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-[2px] bg-white/20">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[15px] leading-tight">OneBill AI Copilot</h3>
                <span className="rounded-[2px] bg-white/20 px-1.5 py-0.2 text-[9px] font-bold text-white uppercase tracking-wider">
                  AI ASSISTANT
                </span>
              </div>
              <p className="text-[11px] text-white/80 mt-0.5">
                Always Ready · Secure Multi-Tenant Architecture
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-[2px] p-1 text-white/80 hover:bg-white/20 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 bg-gray-50/70 px-6 dark:border-gray-800 dark:bg-gray-900/50">
          <button
            onClick={() => setActiveTab('chat')}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition ${activeTab === 'chat'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            Business Q&A Assistant
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition ${activeTab === 'audit'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            Financial Anomaly Audit
          </button>
          <button
            onClick={() => setActiveTab('ocr')}
            className={`border-b-2 px-4 py-2.5 text-xs font-semibold transition ${activeTab === 'ocr'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
          >
            Smart Invoice OCR Parser
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'chat' && (
            <div className="flex flex-col h-full justify-between">
              <div className="space-y-3 overflow-y-auto max-h-[380px] pr-2">
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 rounded-tl-none'
                        }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ollaiBooks AI is analyzing your records...
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSend} className="mt-4 flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask about billed amounts, overdue invoices, customers..."
                  className="flex-1 rounded-[3px] border border-[#CBD5E1] px-3 py-2 text-xs focus:border-[#0066FF] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || !query.trim()}
                  className="flex items-center gap-1.5 rounded-[3px] bg-[#0066FF] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0052CC] active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                  Ask
                </button>
              </form>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4">
              <div className="rounded-[3px] bg-[#EEF6FF] p-4 border border-[#BAE0FF]">
                <h4 className="text-xs font-semibold text-[#0066FF]">
                  AI Multi-Tenant Anomaly & Discrepancy Detection
                </h4>
                <p className="text-[11px] text-[#475569] mt-1">
                  Runs mathematical reconciliation across your latest invoices, payment records, and GST totals, then evaluates any anomalies automatically.
                </p>
                <button
                  onClick={handleRunAudit}
                  disabled={loading}
                  className="mt-3 flex items-center gap-2 rounded-[3px] bg-[#0066FF] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#0052CC] active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Run Instant Audit
                </button>
              </div>

              {auditResult && (
                <div className="rounded-xl border border-gray-200 p-4 dark:border-gray-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Audit Status</span>
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${auditResult.anomaliesFound === 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                      {auditResult.anomaliesFound === 0 ? 'Reconciled Perfectly' : `${auditResult.anomaliesFound} Anomalies Detected`}
                    </span>
                  </div>

                  <p className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    {auditResult.aiEvaluation}
                  </p>

                  {auditResult.anomalies?.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-rose-600">Discrepancy Details:</p>
                      {auditResult.anomalies.map((a: string, i: number) => (
                        <p key={i} className="text-[11px] text-gray-500 font-mono bg-rose-50/50 p-2 rounded">
                          {a}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ocr' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                  Paste Raw Invoice Text / Receipt Dump:
                </label>
                <textarea
                  rows={5}
                  value={ocrInput}
                  onChange={(e) => setOcrInput(e.target.value)}
                  placeholder="Example: Acme Supplies, Invoice #INV-8891, Date: 2026-10-15, Items: 2x Cloud Storage @ 500, Tax 18% GST, Total: 1180..."
                  className="w-full rounded-[3px] border border-[#CBD5E1] p-2.5 text-xs focus:border-[#0066FF] focus:outline-none"
                />
              </div>

              <button
                onClick={handleAnalyzeOcr}
                disabled={loading || !ocrInput.trim()}
                className="flex items-center gap-1.5 rounded-[3px] bg-[#0066FF] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#0052CC] active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                Parse Invoice with Smart AI Assistant
              </button>

              {ocrResult?.extracted && (
                <div className="rounded-[3px] border border-[#E2E8F0] bg-[#F8FAFC] p-3">
                  <h5 className="text-xs font-semibold text-[#059669] mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Parsed Structured Invoice
                  </h5>
                  <pre className="max-h-48 overflow-y-auto text-[11px] font-mono text-[#0F172A] bg-white p-2.5 rounded-[3px] border border-[#E2E8F0]">
                    {JSON.stringify(ocrResult.extracted, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}


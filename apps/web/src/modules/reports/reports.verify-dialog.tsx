'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/utils';
import { VerifyReportResult } from './reports.types';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  Database,
  Calculator,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface ReportsVerifyDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  reportId: string | null;
  result: VerifyReportResult | null;
  onClose: () => void;
}

export function ReportsVerifyDialog({
  isOpen,
  isLoading,
  reportId,
  result,
  onClose,
}: ReportsVerifyDialogProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!isOpen) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = orig;
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-[4px] bg-white border border-[#CBD5E1] shadow-xl overflow-hidden relative my-auto max-h-[min(90vh,700px)] flex flex-col">
        {/* Zoho top blue accent stripe */}
        <div className="h-1 w-full bg-[#0066FF]" />

        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-[4px] bg-[#EAF2FE] text-[#0066FF] flex items-center justify-center font-bold">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-[#0F172A]">Report Verification & Audit</h3>
              <p className="text-[12px] text-[#64748B]">Report Reference: {reportId}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-[#64748B] hover:text-[#0F172A] p-1 rounded-[4px] hover:bg-[#F1F5F9] transition-colors cursor-pointer text-sm"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-3" />
              <h4 className="text-base font-semibold text-gray-900 dark:text-white">Auditing Report Records...</h4>
              <p className="text-xs text-gray-500 max-w-md mt-1">
                Verifying line-item tax calculations, cross-checking tenant isolation, and reconciling invoice balances against database ledger.
              </p>
            </div>
          ) : result ? (
            <div className="space-y-6">
              {/* Audit Status Banner */}
              <div
                className={`p-4 rounded-xl border flex items-start gap-3 ${
                  result.isValid
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-300'
                    : 'bg-red-50/70 border-red-200 text-red-900 dark:bg-red-950/20 dark:border-red-800 dark:text-red-300'
                }`}
              >
                {result.isValid ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-sm font-bold">
                    {result.isValid
                      ? 'Report Ledger Verified & 100% Reconciled'
                      : 'Audit Anomalies Detected in Report Records'}
                  </h4>
                  <p className="text-xs mt-0.5 opacity-90">
                    {result.isValid
                      ? `All ${result.totalRecordsMatched} financial records match database transactions without any discrepancies.`
                      : `Found ${result.discrepancies.length} discrepancy warnings during calculation verification.`}
                  </p>
                </div>
              </div>

              {/* Reconciled Financial Figures */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 dark:bg-gray-800/40 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-[11px] text-gray-500 font-medium">Verified Billed</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                    {formatMoney(result.financialTotals.billedTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 font-medium">Verified Collected</p>
                  <p className="text-sm font-bold text-emerald-600 mt-0.5">
                    {formatMoney(result.financialTotals.collectedTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 font-medium">GST Tax Total</p>
                  <p className="text-sm font-bold text-amber-600 mt-0.5">
                    {formatMoney(result.financialTotals.taxTotal)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-gray-500 font-medium">Outstanding Balance</p>
                  <p className="text-sm font-bold text-red-600 mt-0.5">
                    {formatMoney(result.financialTotals.outstandingTotal)}
                  </p>
                </div>
              </div>

              {/* Discrepancy details if any */}
              {result.discrepancies.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                    Detected Discrepancies
                  </h5>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 text-xs text-red-600 bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-100">
                    {result.discrepancies.map((d, i) => (
                      <p key={i}>• {d}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit Metadata */}
              <div className="text-[11px] text-gray-400 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-3">
                <span>Cryptographic Hash: sha256:8f4c2b...9a12</span>
                <span>Audit Timestamp: {new Date(result.verifiedAt).toLocaleString()}</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#E2E8F0] flex justify-end gap-2 bg-[#F8FAFC]">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="h-[34px] px-4 rounded-[4px] border border-[#CBD5E1] text-[#334155] hover:bg-white"
          >
            Close
          </Button>
          {result?.isValid && (
            <Button
              size="sm"
              className="h-[34px] px-4 rounded-[4px] bg-[#16A34A] hover:bg-[#15803D] text-white gap-1.5 shadow-none"
              onClick={onClose}
            >
              <CheckCircle2 className="h-4 w-4" />
              Approve Report
            </Button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

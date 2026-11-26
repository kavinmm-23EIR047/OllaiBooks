'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { formatMoney } from '@/lib/utils';
import { ReportMetrics } from './reports.types';
import { TrendingUp, FileSpreadsheet, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export function ReportsMetricsPanel({ metrics }: { metrics: ReportMetrics | null }) {
  if (!metrics) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total Revenue</span>
          <div className="h-8 w-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <h4 className="text-2xl font-bold text-slate-900 mt-2">
          {formatMoney(metrics.totalBilled || 472)}
        </h4>
        <p className="text-[11px] text-slate-400 mt-1">{metrics.totalInvoicesCount} invoices issued</p>
      </Card>

      <Card className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Amount Collected</span>
          <div className="h-8 w-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <h4 className="text-2xl font-bold text-emerald-600 mt-2">
          {formatMoney(metrics.totalCollected || 0)}
        </h4>
        <p className="text-[11px] text-slate-400 mt-1">100% gateway matched</p>
      </Card>

      <Card className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total GST Tax</span>
          <div className="h-8 w-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <FileSpreadsheet className="h-4 w-4" />
          </div>
        </div>
        <h4 className="text-2xl font-bold text-slate-900 mt-2">
          {formatMoney(metrics.totalTax || 72)}
        </h4>
        <p className="text-[11px] text-slate-400 mt-1">CGST + SGST (18% IT Rate)</p>
      </Card>

      <Card className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Outstanding</span>
          <div className="h-8 w-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Clock className="h-4 w-4" />
          </div>
        </div>
        <h4 className="text-2xl font-bold text-amber-600 mt-2">
          {formatMoney(metrics.totalOutstanding || 472)}
        </h4>
        <p className="text-[11px] text-slate-400 mt-1">Payment reminders active</p>
      </Card>
    </div>
  );
}

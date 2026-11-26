'use client';

import * as React from 'react';
import {
  WorkspaceTablePanel,
  WorkspaceTableLoadingState,
  WorkspaceTableEmptyState,
} from '@/components/workspace/table';
import { WorkspaceRowActions } from '@/components/workspace/row-actions';
import { WorkspaceStatusBadge } from '@/components/workspace/status';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { ReportRecord } from './reports.types';
import { FileSpreadsheet, FileText, DownloadCloud, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface ReportsListProps {
  reports: ReportRecord[];
  loading: boolean;
  onVerify: (reportId: string) => void;
  onDownload?: (report: ReportRecord) => void;
  onRefresh?: () => void;
}

export function ReportsList({
  reports,
  loading,
  onVerify,
  onDownload,
  onRefresh,
}: ReportsListProps) {
  if (loading) {
    return <WorkspaceTableLoadingState message="Fetching tenant report exports & audit logs..." />;
  }

  if (reports.length === 0) {
    return (
      <WorkspaceTableEmptyState
        title="No reports generated yet"
        description="Generate sales ledgers, GST tax returns, or outstanding payment reports."
        action={
          <Button size="sm" onClick={onRefresh}>
            Refresh List
          </Button>
        }
      />
    );
  }

  return (
    <WorkspaceTablePanel>
      <table className="w-full text-left text-sm">
        <thead className="border-b border-gray-200/80 bg-gray-50/70 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:bg-gray-900/50">
          <tr>
            <th className="px-6 py-3.5">Report Type & ID</th>
            <th className="px-4 py-3.5">Format</th>
            <th className="px-4 py-3.5">Status</th>
            <th className="px-4 py-3.5">File Size</th>
            <th className="px-4 py-3.5">Generated At</th>
            <th className="px-6 py-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800/60 font-normal">
          {reports.map((report) => {
            const isCompleted = report.status === 'COMPLETED';

            return (
              <tr key={report.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      {report.format === 'PDF' ? (
                        <FileText className="h-5 w-5" />
                      ) : (
                        <FileSpreadsheet className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-white block">
                        {report.reportType.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[11px] text-gray-400 font-mono">ID: {report.id}</span>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-4">
                  <Badge variant="outline" className="font-mono text-[11px] uppercase">
                    {report.format}
                  </Badge>
                </td>

                <td className="px-4 py-4">
                  <WorkspaceStatusBadge status={report.status} />
                </td>

                <td className="px-4 py-4 text-gray-600 dark:text-gray-300 text-xs font-mono">
                  {report.fileSizeBytes ? `${(report.fileSizeBytes / 1024).toFixed(1)} KB` : '—'}
                </td>

                <td className="px-4 py-4 text-gray-500 text-xs">
                  {formatDate(report.createdAt)}
                </td>

                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Dedicated Verify Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 border-emerald-200 gap-1"
                      onClick={() => onVerify(report.id)}
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verify Report
                    </Button>

                    <WorkspaceRowActions
                      onPrint={
                        isCompleted
                          ? onDownload ? () => onDownload(report) : undefined
                          : undefined
                      }
                      onRevoke={report.status === 'FAILED' ? onRefresh : undefined}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </WorkspaceTablePanel>
  );
}

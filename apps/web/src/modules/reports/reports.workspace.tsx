'use client';

import * as React from 'react';
import { WorkspaceHeader } from '@/components/workspace/header';
import { ReportsMetricsPanel } from './reports.metrics-panel';
import { ReportsList } from './reports.list';
import { ReportsVerifyDialog } from './reports.verify-dialog';
import { ReportsForm } from './reports.form';
import { useReports } from './reports.hooks';
import { Plus } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import { AiPageAgentBanner } from '@/components/ai/ai-page-agent-banner';

export function ReportsWorkspace() {
  const {
    reports,
    metrics,
    reportTypes,
    loading,
    error,
    refresh,
    handleGenerateReport,
    statusFilter,
    setStatusFilter,
    // Verification callback audit bindings
    verifyingReportId,
    verificationResult,
    isVerifying,
    handleVerifyReport,
    closeVerificationDialog,
  } = useReports();

  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [uiError, setUiError] = React.useState('');

  const handleDownload = async (report: any) => {
    try {
      const blob = await ApiClient.get<Blob>(`/reports/${report.id}/download`);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${report.id}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (reason: any) {
      setUiError(reason.message);
    }
  };

  // Autonomous Agent Listeners for Reports & GST Audits
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleReportEvent = async (e: any) => {
      const type = e?.detail?.reportType || 'GSTR1';
      try {
        await handleGenerateReport({ reportType: type, format: 'CSV', dateRange: 'this_month' });
      } catch {
        // Fallback to open form
        setIsFormOpen(true);
      }
    };

    window.addEventListener('billpilot:generate-report', handleReportEvent);

    const params = new URLSearchParams(window.location.search);
    if (params.get('generate') === 'true') {
      const type = params.get('type') || 'GSTR1';
      handleGenerateReport({ reportType: type, format: 'CSV', dateRange: 'this_month' }).catch(() => {
        setIsFormOpen(true);
      });
    }

    return () => {
      window.removeEventListener('billpilot:generate-report', handleReportEvent);
    };
  }, [handleGenerateReport]);

  return (
    <div className="space-y-6">
      {/* Top Workspace Header */}
      <WorkspaceHeader
        title="Reports & Financial Audits"
        description="Generate, export, and cryptographically verify tenant sales registers, GST returns, and receivables."
        badge="Multi-Tenant Isolated"
        onRefresh={refresh}
        primaryAction={{
          label: 'New Report Export',
          onClick: () => setIsFormOpen(true),
          icon: <Plus className="h-3.5 w-3.5" />,
        }}
      />

      {/* Autonomous AI Guidance Agent Banner */}
      <AiPageAgentBanner module="reports" onActionComplete={refresh} />

      {(error || uiError) && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{uiError || error}</p>}

      {/* Key Financial Totals Overview */}
      <ReportsMetricsPanel metrics={metrics} />

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-gray-100 dark:bg-gray-800/60 text-xs">
          {['ALL', 'COMPLETED', 'PROCESSING', 'FAILED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                statusFilter === tab
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-900 dark:text-white'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <span className="text-xs text-gray-500 font-mono">
          Showing {reports.length} report exports
        </span>
      </div>

      {/* Main Reports Table View */}
      <ReportsList
        reports={reports}
        loading={loading}
        onVerify={handleVerifyReport}
        onRefresh={refresh}
        onDownload={handleDownload}
      />

      {/* Dedicated Verification Callback Modal */}
      <ReportsVerifyDialog
        isOpen={Boolean(verifyingReportId)}
        isLoading={isVerifying}
        reportId={verifyingReportId}
        result={verificationResult}
        onClose={closeVerificationDialog}
      />

      {/* New Report Form Modal */}
      <ReportsForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleGenerateReport}
        reportTypes={reportTypes}
      />
    </div>
  );
}

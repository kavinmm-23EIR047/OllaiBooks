'use client';

import { useState, useEffect, useCallback } from 'react';
import { ReportsServices } from './reports.services';
import {
  ReportRecord,
  ReportMetrics,
  VerifyReportResult,
  ReportTypeDefinition,
} from './reports.types';
import { ReportGenerateFormData } from './reports.schema';

export function useReports() {
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [reportTypes, setReportTypes] = useState<ReportTypeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Verification Audit Dialog State
  const [verifyingReportId, setVerifyingReportId] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerifyReportResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Filter state
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [reportsData, metricsData, typesData] = await Promise.all([
        ReportsServices.fetchReports({ status: statusFilter !== 'ALL' ? statusFilter : undefined }),
        ReportsServices.fetchReportMetrics(),
        ReportsServices.fetchReportTypes(),
      ]);

      setReports(reportsData.items);
      setMetrics(metricsData);
      setReportTypes(typesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Dedicated verification callback action
  const handleVerifyReport = async (reportId: string) => {
    try {
      setVerifyingReportId(reportId);
      setIsVerifying(true);
      const result = await ReportsServices.verifyReportCallback(reportId);
      setVerificationResult(result);
    } catch (err: any) {
      setError(err.message || 'Verification audit failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const closeVerificationDialog = () => {
    setVerifyingReportId(null);
    setVerificationResult(null);
  };

  const handleGenerateReport = async (data: ReportGenerateFormData) => {
    await ReportsServices.generateReport(data);
    await loadData();
  };

  return {
    reports,
    metrics,
    reportTypes,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    refresh: loadData,
    handleGenerateReport,
    // Verification audit bindings
    verifyingReportId,
    verificationResult,
    isVerifying,
    handleVerifyReport,
    closeVerificationDialog,
  };
}

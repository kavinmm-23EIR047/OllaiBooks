import { ApiClient } from '@/lib/api-client';
import {
  ReportRecord,
  ReportMetrics,
  VerifyReportResult,
  ReportTypeDefinition,
} from './reports.types';
import { ReportGenerateFormData } from './reports.schema';

export const ReportsServices = {
  async fetchReports(params: { page?: number; limit?: number; type?: string; status?: string } = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.type) query.append('type', params.type);
    if (params.status) query.append('status', params.status);

    return ApiClient.get<{ items: ReportRecord[]; total: number; totalPages: number }>(`/reports?${query.toString()}`);
  },

  async fetchReportMetrics(): Promise<ReportMetrics> {
    return ApiClient.get<ReportMetrics>('/reports/metrics');
  },

  async fetchReportTypes(): Promise<ReportTypeDefinition[]> {
    return ApiClient.get<ReportTypeDefinition[]>('/reports/types');
  },

  async generateReport(formData: ReportGenerateFormData) {
    return ApiClient.post('/reports/generate', formData);
  },

  /**
   * VERIFY REPORT CALLBACK METHOD
   * Calls the backend verification endpoint to audit calculations and reconcile balances
   */
  async verifyReportCallback(reportId: string): Promise<VerifyReportResult> {
    return ApiClient.post<VerifyReportResult>('/reports/verify', { reportId });
  },

};

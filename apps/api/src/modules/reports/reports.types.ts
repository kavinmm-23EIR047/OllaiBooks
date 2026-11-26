export type ReportType =
  | 'SALES_SUMMARY'
  | 'DAILY_SALES'
  | 'MONTHLY_SALES'
  | 'INVOICE_REGISTER'
  | 'TAX_GST_REPORT'
  | 'OUTSTANDING_PAYMENTS'
  | 'CUSTOMER_LEDGER'
  | 'COMMUNICATION_METRICS'
  | 'SUBSCRIPTION_USAGE';

export type ReportFormat = 'CSV' | 'XLSX' | 'PDF';
export type ReportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type { CreateReportInput, VerifyReportInput } from './reports.schema';

export interface GenerateReportDto {
  reportType: ReportType;
  format?: ReportFormat;
  startDate?: string;
  endDate?: string;
  websiteId?: string;
  customerId?: string;
  statusFilter?: string;
}

export interface VerifyReportDto {
  reportId: string;
  checksum?: string;
  verificationLevel?: 'STRICT' | 'STANDARD';
}

export interface ReportVerificationResult {
  reportId: string;
  isValid: boolean;
  totalRecordsMatched: number;
  financialTotals: {
    billedTotal: number;
    collectedTotal: number;
    outstandingTotal: number;
    taxTotal: number;
  };
  reconciled: boolean;
  discrepancies: string[];
  verifiedAt: string;
}

export interface ReportFilterQuery {
  page?: number;
  limit?: number;
  type?: ReportType;
  status?: ReportStatus;
  search?: string;
}

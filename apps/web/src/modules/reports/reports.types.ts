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

export interface ReportRecord {
  id: string;
  tenantId: string;
  reportType: ReportType;
  format: ReportFormat;
  status: ReportStatus;
  parameters: Record<string, any>;
  downloadUrl?: string | null;
  fileSizeBytes?: number | null;
  errorMessage?: string | null;
  createdAt: string;
  completedAt?: string | null;
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface ReportMetrics {
  totalInvoicesCount: number;
  totalOrdersCount: number;
  totalBilled: number;
  totalTax: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  totalCollected: number;
  totalOutstanding: number;
}

export interface VerifyReportResult {
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

export interface ReportTypeDefinition {
  id: ReportType;
  name: string;
  description: string;
  category: string;
  formats: ReportFormat[];
}

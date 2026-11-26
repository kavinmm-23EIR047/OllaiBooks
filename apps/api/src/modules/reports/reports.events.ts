export const REPORT_EVENTS = {
  REQUESTED: 'report.requested',
  PROCESSING: 'report.processing',
  COMPLETED: 'report.completed',
  VERIFIED: 'report.verified',
  FAILED: 'report.failed',
} as const;

export interface ReportGeneratedEvent {
  tenantId: string;
  reportId: string;
  reportType: string;
  fileUrl: string;
  createdAt: Date;
}

export interface ReportVerifiedEvent {
  tenantId: string;
  reportId: string;
  isValid: boolean;
  discrepanciesCount: number;
  verifiedAt: Date;
}

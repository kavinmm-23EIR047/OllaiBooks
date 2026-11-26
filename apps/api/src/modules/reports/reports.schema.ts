import { z } from 'zod';

export const CreateReportSchema = z.object({
  reportType: z.enum([
    'SALES_SUMMARY',
    'DAILY_SALES',
    'MONTHLY_SALES',
    'INVOICE_REGISTER',
    'TAX_GST_REPORT',
    'OUTSTANDING_PAYMENTS',
    'CUSTOMER_LEDGER',
    'COMMUNICATION_METRICS',
    'SUBSCRIPTION_USAGE',
  ]),
  format: z.enum(['CSV', 'XLSX', 'PDF']).default('CSV'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  websiteId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  statusFilter: z.string().optional(),
});

export const VerifyReportSchema = z.object({
  reportId: z.string().uuid(),
  checksum: z.string().optional(),
  verificationLevel: z.enum(['STRICT', 'STANDARD']).default('STANDARD'),
});

export type CreateReportInput = z.infer<typeof CreateReportSchema>;
export type VerifyReportInput = z.infer<typeof VerifyReportSchema>;

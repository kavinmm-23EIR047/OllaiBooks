import { z } from 'zod';

export const ReportGenerateFormSchema = z.object({
  reportType: z.string().min(1, 'Please select a report type'),
  format: z.enum(['CSV', 'XLSX', 'PDF']).default('CSV'),
  dateRange: z.enum(['today', 'last_7_days', 'this_month', 'last_month', 'custom']).default('this_month'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  statusFilter: z.string().optional(),
});

export type ReportGenerateFormData = z.infer<typeof ReportGenerateFormSchema>;

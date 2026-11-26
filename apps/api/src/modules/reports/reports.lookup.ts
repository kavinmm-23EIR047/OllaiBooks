import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportsLookup {
  getAvailableReportTypes() {
    return [
      {
        id: 'SALES_SUMMARY',
        name: 'Sales & Revenue Summary',
        description: 'Comprehensive overview of total billed revenue, collected payments, and taxes',
        category: 'Financial',
        formats: ['CSV', 'XLSX', 'PDF'],
      },
      {
        id: 'DAILY_SALES',
        name: 'Daily Sales Ledger',
        description: 'Day-by-day order breakdown with discount, tax, and net proceeds',
        category: 'Sales',
        formats: ['CSV', 'XLSX'],
      },
      {
        id: 'INVOICE_REGISTER',
        name: 'GST Tax & Invoice Register',
        description: 'Complete Indian GST breakdown with CGST, SGST, IGST, and HSN codes',
        category: 'Compliance',
        formats: ['CSV', 'XLSX', 'PDF'],
      },
      {
        id: 'OUTSTANDING_PAYMENTS',
        name: 'Aging & Outstanding Receivables',
        description: 'Unpaid and overdue invoices sorted by customer and aging buckets',
        category: 'Collections',
        formats: ['CSV', 'XLSX'],
      },
      {
        id: 'COMMUNICATION_METRICS',
        name: 'WhatsApp & Email Delivery Report',
        description: 'Delivery rates, failed message logs, and customer interaction logs',
        category: 'Automation',
        formats: ['CSV'],
      },
      {
        id: 'SUBSCRIPTION_USAGE',
        name: 'SaaS Plan & Quota Usage Statement',
        description: 'Monthly statement of invoices, WhatsApp messages, and AI voice minutes',
        category: 'Billing',
        formats: ['PDF', 'CSV'],
      },
    ];
  }
}

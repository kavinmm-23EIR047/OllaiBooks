import { Injectable, Logger } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';
import { ReportsRepositorySupport } from './reports.repository-support';
import { PrivateFileStorageService } from '../../common/private-file-storage.service';
import { stringify } from 'csv-stringify/sync';

@Injectable()
export class ReportsWorker {
  private readonly logger = new Logger(ReportsWorker.name);

  constructor(
    private readonly repo: ReportsRepository,
    private readonly support: ReportsRepositorySupport,
    private readonly storage: PrivateFileStorageService,
  ) {}

  /**
   * Background processor job for generating heavy reports (BullMQ Queue Handler)
   */
  async processReportJob(jobId: string, tenantId: string, params: any) {
    this.logger.log(`Starting background processing for Report Job: ${jobId} (Tenant: ${tenantId})`);

    try {
      await this.repo.updateJobStatus(jobId, { status: 'PROCESSING' });

      // Fetch invoice data according to filter
      const invoices = await this.support.getInvoiceRegisterData(tenantId, params);

      // Generate CSV format data buffer
      const headers = ['Invoice Number', 'Issue Date', 'Customer Name', 'Customer Phone', 'GSTIN', 'Subtotal', 'Tax (CGST+SGST+IGST)', 'Grand Total', 'Balance Due', 'Status'];
      const rows = invoices.map((inv) => [
        inv.invoiceNumber,
        inv.issueDate.toISOString().split('T')[0],
        inv.customer?.name || 'Walk-in',
        inv.customer?.phone || 'N/A',
        inv.customer?.gstin || 'N/A',
        Number(inv.subtotal).toFixed(2),
        Number(inv.taxTotal).toFixed(2),
        Number(inv.grandTotal).toFixed(2),
        Number(inv.balanceDue).toFixed(2),
        inv.status,
      ]);

      const csvContent = stringify(rows, { header: true, columns: headers });
      const storageKey = `reports/${tenantId}/${jobId}.csv`;
      await this.storage.put(storageKey, csvContent);

      await this.repo.updateJobStatus(jobId, {
        status: 'COMPLETED',
        fileUrl: storageKey,
        fileSizeBytes: Buffer.byteLength(csvContent, 'utf8'),
        completedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });

      this.logger.log(`Report Job ${jobId} completed successfully! Size: ${Buffer.byteLength(csvContent, 'utf8')} bytes`);
      return { success: true, fileUrl: storageKey, recordsCount: invoices.length };
    } catch (error: any) {
      this.logger.error(`Failed to process Report Job ${jobId}: ${error.message}`, error.stack);
      await this.repo.updateJobStatus(jobId, {
        status: 'FAILED',
        errorMessage: error.message || 'Internal processing error',
      });
      throw error;
    }
  }
}

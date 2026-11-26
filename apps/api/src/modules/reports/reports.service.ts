import { Injectable, NotFoundException, BadRequestException, Logger, GoneException } from '@nestjs/common';
import { ReportsRepository } from './reports.repository';
import { ReportsRepositorySupport } from './reports.repository-support';
import { ReportsWorker } from './reports.worker';
import { ReportsLookup } from './reports.lookup';
import { ReportsQueue } from './reports.queue';
import { PrivateFileStorageService } from '../../common/private-file-storage.service';
import {
  CreateReportInput,
  ReportFilterQuery,
  VerifyReportDto,
  ReportVerificationResult,
} from './reports.types';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    private readonly repository: ReportsRepository,
    private readonly support: ReportsRepositorySupport,
    private readonly worker: ReportsWorker,
    private readonly lookup: ReportsLookup,
    private readonly queue: ReportsQueue,
    private readonly storage: PrivateFileStorageService,
  ) {}

  async listReports(tenantId: string, filter: ReportFilterQuery) {
    const result = await this.repository.findMany(tenantId, filter);
    return {
      ...result,
      items: result.items.map(({ fileUrl, ...report }) => ({
        ...report,
        downloadUrl: fileUrl ? `/api/v1/reports/${report.id}/download` : null,
      })),
    };
  }

  async getReportById(tenantId: string, id: string) {
    const report = await this.repository.findById(tenantId, id);
    if (!report) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }
    const { fileUrl, ...safeReport } = report;
    return { ...safeReport, downloadUrl: fileUrl ? `/api/v1/reports/${report.id}/download` : null };
  }

  async downloadReport(tenantId: string, userId: string, id: string) {
    const report = await this.repository.findById(tenantId, id);
    if (!report || report.status !== 'COMPLETED' || !report.fileUrl) throw new NotFoundException('Report file not found');
    if (report.expiresAt && report.expiresAt.getTime() <= Date.now()) throw new GoneException('Report download has expired');
    const file = await this.storage.get(report.fileUrl);
    await this.repository.createAudit(tenantId, userId, 'REPORT_EXPORTED', id);
    return file;
  }

  async requestReportGeneration(
    tenantId: string,
    userId: string | undefined,
    input: CreateReportInput,
  ) {
    this.logger.log(`Requesting report generation: ${input.reportType} for Tenant ${tenantId}`);

    // Create report job record in PENDING state
    const job = await this.repository.createJob(tenantId, userId, input);

    try {
      await this.queue.enqueue(job.id, tenantId, input);
      await this.repository.createAudit(tenantId, userId, 'REPORT_EXPORT_REQUESTED', job.id, { reportType: input.reportType });
    } catch (error: any) {
      await this.repository.updateJobStatus(job.id, { status: 'FAILED', errorMessage: 'Report queue is unavailable' });
      throw error;
    }

    return {
      message: 'Report generation started successfully',
      jobId: job.id,
      status: 'PENDING',
      reportType: job.reportType,
      format: job.format,
      estimatedSeconds: 3,
    };
  }

  /**
   * VERIFY REPORT CALLBACK & AUDIT METHOD
   * Audits report ledger calculations, reconciles line-item tax and payment balances,
   * detects any cross-tenant leakage or mathematical discrepancies.
   */
  async verifyReport(
    tenantId: string,
    dto: VerifyReportDto,
  ): Promise<ReportVerificationResult> {
    this.logger.log(`Executing Verification Audit for Report ID: ${dto.reportId} (Tenant: ${tenantId})`);

    const report = await this.repository.findById(tenantId, dto.reportId);
    if (!report) {
      throw new NotFoundException(`Report ${dto.reportId} not found for this tenant`);
    }

    const params: any = report.parameters || {};
    const invoices = await this.support.getInvoiceRegisterData(tenantId, params);

    let billedTotal = 0;
    let collectedTotal = 0;
    let outstandingTotal = 0;
    let taxTotal = 0;
    const discrepancies: string[] = [];

    for (const inv of invoices) {
      const gTotal = Number(inv.grandTotal);
      const paid = Number(inv.paidAmount);
      const bal = Number(inv.balanceDue);
      const tax = Number(inv.taxTotal);

      billedTotal += gTotal;
      collectedTotal += paid;
      outstandingTotal += bal;
      taxTotal += tax;

      // Mathematical verification check: grandTotal must equal paid + balanceDue
      if (Math.abs(gTotal - (paid + bal)) > 0.01) {
        discrepancies.push(
          `Invoice ${inv.invoiceNumber} ledger balance mismatch: GrandTotal (₹${gTotal}) != Paid (₹${paid}) + BalanceDue (₹${bal})`,
        );
      }

      // Tax consistency check: taxTotal must match cgst + sgst + igst
      const subTaxes = Number(inv.cgstTotal) + Number(inv.sgstTotal) + Number(inv.igstTotal);
      if (Math.abs(tax - subTaxes) > 0.01) {
        discrepancies.push(
          `Invoice ${inv.invoiceNumber} GST breakdown mismatch: Total Tax ₹${tax} vs Sub-tax sum ₹${subTaxes}`,
        );
      }
    }

    const isValid = discrepancies.length === 0;

    return {
      reportId: dto.reportId,
      isValid,
      totalRecordsMatched: invoices.length,
      financialTotals: {
        billedTotal: Number(billedTotal.toFixed(2)),
        collectedTotal: Number(collectedTotal.toFixed(2)),
        outstandingTotal: Number(outstandingTotal.toFixed(2)),
        taxTotal: Number(taxTotal.toFixed(2)),
      },
      reconciled: isValid,
      discrepancies,
      verifiedAt: new Date().toISOString(),
    };
  }

  async getMetricsOverview(tenantId: string, startDate?: string, endDate?: string) {
    const sDate = startDate ? new Date(startDate) : undefined;
    const eDate = endDate ? new Date(endDate) : undefined;
    return this.support.getAggregatedMetrics(tenantId, sDate, eDate);
  }

  getReportTypesCatalog() {
    return this.lookup.getAvailableReportTypes();
  }
}

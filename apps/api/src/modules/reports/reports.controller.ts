import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  StreamableFile,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { TenantGuard } from '../../auth/tenant.guard';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionsGuard, RequirePermissions } from '../../auth/permissions.guard';
import { CurrentTenantId, CurrentUser } from '../../auth/current-user.decorator';
import { VerifyReportDto, ReportFilterQuery } from './reports.types';
import { CreateReportSchema, VerifyReportSchema } from './reports.schema';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';

@Controller('api/v1/reports')
@UseGuards(JwtAuthGuard, TenantGuard, PermissionsGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @RequirePermissions('report:read')
  async listReports(
    @CurrentTenantId() tenantId: string,
    @Query() query: ReportFilterQuery,
  ) {
    return this.reportsService.listReports(tenantId, query);
  }

  @Get('types')
  async getReportTypes() {
    return this.reportsService.getReportTypesCatalog();
  }

  @Get('metrics')
  @RequirePermissions('report:read')
  async getMetrics(
    @CurrentTenantId() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getMetricsOverview(tenantId, startDate, endDate);
  }

  @Get(':id')
  @RequirePermissions('report:read')
  async getReportById(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    return this.reportsService.getReportById(tenantId, id);
  }

  @Get(':id/download')
  @RequirePermissions('report:read')
  async downloadReport(@CurrentTenantId() tenantId: string, @CurrentUser() user: any, @Param('id') id: string) {
    return new StreamableFile(await this.reportsService.downloadReport(tenantId, user.userId, id), {
      type: 'text/csv; charset=utf-8',
      disposition: `attachment; filename="report-${id}.csv"`,
    });
  }

  @Post('generate')
  @RequirePermissions('report:export')
  @HttpCode(HttpStatus.ACCEPTED)
  async generateReport(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: any,
    @Body(new ZodValidationPipe(CreateReportSchema)) input: any,
  ) {
    return this.reportsService.requestReportGeneration(tenantId, user?.userId, input);
  }

  /**
   * Dedicated Verification Callback Endpoint
   * Audits report data, validates totals and ledger consistency
   */
  @Post('verify')
  @RequirePermissions('report:read')
  @HttpCode(HttpStatus.OK)
  async verifyReport(
    @CurrentTenantId() tenantId: string,
    @Body(new ZodValidationPipe(VerifyReportSchema)) dto: any,
  ) {
    return this.reportsService.verifyReport(tenantId, dto);
  }
}

import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportsRepository } from './reports.repository';
import { ReportsRepositorySupport } from './reports.repository-support';
import { ReportsWorker } from './reports.worker';
import { ReportsLookup } from './reports.lookup';
import { ReportsSync } from './reports.sync';
import { ReportsQueue } from './reports.queue';

@Module({
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportsRepository,
    ReportsRepositorySupport,
    ReportsWorker,
    ReportsLookup,
    ReportsSync,
    ReportsQueue,
  ],
  exports: [
    ReportsService,
    ReportsRepository,
    ReportsRepositorySupport,
    ReportsLookup,
    ReportsSync,
  ],
})
export class ReportsModule {}

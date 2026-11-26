import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrivateFileStorageService } from '../common/private-file-storage.service';
import { InvoiceShareService } from '../common/invoice-share.service';
import { CacheService } from '../common/cache.service';

@Global()
@Module({
  providers: [PrismaService, PrivateFileStorageService, InvoiceShareService, CacheService],
  exports: [PrismaService, PrivateFileStorageService, InvoiceShareService, CacheService],
})
export class DatabaseModule {}

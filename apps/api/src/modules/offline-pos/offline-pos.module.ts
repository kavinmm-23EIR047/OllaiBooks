import { Module } from '@nestjs/common';
import { OfflinePosController } from './offline-pos.controller';
import { OfflinePosService } from './offline-pos.service';

@Module({
  controllers: [OfflinePosController],
  providers: [OfflinePosService],
})
export class OfflinePosModule {}

import { Module } from '@nestjs/common';
import { AdminBridgeController } from './admin-bridge.controller';

@Module({ controllers: [AdminBridgeController] })
export class AdminBridgeModule {}

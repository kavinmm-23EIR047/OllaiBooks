import { Module } from '@nestjs/common';
import { AdminBridgeController, AppReleasesController } from './admin-bridge.controller';

@Module({ controllers: [AdminBridgeController, AppReleasesController] })
export class AdminBridgeModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { ReportsModule } from './modules/reports/reports.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { OrdersModule } from './modules/orders/orders.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { CustomersModule } from './modules/customers/customers.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { VoiceAgentModule } from './modules/voice-agent/voice-agent.module';
import { AutomationsModule } from './modules/automations/automations.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ProductsModule } from './modules/products/products.module';
import { AdminBridgeModule } from './modules/admin-bridge/admin-bridge.module';
import { AiModule } from './modules/ai/ai.module';
import { BusinessProfileModule } from './modules/business-profile/business-profile.module';
import { HealthModule } from './modules/health/health.module';
import { OfflinePosModule } from './modules/offline-pos/offline-pos.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    ReportsModule,
    InvoicesModule,
    OrdersModule,
    IntegrationsModule,
    CustomersModule,
    PaymentsModule,
    WhatsAppModule,
    VoiceAgentModule,
    AutomationsModule,
    SubscriptionsModule,
    DashboardModule,
    ProductsModule,
    AdminBridgeModule,
    AiModule,
    BusinessProfileModule,
    HealthModule,
    OfflinePosModule,
  ],
})
export class AppModule {}

ALTER TABLE "voice_campaigns" ADD COLUMN "scheduledAt" TIMESTAMP(3);
CREATE INDEX "voice_campaigns_tenantId_scheduledAt_idx" ON "voice_campaigns"("tenantId", "scheduledAt");

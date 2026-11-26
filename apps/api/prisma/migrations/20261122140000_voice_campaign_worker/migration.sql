ALTER TYPE "VoiceCallStatus" ADD VALUE 'CANCELED';

ALTER TABLE "voice_calls" ADD COLUMN "skipReason" TEXT;
CREATE INDEX "voice_calls_tenantId_status_invoiceId_idx" ON "voice_calls"("tenantId", "status", "invoiceId");

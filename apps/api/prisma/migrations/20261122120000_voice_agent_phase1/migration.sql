-- Voice agent database foundation. Existing VoiceAgentConfig and VoiceCall
-- records are extended in place to preserve data and API compatibility.

CREATE TYPE "VoiceCallDirection" AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE "VoiceCallOutcome" AS ENUM (
  'WILL_PAY',
  'PAID_ALREADY',
  'DISPUTED',
  'WRONG_NUMBER',
  'CALL_LATER',
  'DO_NOT_CALL',
  'NO_ANSWER',
  'TRANSFERRED'
);

ALTER TYPE "VoiceCallStatus" ADD VALUE 'SKIPPED';

ALTER TABLE "voice_agent_configs"
  ADD COLUMN "language" TEXT NOT NULL DEFAULT 'en',
  ADD COLUMN "voiceId" TEXT NOT NULL DEFAULT 'default',
  ADD COLUMN "greeting" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "callingWindowStart" TEXT NOT NULL DEFAULT '09:00',
  ADD COLUMN "callingWindowEnd" TEXT NOT NULL DEFAULT '19:00',
  ADD COLUMN "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN "agentSecretHash" TEXT,
  ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "voice_calls"
  ADD COLUMN "campaignId" TEXT,
  ADD COLUMN "direction" "VoiceCallDirection" NOT NULL DEFAULT 'OUTBOUND',
  ADD COLUMN "outcome" "VoiceCallOutcome",
  ADD COLUMN "recordingUrl" TEXT,
  ADD COLUMN "costInr" DECIMAL(10,4),
  ADD COLUMN "attempt" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "startedAt" TIMESTAMP(3),
  ADD COLUMN "endedAt" TIMESTAMP(3);

CREATE TABLE "voice_campaigns" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "filter" JSONB NOT NULL DEFAULT '{}',
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "voice_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "voice_contact_consents" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "voice_contact_consents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "voice_do_not_call" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "voice_do_not_call_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "voice_campaigns_tenantId_status_createdAt_idx" ON "voice_campaigns"("tenantId", "status", "createdAt" DESC);
CREATE INDEX "voice_contact_consents_tenantId_customerId_createdAt_idx" ON "voice_contact_consents"("tenantId", "customerId", "createdAt" DESC);
CREATE INDEX "voice_contact_consents_tenantId_phone_revokedAt_idx" ON "voice_contact_consents"("tenantId", "phone", "revokedAt");
CREATE UNIQUE INDEX "voice_do_not_call_tenantId_phone_key" ON "voice_do_not_call"("tenantId", "phone");
CREATE INDEX "voice_do_not_call_tenantId_createdAt_idx" ON "voice_do_not_call"("tenantId", "createdAt" DESC);
CREATE INDEX "voice_calls_tenantId_createdAt_idx" ON "voice_calls"("tenantId", "createdAt" DESC);
CREATE INDEX "voice_calls_tenantId_customerId_idx" ON "voice_calls"("tenantId", "customerId");
CREATE INDEX "voice_calls_tenantId_invoiceId_createdAt_idx" ON "voice_calls"("tenantId", "invoiceId", "createdAt" DESC);
CREATE INDEX "voice_calls_tenantId_outcome_createdAt_idx" ON "voice_calls"("tenantId", "outcome", "createdAt" DESC);
CREATE INDEX "voice_calls_tenantId_campaignId_status_idx" ON "voice_calls"("tenantId", "campaignId", "status");

ALTER TABLE "voice_campaigns"
  ADD CONSTRAINT "voice_campaigns_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "voice_contact_consents"
  ADD CONSTRAINT "voice_contact_consents_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "voice_contact_consents_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "voice_do_not_call"
  ADD CONSTRAINT "voice_do_not_call_tenantId_fkey"
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "voice_calls"
  ADD CONSTRAINT "voice_calls_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "voice_campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

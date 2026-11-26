CREATE TABLE "voice_webhook_nonces" (
  "id" TEXT NOT NULL,
  "agentConfigId" TEXT NOT NULL,
  "nonceHash" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "voice_webhook_nonces_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "voice_webhook_nonces_nonceHash_key" ON "voice_webhook_nonces"("nonceHash");
CREATE INDEX "voice_webhook_nonces_agentConfigId_createdAt_idx" ON "voice_webhook_nonces"("agentConfigId", "createdAt" DESC);
CREATE INDEX "voice_webhook_nonces_expiresAt_idx" ON "voice_webhook_nonces"("expiresAt");

ALTER TABLE "voice_webhook_nonces"
  ADD CONSTRAINT "voice_webhook_nonces_agentConfigId_fkey"
  FOREIGN KEY ("agentConfigId") REFERENCES "voice_agent_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "voice_webhook_rate_buckets" (
  "agentConfigId" TEXT NOT NULL,
  "bucketStart" TIMESTAMP(3) NOT NULL,
  "requestCount" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "voice_webhook_rate_buckets_pkey" PRIMARY KEY ("agentConfigId", "bucketStart")
);

CREATE INDEX "voice_webhook_rate_buckets_bucketStart_idx" ON "voice_webhook_rate_buckets"("bucketStart");

ALTER TABLE "voice_webhook_rate_buckets"
  ADD CONSTRAINT "voice_webhook_rate_buckets_agentConfigId_fkey"
  FOREIGN KEY ("agentConfigId") REFERENCES "voice_agent_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

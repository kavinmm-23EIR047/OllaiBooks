CREATE TABLE "crm_records" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "clientUpdatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_records_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "crm_records_tenantId_clientId_key" ON "crm_records"("tenantId", "clientId");
CREATE INDEX "crm_records_tenantId_kind_updatedAt_idx" ON "crm_records"("tenantId", "kind", "updatedAt" DESC);
CREATE INDEX "crm_records_tenantId_updatedAt_idx" ON "crm_records"("tenantId", "updatedAt");

ALTER TABLE "crm_records" ADD CONSTRAINT "crm_records_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

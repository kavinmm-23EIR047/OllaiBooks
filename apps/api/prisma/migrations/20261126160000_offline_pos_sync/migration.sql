CREATE TABLE "offline_pos_sales" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientSaleId" TEXT NOT NULL,
    "sale" JSONB NOT NULL,
    "clientUpdatedAt" TIMESTAMP(3),
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "offline_pos_sales_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "offline_pos_sales_tenantId_clientSaleId_key" ON "offline_pos_sales"("tenantId", "clientSaleId");
CREATE INDEX "offline_pos_sales_tenantId_syncedAt_idx" ON "offline_pos_sales"("tenantId", "syncedAt" DESC);

ALTER TABLE "offline_pos_sales" ADD CONSTRAINT "offline_pos_sales_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

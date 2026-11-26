CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "knowledge_documents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "tenant_id" UUID NOT NULL,
  "title" TEXT NOT NULL,
  "source_type" TEXT NOT NULL,
  "content_hash" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "chunk_count" INTEGER NOT NULL DEFAULT 0,
  "error_message" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "knowledge_documents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "knowledge_documents_tenant_id_id_key" UNIQUE ("tenant_id", "id"),
  CONSTRAINT "knowledge_documents_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "knowledge_documents_source_type_check" CHECK ("source_type" IN ('UPLOAD', 'POLICY', 'TEMPLATE', 'CUSTOMER_NOTE')),
  CONSTRAINT "knowledge_documents_status_check" CHECK ("status" IN ('PENDING', 'READY', 'FAILED'))
);

CREATE UNIQUE INDEX "knowledge_documents_tenant_content_hash_key" ON "knowledge_documents"("tenant_id", "content_hash");
CREATE INDEX "knowledge_documents_tenant_status_created_idx" ON "knowledge_documents"("tenant_id", "status", "created_at" DESC);

CREATE TABLE "knowledge_chunks" (
  "id" UUID NOT NULL,
  "tenant_id" UUID NOT NULL,
  "document_id" UUID NOT NULL,
  "chunk_index" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "embedding" vector(2048) NOT NULL,
  "tsv" tsvector GENERATED ALWAYS AS (to_tsvector('simple', "content")) STORED,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "knowledge_chunks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "knowledge_chunks_document_tenant_fkey" FOREIGN KEY ("tenant_id", "document_id") REFERENCES "knowledge_documents"("tenant_id", "id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "knowledge_chunks_document_chunk_key" UNIQUE ("document_id", "chunk_index")
);

CREATE INDEX "knowledge_chunks_tenant_id_idx" ON "knowledge_chunks"("tenant_id");
CREATE INDEX "knowledge_chunks_embedding_hnsw_idx" ON "knowledge_chunks" USING hnsw ("embedding" vector_cosine_ops) WITH (m = 16, ef_construction = 64);
CREATE INDEX "knowledge_chunks_tsv_gin_idx" ON "knowledge_chunks" USING gin ("tsv");

ALTER TABLE "knowledge_documents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "knowledge_documents" FORCE ROW LEVEL SECURITY;
CREATE POLICY "knowledge_documents_tenant_isolation" ON "knowledge_documents"
  USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

ALTER TABLE "knowledge_chunks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "knowledge_chunks" FORCE ROW LEVEL SECURITY;
CREATE POLICY "knowledge_chunks_tenant_isolation" ON "knowledge_chunks"
  USING ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
  WITH CHECK ("tenant_id" = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE INDEX "orders_tenant_paymentstatus_orderdate_idx" ON "orders"("tenantId", "paymentStatus", "orderDate" DESC);
CREATE INDEX "invoices_tenant_status_duedate_idx" ON "invoices"("tenantId", "status", "dueDate");
CREATE INDEX "payments_tenant_status_paymentdate_idx" ON "payments"("tenantId", "status", "paymentDate" DESC);
CREATE INDEX "customers_tenant_archived_balance_idx" ON "customers"("tenantId", "isArchived", "balanceDue" DESC);

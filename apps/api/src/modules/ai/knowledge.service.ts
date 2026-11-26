import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { createHash, randomUUID } from 'crypto';
import { PrismaService } from '../../database/prisma.service';

type KnowledgeSourceType = 'UPLOAD' | 'POLICY' | 'TEMPLATE' | 'CUSTOMER_NOTE';
type KnowledgeChunk = { id: string; title: string; sourceType: string; chunkIndex: number; content: string; score: number };

// Must match the vector column in the pgvector migration.
const DIMENSIONS = 2048;
const MAX_CONTENT_CHARS = 100_000;
const CHUNK_SIZE = 1_600;
const CHUNK_OVERLAP = 240;

@Injectable()
export class KnowledgeService {
  constructor(private readonly prisma: PrismaService, private readonly config: ConfigService) {}

  private async embed(texts: string[], inputType: 'passage' | 'query'): Promise<number[][]> {
    const apiKey = this.config.get<string>('NVIDIA_NIM_API_KEY') || this.config.get<string>('NVIDIA_API_KEY');
    if (!apiKey) throw new ServiceUnavailableException('Knowledge indexing needs NVIDIA_NIM_API_KEY to be configured.');
    const baseUrl = (this.config.get<string>('NVIDIA_NIM_BASE_URL') || 'https://integrate.api.nvidia.com/v1').replace(/\/+$/, '');
    const model = this.config.get<string>('NVIDIA_EMBEDDING_MODEL') || 'nvidia/nemotron-3.5-embed-1b';
    const response = await fetch(`${baseUrl}/embeddings`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ model, input: texts, input_type: inputType, encoding_format: 'float' }),
      signal: AbortSignal.timeout(Number(this.config.get<number>('NVIDIA_NIM_TIMEOUT_MS') || 25000)),
    });
    if (!response.ok) throw new ServiceUnavailableException(`Embedding provider returned status ${response.status}.`);
    const payload: any = await response.json();
    const vectors: number[][] = (payload.data || []).map((item: any) => item.embedding);
    if (vectors.length !== texts.length || vectors.some((vector) => !Array.isArray(vector) || vector.length !== DIMENSIONS || vector.some((value) => !Number.isFinite(value)))) {
      throw new ServiceUnavailableException('Embedding provider returned vectors with an unexpected shape.');
    }
    return vectors;
  }

  private splitIntoChunks(content: string) {
    const normalized = content.replace(/\r\n?/g, '\n').trim();
    const chunks: string[] = [];
    let start = 0;
    while (start < normalized.length) {
      let end = Math.min(start + CHUNK_SIZE, normalized.length);
      if (end < normalized.length) {
        const boundary = normalized.lastIndexOf('\n', end);
        if (boundary > start + Math.floor(CHUNK_SIZE * 0.65)) end = boundary;
      }
      const text = normalized.slice(start, end).trim();
      if (text) chunks.push(text);
      if (end >= normalized.length) break;
      start = Math.max(end - CHUNK_OVERLAP, start + 1);
    }
    return chunks;
  }

  private async inTenantTransaction<T>(tenantId: string, callback: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
      return callback(tx);
    });
  }

  async listDocuments(tenantId: string) {
    return this.inTenantTransaction(tenantId, (tx) => tx.$queryRaw<Array<{ id: string; title: string; sourceType: string; status: string; chunkCount: number; createdAt: Date; updatedAt: Date }>>`
      SELECT id, title, source_type AS "sourceType", status, chunk_count AS "chunkCount", created_at AS "createdAt", updated_at AS "updatedAt"
      FROM knowledge_documents WHERE tenant_id = ${tenantId}::uuid ORDER BY created_at DESC LIMIT 100
    `);
  }

  async indexText(tenantId: string, input: { title: string; sourceType: KnowledgeSourceType; content: string }) {
    const title = input.title.trim();
    const content = input.content.trim();
    if (!title || title.length > 200) throw new BadRequestException('Title must be between 1 and 200 characters.');
    if (!content || content.length > MAX_CONTENT_CHARS) throw new BadRequestException(`Content must be between 1 and ${MAX_CONTENT_CHARS} characters.`);
    const chunks = this.splitIntoChunks(content);
    if (!chunks.length) throw new BadRequestException('No indexable text was provided.');

    const contentHash = createHash('sha256').update(`${input.sourceType}\0${title}\0${content}`).digest('hex');
    const documentId = await this.inTenantTransaction(tenantId, async (tx) => {
      const rows = await tx.$queryRaw<Array<{ id: string }>>`
        INSERT INTO knowledge_documents (tenant_id, title, source_type, content_hash, status, chunk_count)
        VALUES (${tenantId}::uuid, ${title}, ${input.sourceType}, ${contentHash}, 'PENDING', 0)
        ON CONFLICT (tenant_id, content_hash) DO UPDATE SET
          title = EXCLUDED.title, source_type = EXCLUDED.source_type, status = 'PENDING', error_message = NULL,
          chunk_count = 0, updated_at = now()
        RETURNING id
      `;
      return rows[0].id;
    });

    try {
      const vectors: number[][] = [];
      for (let offset = 0; offset < chunks.length; offset += 16) {
        vectors.push(...await this.embed(chunks.slice(offset, offset + 16), 'passage'));
      }
      await this.inTenantTransaction(tenantId, async (tx) => {
        await tx.$executeRaw`DELETE FROM knowledge_chunks WHERE tenant_id = ${tenantId}::uuid AND document_id = ${documentId}::uuid`;
        for (let index = 0; index < chunks.length; index++) {
          const vector = `[${vectors[index].join(',')}]`;
          await tx.$executeRaw`
            INSERT INTO knowledge_chunks (id, tenant_id, document_id, chunk_index, content, embedding)
            VALUES (${randomUUID()}::uuid, ${tenantId}::uuid, ${documentId}::uuid, ${index}, ${chunks[index]}, ${vector}::vector)
          `;
        }
        await tx.$executeRaw`UPDATE knowledge_documents SET status = 'READY', chunk_count = ${chunks.length}, error_message = NULL, updated_at = now() WHERE tenant_id = ${tenantId}::uuid AND id = ${documentId}::uuid`;
      });
    } catch (error) {
      await this.inTenantTransaction(tenantId, (tx) => tx.$executeRaw`
        UPDATE knowledge_documents SET status = 'FAILED', error_message = 'Embedding/indexing failed', updated_at = now()
        WHERE tenant_id = ${tenantId}::uuid AND id = ${documentId}::uuid
      `).catch(() => undefined);
      throw error;
    }

    return { id: documentId, status: 'READY', chunkCount: chunks.length, contentHash };
  }

  async search(tenantId: string, query: string, limit = 6): Promise<KnowledgeChunk[]> {
    const cleanQuery = query.trim();
    if (!cleanQuery) return [];
    const readyDocuments = await this.inTenantTransaction(tenantId, (tx) => tx.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) AS count FROM knowledge_documents WHERE tenant_id = ${tenantId}::uuid AND status = 'READY'
    `);
    if (!Number(readyDocuments[0]?.count || 0)) return [];
    const [embedding] = await this.embed([cleanQuery], 'query');
    const vector = `[${embedding.join(',')}]`;
    const take = Math.max(1, Math.min(limit, 10));
    return this.inTenantTransaction(tenantId, (tx) => tx.$queryRaw<KnowledgeChunk[]>`
      WITH q AS (SELECT ${vector}::vector AS embedding),
      vec AS (
        SELECT c.id, ROW_NUMBER() OVER (ORDER BY c.embedding <=> q.embedding) AS rank
        FROM knowledge_chunks c CROSS JOIN q
        WHERE c.tenant_id = ${tenantId}::uuid
        ORDER BY c.embedding <=> q.embedding LIMIT 30
      ),
      kw AS (
        SELECT c.id, ROW_NUMBER() OVER (ORDER BY ts_rank(c.tsv, plainto_tsquery('simple', ${cleanQuery})) DESC) AS rank
        FROM knowledge_chunks c
        WHERE c.tenant_id = ${tenantId}::uuid AND c.tsv @@ plainto_tsquery('simple', ${cleanQuery})
        ORDER BY ts_rank(c.tsv, plainto_tsquery('simple', ${cleanQuery})) DESC LIMIT 30
      ),
      fused AS (
        SELECT id, SUM(1.0 / (60 + rank)) AS score FROM (
          SELECT id, rank FROM vec UNION ALL SELECT id, rank FROM kw
        ) ranked GROUP BY id
      )
      SELECT c.id, d.title, d.source_type AS "sourceType", c.chunk_index AS "chunkIndex", c.content, f.score
      FROM fused f JOIN knowledge_chunks c ON c.id = f.id JOIN knowledge_documents d ON d.id = c.document_id
      WHERE d.tenant_id = ${tenantId}::uuid AND d.status = 'READY'
      ORDER BY f.score DESC LIMIT ${take}
    `);
  }
}

/**
 * ollaiBooks offline audit trail.
 *
 * Every important action on the counter (bill saved, synced, stock moved,
 * settings changed, backup restored…) is appended to a hash-chained log that
 * lives inside the encrypted offline vault. Each entry stores the hash of the
 * previous one, so editing or deleting an old entry breaks the chain and the
 * Audit panel shows it as "tampered".
 */

export type AuditAction =
  | 'sale.created'
  | 'sale.printed'
  | 'sync.queued'
  | 'sync.success'
  | 'sync.failed'
  | 'sync.blocked_offline'
  | 'product.created'
  | 'product.updated'
  | 'product.archived'
  | 'product.imported'
  | 'stock.moved'
  | 'settings.updated'
  | 'logo.updated'
  | 'backup.exported'
  | 'backup.restored'
  | 'security.pin_set'
  | 'security.pin_removed'
  | 'network.offline'
  | 'network.online';

export type AuditSeverity = 'info' | 'success' | 'warning' | 'danger';

export interface AuditEntry {
  id: string;
  at: string;
  action: AuditAction;
  summary: string;
  actor: string;
  ref?: string;
  amount?: number;
  prevHash: string;
  hash: string;
}

export const AUDIT_LIMIT = 1500;

const GENESIS = '00000000';

/** FNV-1a 32-bit — fast, synchronous, deterministic. Tamper-evidence, not secrecy (the vault itself is AES-GCM encrypted). */
function fnv1a(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function entryDigest(entry: Omit<AuditEntry, 'hash'>) {
  return fnv1a([entry.prevHash, entry.id, entry.at, entry.action, entry.summary, entry.actor, entry.ref ?? '', entry.amount ?? ''].join('|'));
}

function makeAuditId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function appendAudit(
  log: AuditEntry[] | undefined,
  input: { action: AuditAction; summary: string; actor?: string; ref?: string; amount?: number },
): AuditEntry[] {
  const current = Array.isArray(log) ? log : [];
  const prevHash = current.length ? current[current.length - 1].hash : GENESIS;
  const base: Omit<AuditEntry, 'hash'> = {
    id: makeAuditId(),
    at: new Date().toISOString(),
    action: input.action,
    summary: input.summary,
    actor: input.actor || 'Counter',
    ...(input.ref ? { ref: input.ref } : {}),
    ...(typeof input.amount === 'number' ? { amount: input.amount } : {}),
    prevHash,
  };
  const next = [...current, { ...base, hash: entryDigest(base) }];
  return next.length > AUDIT_LIMIT ? next.slice(next.length - AUDIT_LIMIT) : next;
}

export function verifyAuditChain(log: AuditEntry[] | undefined): { ok: boolean; brokenAt?: number; checked: number } {
  const entries = Array.isArray(log) ? log : [];
  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    if (i > 0 && entry.prevHash !== entries[i - 1].hash) return { ok: false, brokenAt: i, checked: entries.length };
    const { hash, ...rest } = entry;
    if (entryDigest(rest) !== hash) return { ok: false, brokenAt: i, checked: entries.length };
  }
  return { ok: true, checked: entries.length };
}

export function auditSeverity(action: AuditAction): AuditSeverity {
  if (action === 'sync.failed' || action === 'backup.restored' || action === 'security.pin_removed') return 'danger';
  if (action === 'sync.blocked_offline' || action === 'network.offline' || action === 'product.archived') return 'warning';
  if (action === 'sync.success' || action === 'sale.created' || action === 'network.online') return 'success';
  return 'info';
}

export const AUDIT_LABELS: Record<AuditAction, string> = {
  'sale.created': 'Bill saved',
  'sale.printed': 'Printed',
  'sync.queued': 'Queued for sync',
  'sync.success': 'Synced to cloud',
  'sync.failed': 'Sync failed',
  'sync.blocked_offline': 'Sync waiting',
  'product.created': 'Product added',
  'product.updated': 'Product edited',
  'product.archived': 'Product archived',
  'product.imported': 'Catalogue import',
  'stock.moved': 'Stock movement',
  'settings.updated': 'Settings changed',
  'logo.updated': 'Logo updated',
  'backup.exported': 'Backup exported',
  'backup.restored': 'Backup restored',
  'security.pin_set': 'PIN set',
  'security.pin_removed': 'PIN removed',
  'network.offline': 'Went offline',
  'network.online': 'Back online',
};

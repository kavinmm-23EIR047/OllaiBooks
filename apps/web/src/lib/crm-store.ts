'use client';

/**
 * ollaiBooks CRM store — offline-first.
 *
 * - Every lead / deal / activity is written to the AES-GCM encrypted IndexedDB
 *   vault first (works with no internet).
 * - Changed records are flagged `dirty` (the outbox) and pushed to
 *   POST /crm/sync whenever the device is online; server changes are pulled
 *   back in the same call. Conflicts are last-write-wins on `updatedAt`.
 * - A tiny external store lets every page share the same live data.
 */

import * as React from 'react';
import { ApiClient } from './api-client';
import { loadEncryptedCache, saveEncryptedCache } from './offline-pos-storage';

export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
export type LeadSource = 'Walk-in' | 'Website' | 'WhatsApp' | 'Phone call' | 'Referral' | 'Instagram' | 'Google' | 'Other';
export type DealStage = 'qualification' | 'needs' | 'proposal' | 'negotiation' | 'won' | 'lost';
export type ActivityType = 'call' | 'meeting' | 'task' | 'whatsapp' | 'email' | 'note';

interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
  owner?: string;
  notes?: string;
  tags?: string[];
}

export interface Lead extends BaseRecord {
  kind: 'lead';
  name: string;
  company?: string;
  phone?: string;
  email?: string;
  city?: string;
  source: LeadSource;
  status: LeadStatus;
  expectedValue?: number;
  rating?: 'hot' | 'warm' | 'cold';
  convertedDealId?: string;
}

export interface Deal extends BaseRecord {
  kind: 'deal';
  title: string;
  contactName: string;
  company?: string;
  phone?: string;
  email?: string;
  amount: number;
  stage: DealStage;
  probability: number;
  closeDate?: string;
  leadId?: string;
  lostReason?: string;
}

export interface Activity extends BaseRecord {
  kind: 'activity';
  type: ActivityType;
  subject: string;
  dueAt?: string;
  done: boolean;
  doneAt?: string;
  relatedId?: string;
  relatedKind?: 'lead' | 'deal';
  relatedName?: string;
  priority?: 'high' | 'normal' | 'low';
}

export type CrmRecord = Lead | Deal | Activity;
export type CrmKind = CrmRecord['kind'];

interface StoredRecord {
  rec: CrmRecord;
  deleted?: boolean;
  dirty: boolean;
}

interface CrmVault {
  records: Record<string, StoredRecord>;
  lastPulledAt?: string;
  lastSyncedAt?: string;
}

export const DEAL_STAGES: Array<{ id: DealStage; label: string; probability: number; tone: string }> = [
  { id: 'qualification', label: 'Qualification', probability: 10, tone: '#64748b' },
  { id: 'needs', label: 'Needs analysis', probability: 25, tone: '#0ea5e9' },
  { id: 'proposal', label: 'Proposal / Quote', probability: 50, tone: '#2563eb' },
  { id: 'negotiation', label: 'Negotiation', probability: 75, tone: '#4f46e5' },
  { id: 'won', label: 'Closed won', probability: 100, tone: '#16a34a' },
  { id: 'lost', label: 'Closed lost', probability: 0, tone: '#e11d48' },
];

export const LEAD_STATUSES: Array<{ id: LeadStatus; label: string }> = [
  { id: 'new', label: 'New' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'qualified', label: 'Qualified' },
  { id: 'unqualified', label: 'Not interested' },
  { id: 'converted', label: 'Converted' },
];

export const LEAD_SOURCES: LeadSource[] = ['Walk-in', 'Website', 'WhatsApp', 'Phone call', 'Referral', 'Instagram', 'Google', 'Other'];

export const ACTIVITY_TYPES: Array<{ id: ActivityType; label: string }> = [
  { id: 'call', label: 'Call' },
  { id: 'meeting', label: 'Meeting' },
  { id: 'task', label: 'Task' },
  { id: 'whatsapp', label: 'WhatsApp' },
  { id: 'email', label: 'Email' },
  { id: 'note', label: 'Note' },
];

/* ------------------------------------------------------------------ */
/* External store                                                      */
/* ------------------------------------------------------------------ */

type Snapshot = {
  ready: boolean;
  tenantId: string;
  leads: Lead[];
  deals: Deal[];
  activities: Activity[];
  pendingCount: number;
  syncing: boolean;
  lastSyncedAt?: string;
  lastError?: string;
};

let vault: CrmVault = { records: {} };
let loadedTenant: string | null = null;
let loadingPromise: Promise<void> | null = null;
let syncing = false;
let lastError: string | undefined;
let snapshot: Snapshot = { ready: false, tenantId: '', leads: [], deals: [], activities: [], pendingCount: 0, syncing: false };
const listeners = new Set<() => void>();
let saveTimer: number | undefined;

function activeTenant() {
  if (typeof window === 'undefined') return 'server';
  return sessionStorage.getItem('billpilot_active_tenant_id') || 'default';
}

function makeId(prefix: string) {
  const rnd = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${rnd}`;
}

function rebuildSnapshot() {
  const live = Object.values(vault.records).filter((r) => !r.deleted).map((r) => r.rec);
  const byUpdated = (a: CrmRecord, b: CrmRecord) => b.updatedAt.localeCompare(a.updatedAt);
  snapshot = {
    ready: loadedTenant !== null,
    tenantId: loadedTenant || '',
    leads: live.filter((r): r is Lead => r.kind === 'lead').sort(byUpdated),
    deals: live.filter((r): r is Deal => r.kind === 'deal').sort(byUpdated),
    activities: live.filter((r): r is Activity => r.kind === 'activity').sort((a, b) => (a.dueAt || a.createdAt).localeCompare(b.dueAt || b.createdAt)),
    pendingCount: Object.values(vault.records).filter((r) => r.dirty).length,
    syncing,
    lastSyncedAt: vault.lastSyncedAt,
    lastError,
  };
  listeners.forEach((l) => l());
}

function persistSoon() {
  if (typeof window === 'undefined') return;
  window.clearTimeout(saveTimer);
  const tenant = loadedTenant || activeTenant();
  const data = vault;
  saveTimer = window.setTimeout(() => {
    void saveEncryptedCache('crm', data, tenant).catch(() => {
      lastError = 'Could not save CRM data on this device. Free some storage space.';
      rebuildSnapshot();
    });
  }, 250);
}

async function ensureLoaded() {
  const tenant = activeTenant();
  if (loadedTenant === tenant) return;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    vault = await loadEncryptedCache<CrmVault>('crm', { records: {} }, tenant);
    if (!vault || typeof vault !== 'object' || !vault.records) vault = { records: {} };
    loadedTenant = tenant;
    rebuildSnapshot();
  })().finally(() => { loadingPromise = null; });
  return loadingPromise;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/* ------------------------------------------------------------------ */
/* Mutations                                                           */
/* ------------------------------------------------------------------ */

type NewLead = Omit<Lead, 'id' | 'kind' | 'createdAt' | 'updatedAt'>;
type NewDeal = Omit<Deal, 'id' | 'kind' | 'createdAt' | 'updatedAt'>;
type NewActivity = Omit<Activity, 'id' | 'kind' | 'createdAt' | 'updatedAt'>;

function put(rec: CrmRecord) {
  vault.records[rec.id] = { rec, dirty: true };
  rebuildSnapshot();
  persistSoon();
  scheduleSync();
  return rec;
}

export const crm = {
  createLead(input: NewLead): Lead {
    const now = new Date().toISOString();
    return put({ ...input, id: makeId('lead'), kind: 'lead', createdAt: now, updatedAt: now }) as Lead;
  },
  createDeal(input: NewDeal): Deal {
    const now = new Date().toISOString();
    return put({ ...input, id: makeId('deal'), kind: 'deal', createdAt: now, updatedAt: now }) as Deal;
  },
  createActivity(input: NewActivity): Activity {
    const now = new Date().toISOString();
    return put({ ...input, id: makeId('act'), kind: 'activity', createdAt: now, updatedAt: now }) as Activity;
  },
  update<T extends CrmRecord>(id: string, patch: Partial<T>): T | null {
    const existing = vault.records[id];
    if (!existing || existing.deleted) return null;
    const next = { ...existing.rec, ...patch, id, kind: existing.rec.kind, updatedAt: new Date().toISOString() } as T;
    return put(next) as T;
  },
  remove(id: string) {
    const existing = vault.records[id];
    if (!existing) return;
    vault.records[id] = { rec: { ...existing.rec, updatedAt: new Date().toISOString() }, deleted: true, dirty: true };
    rebuildSnapshot();
    persistSoon();
    scheduleSync();
  },
  /** Lead → Deal, plus a follow-up task. Works offline. */
  convertLead(leadId: string, dealInput?: Partial<NewDeal>): Deal | null {
    const lead = vault.records[leadId]?.rec as Lead | undefined;
    if (!lead || lead.kind !== 'lead') return null;
    const deal = crm.createDeal({
      title: dealInput?.title || `${lead.company || lead.name} — new deal`,
      contactName: lead.name,
      company: lead.company,
      phone: lead.phone,
      email: lead.email,
      amount: dealInput?.amount ?? lead.expectedValue ?? 0,
      stage: dealInput?.stage || 'qualification',
      probability: DEAL_STAGES.find((s) => s.id === (dealInput?.stage || 'qualification'))?.probability ?? 10,
      closeDate: dealInput?.closeDate,
      leadId: lead.id,
      owner: lead.owner,
      notes: lead.notes,
    });
    crm.update<Lead>(lead.id, { status: 'converted', convertedDealId: deal.id });
    crm.createActivity({
      type: 'task',
      subject: `Send quotation to ${lead.name}`,
      dueAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
      done: false,
      relatedId: deal.id,
      relatedKind: 'deal',
      relatedName: deal.title,
      priority: 'high',
    });
    return deal;
  },
};

/* ------------------------------------------------------------------ */
/* Sync                                                                */
/* ------------------------------------------------------------------ */

let syncTimer: number | undefined;
function scheduleSync(delay = 1500) {
  if (typeof window === 'undefined') return;
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => { void syncCrm(); }, delay);
}

export type CrmSyncResult =
  | { status: 'offline'; pending: number }
  | { status: 'no-session'; pending: number }
  | { status: 'busy' }
  | { status: 'ok'; pushed: number; pulled: number; conflicts: number }
  | { status: 'error'; message: string; pending: number };

export async function syncCrm(): Promise<CrmSyncResult> {
  await ensureLoaded();
  const pending = Object.values(vault.records).filter((r) => r.dirty);
  if (typeof navigator !== 'undefined' && !navigator.onLine) return { status: 'offline', pending: pending.length };
  if (typeof window !== 'undefined' && !sessionStorage.getItem('billpilot_jwt_token')) return { status: 'no-session', pending: pending.length };
  if (syncing) return { status: 'busy' };
  syncing = true;
  lastError = undefined;
  rebuildSnapshot();
  const tenant = loadedTenant;
  try {
    const batch = pending.slice(0, 200);
    const sentVersions = new Map(batch.map((r) => [r.rec.id, r.rec.updatedAt]));
    const result = await ApiClient.post<{
      acceptedIds: string[];
      conflicts: Array<{ id: string; kind: CrmKind; data: CrmRecord; deleted: boolean; updatedAt: string }>;
      changes: Array<{ id: string; kind: CrmKind; data: CrmRecord; deleted: boolean; updatedAt: string }>;
      serverTime: string;
    }>('/crm/sync', {
      since: vault.lastPulledAt,
      records: batch.map((r) => ({ id: r.rec.id, kind: r.rec.kind, data: r.rec, deleted: Boolean(r.deleted), updatedAt: r.rec.updatedAt })),
    });
    if (tenant !== activeTenant()) return { status: 'busy' };

    // Accepted: clear dirty flag only if the record wasn't edited again meanwhile
    for (const id of result.acceptedIds || []) {
      const local = vault.records[id];
      if (local && local.rec.updatedAt === sentVersions.get(id)) local.dirty = false;
    }
    let pulled = 0;
    for (const change of [...(result.conflicts || []), ...(result.changes || [])]) {
      const local = vault.records[change.id];
      if (local?.dirty && local.rec.updatedAt > change.updatedAt) continue;
      vault.records[change.id] = { rec: { ...(change.data as CrmRecord), id: change.id, updatedAt: change.updatedAt }, deleted: change.deleted, dirty: false };
      pulled += 1;
    }
    vault.lastPulledAt = result.serverTime;
    vault.lastSyncedAt = new Date().toISOString();
    persistSoon();
    if (pending.length > batch.length) scheduleSync(300);
    return { status: 'ok', pushed: (result.acceptedIds || []).length, pulled, conflicts: (result.conflicts || []).length };
  } catch (error) {
    lastError = error instanceof Error ? error.message : 'Sync failed';
    return { status: 'error', message: lastError, pending: pending.length };
  } finally {
    syncing = false;
    rebuildSnapshot();
  }
}

/* ------------------------------------------------------------------ */
/* React hooks                                                         */
/* ------------------------------------------------------------------ */

export function useCrm() {
  const snap = React.useSyncExternalStore(subscribe, () => snapshot, () => snapshot);
  React.useEffect(() => { void ensureLoaded(); }, []);
  return snap;
}

/** Mount once (in the dashboard shell): background sync on reconnect + every 60s. */
export function useCrmBackgroundSync() {
  React.useEffect(() => {
    void ensureLoaded().then(() => scheduleSync(800));
    const onOnline = () => scheduleSync(500);
    window.addEventListener('online', onOnline);
    const interval = window.setInterval(() => { if (navigator.onLine) void syncCrm(); }, 60_000);
    return () => { window.removeEventListener('online', onOnline); window.clearInterval(interval); };
  }, []);
}

export function useOnlineStatus() {
  const [online, setOnline] = React.useState(true);
  React.useEffect(() => {
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return online;
}

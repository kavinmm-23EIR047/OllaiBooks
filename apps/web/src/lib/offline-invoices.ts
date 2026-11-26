export interface OfflineInvoiceRecord {
  id: string;
  invoice: any;
  payload: any;
  createdAt: string;
}

function storageKey() {
  if (typeof window === 'undefined') return 'billpilot:offline-invoices:server';
  const tenantId = sessionStorage.getItem('billpilot_active_tenant_id') || 'default';
  return `billpilot:offline-invoices:${tenantId}`;
}

export function getOfflineInvoiceRecords(): OfflineInvoiceRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(storageKey()) || '[]');
  } catch {
    return [];
  }
}

function writeRecords(records: OfflineInvoiceRecord[]) {
  localStorage.setItem(storageKey(), JSON.stringify(records));
}

function scopedCacheKey(name: string) {
  if (typeof window === 'undefined') return `billpilot:cache:server:${name}`;
  const tenantId = sessionStorage.getItem('billpilot_active_tenant_id') || 'default';
  return `billpilot:cache:${tenantId}:${name}`;
}

export function getOfflineCache<T>(name: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const value = localStorage.getItem(scopedCacheKey(name));
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
}

export function setOfflineCache(name: string, value: unknown) {
  if (typeof window !== 'undefined') localStorage.setItem(scopedCacheKey(name), JSON.stringify(value));
}

export function saveOfflineInvoice(record: OfflineInvoiceRecord) {
  const records = getOfflineInvoiceRecords();
  if (!records.some((item) => item.id === record.id)) records.unshift(record);
  writeRecords(records);
}

export function removeOfflineInvoice(id: string) {
  writeRecords(getOfflineInvoiceRecords().filter((record) => record.id !== id));
}

export type OfflinePosData = {
  products?: unknown[];
  sales?: unknown[];
  shop?: Record<string, unknown>;
  taxEnabled?: boolean;
  taxRate?: number;
  businessType?: string;
};

export type OfflineStorageMode = 'indexeddb' | 'localStorage';
export type StoragePersistence = 'persistent' | 'best-effort' | 'unsupported';

export async function requestPersistentStorage(): Promise<StoragePersistence> {
  if (typeof navigator === 'undefined' || !navigator.storage) return 'unsupported';
  try {
    if (await navigator.storage.persisted()) return 'persistent';
    if (typeof navigator.storage.persist !== 'function') return 'unsupported';
    return await navigator.storage.persist() ? 'persistent' : 'best-effort';
  } catch {
    return 'best-effort';
  }
}

const DATABASE_NAME = 'billdesk-offline-pos';
const DATABASE_VERSION = 1;
const OBJECT_STORE = 'workspaces';
const LEGACY_STORE = 'billdesk:offline-pos:v1';

function workspaceKey(explicitTenantId?: string) {
  if (typeof window === 'undefined') return 'server';
  const tenantId = explicitTenantId || sessionStorage.getItem('billpilot_active_tenant_id') || 'default';
  return `${LEGACY_STORE}:${tenantId}`;
}

function readLegacyData(explicitTenantId?: string): OfflinePosData | null {
  try {
    const raw = localStorage.getItem(workspaceKey(explicitTenantId));
    return raw ? JSON.parse(raw) as OfflinePosData : null;
  } catch {
    return null;
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable in this browser'));
      return;
    }
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(OBJECT_STORE)) database.createObjectStore(OBJECT_STORE, { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open local database'));
    request.onblocked = () => reject(new Error('Local database upgrade is blocked by another app tab'));
  });
}

async function readIndexedData(key: string): Promise<OfflinePosData | null> {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(OBJECT_STORE, 'readonly');
      const request = transaction.objectStore(OBJECT_STORE).get(key);
      request.onsuccess = () => resolve(request.result?.data as OfflinePosData || null);
      request.onerror = () => reject(request.error || new Error('Could not read local database'));
      transaction.onerror = () => reject(transaction.error || new Error('Local database read failed'));
    });
  } finally {
    database.close();
  }
}

async function writeIndexedData(key: string, data: OfflinePosData) {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(OBJECT_STORE, 'readwrite');
      transaction.objectStore(OBJECT_STORE).put({ key, data, updatedAt: new Date().toISOString() });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('Could not save local database'));
      transaction.onabort = () => reject(transaction.error || new Error('Local database save was interrupted'));
    });
  } finally {
    database.close();
  }
}

let writeQueue = Promise.resolve();

export async function loadOfflinePosData(explicitTenantId?: string): Promise<{ data: OfflinePosData | null; mode: OfflineStorageMode }> {
  const key = workspaceKey(explicitTenantId);
  try {
    const saved = await readIndexedData(key);
    if (saved) return { data: saved, mode: 'indexeddb' };
    const legacy = readLegacyData(explicitTenantId);
    if (legacy) {
      await writeIndexedData(key, legacy);
      return { data: legacy, mode: 'indexeddb' };
    }
    return { data: null, mode: 'indexeddb' };
  } catch {
    return { data: readLegacyData(explicitTenantId), mode: 'localStorage' };
  }
}

export function saveOfflinePosData(data: OfflinePosData, explicitTenantId?: string): Promise<OfflineStorageMode> {
  const key = workspaceKey(explicitTenantId);
  const save = async (): Promise<OfflineStorageMode> => {
    try {
      await writeIndexedData(key, data);
      return 'indexeddb';
    } catch {
      try {
        localStorage.setItem(key, JSON.stringify(data));
        return 'localStorage';
      } catch {
        throw new Error('Could not save this bill to device storage. Export a backup and free device space.');
      }
    }
  };
  const next = writeQueue.then(save, save);
  writeQueue = next.then(() => undefined, () => undefined);
  return next;
}

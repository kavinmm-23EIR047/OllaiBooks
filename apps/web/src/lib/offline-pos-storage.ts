export type OfflinePosData = {
  products?: unknown[];
  sales?: unknown[];
  shop?: Record<string, unknown>;
  taxEnabled?: boolean;
  taxRate?: number;
  businessType?: string;
  auditLog?: unknown[];
  lastSyncedAt?: string | null;
  lastBackupAt?: string | null;
  cache?: unknown;
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
const DATABASE_VERSION = 2;
const OBJECT_STORE = 'workspaces';
const VAULT_KEY_STORE = 'vault_keys';
const LEGACY_STORE = 'billdesk:offline-pos:v1';
const PIN_STORAGE_PREFIX = 'ollaibooks:offline-pin:v1:';

type EncryptedEnvelope = {
  encrypted: true;
  alg: 'AES-GCM-256';
  iv: string;
  ciphertext: string;
  integrityHash: string;
};

function workspaceKey(explicitTenantId?: string) {
  if (typeof window === 'undefined') return 'server';
  const tenantId = explicitTenantId || sessionStorage.getItem('billpilot_active_tenant_id') || 'default';
  return `${LEGACY_STORE}:${tenantId}`;
}

function isCryptoAvailable(): boolean {
  return typeof window !== 'undefined' && Boolean(window.crypto?.subtle);
}

export function isOfflineVaultEncrypted(): boolean {
  return isCryptoAvailable();
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function sha256Hex(input: string): Promise<string> {
  if (!isCryptoAvailable()) return '';
  const data = new TextEncoder().encode(input);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
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
      if (!database.objectStoreNames.contains(OBJECT_STORE)) {
        database.createObjectStore(OBJECT_STORE, { keyPath: 'key' });
      }
      if (!database.objectStoreNames.contains(VAULT_KEY_STORE)) {
        database.createObjectStore(VAULT_KEY_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Could not open local database'));
    request.onblocked = () => reject(new Error('Local database upgrade is blocked by another app tab'));
  });
}

async function getOrCreateVaultKey(workspaceId: string): Promise<CryptoKey | null> {
  if (!isCryptoAvailable()) return null;
  const keyId = `aes:${workspaceId}`;
  const database = await openDatabase();
  try {
    const existing = await new Promise<CryptoKey | null>((resolve, reject) => {
      const tx = database.transaction(VAULT_KEY_STORE, 'readonly');
      const req = tx.objectStore(VAULT_KEY_STORE).get(keyId);
      req.onsuccess = () => resolve((req.result?.cryptoKey as CryptoKey) || null);
      req.onerror = () => reject(req.error || new Error('Could not read vault key'));
    });
    if (existing) return existing;

    const generated = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction(VAULT_KEY_STORE, 'readwrite');
      tx.objectStore(VAULT_KEY_STORE).put({ key: keyId, cryptoKey: generated, createdAt: new Date().toISOString() });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Could not store vault key'));
    });
    return generated;
  } catch {
    return null;
  } finally {
    database.close();
  }
}

function isEncryptedEnvelope(value: unknown): value is EncryptedEnvelope {
  return Boolean(
    value &&
      typeof value === 'object' &&
      (value as EncryptedEnvelope).encrypted === true &&
      typeof (value as EncryptedEnvelope).ciphertext === 'string' &&
      typeof (value as EncryptedEnvelope).iv === 'string',
  );
}

async function encryptPayload(keyId: string, data: OfflinePosData): Promise<OfflinePosData | EncryptedEnvelope> {
  const cryptoKey = await getOrCreateVaultKey(keyId);
  if (!cryptoKey) return data;
  const json = JSON.stringify(data);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(json);
  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encoded,
  );
  const integrityHash = await sha256Hex(json);
  return {
    encrypted: true,
    alg: 'AES-GCM-256',
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(cipherBuffer)),
    integrityHash,
  };
}

async function decryptPayload(keyId: string, stored: unknown): Promise<OfflinePosData | null> {
  if (!stored) return null;
  if (!isEncryptedEnvelope(stored)) {
    return stored as OfflinePosData;
  }
  const cryptoKey = await getOrCreateVaultKey(keyId);
  if (!cryptoKey) return null;
  const ivBytes = base64ToBytes(stored.iv);
  const cipherBytes = base64ToBytes(stored.ciphertext);
  const plainBuffer = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(ivBytes) },
    cryptoKey,
    new Uint8Array(cipherBytes),
  );
  const json = new TextDecoder().decode(plainBuffer);
  if (stored.integrityHash) {
    const actualHash = await sha256Hex(json);
    if (actualHash && actualHash !== stored.integrityHash) {
      throw new Error('Offline vault integrity check failed.');
    }
  }
  return JSON.parse(json) as OfflinePosData;
}

function readLegacyData(explicitTenantId?: string): OfflinePosData | null {
  try {
    const raw = localStorage.getItem(workspaceKey(explicitTenantId));
    return raw ? (JSON.parse(raw) as OfflinePosData) : null;
  } catch {
    return null;
  }
}

async function readIndexedData(key: string): Promise<OfflinePosData | null> {
  const database = await openDatabase();
  let rawRecord: unknown = null;
  try {
    rawRecord = await new Promise((resolve, reject) => {
      const transaction = database.transaction(OBJECT_STORE, 'readonly');
      const request = transaction.objectStore(OBJECT_STORE).get(key);
      request.onsuccess = () => resolve(request.result?.data ?? null);
      request.onerror = () => reject(request.error || new Error('Could not read local database'));
      transaction.onerror = () => reject(transaction.error || new Error('Local database read failed'));
    });
  } finally {
    database.close();
  }
  if (!rawRecord) return null;
  return decryptPayload(key, rawRecord);
}

async function writeIndexedData(key: string, data: OfflinePosData) {
  const payloadToStore = await encryptPayload(key, data);
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(OBJECT_STORE, 'readwrite');
      transaction.objectStore(OBJECT_STORE).put({ key, data: payloadToStore, updatedAt: new Date().toISOString() });
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

// Offline Counter PIN Lock Helpers (Salted SHA-256)
export async function hashOfflinePin(pin: string, tenantId: string): Promise<string> {
  return sha256Hex(`ollaibooks-pin:${tenantId}:${pin.trim()}`);
}

export function getOfflinePinHash(tenantId: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(`${PIN_STORAGE_PREFIX}${tenantId}`);
  } catch {
    return null;
  }
}

export async function setOfflineCounterPin(tenantId: string, pin: string | null): Promise<void> {
  if (typeof window === 'undefined') return;
  const storageKey = `${PIN_STORAGE_PREFIX}${tenantId}`;
  if (!pin || !pin.trim()) {
    localStorage.removeItem(storageKey);
    return;
  }
  const hashed = await hashOfflinePin(pin, tenantId);
  localStorage.setItem(storageKey, hashed);
}

export async function verifyOfflineCounterPin(tenantId: string, pin: string): Promise<boolean> {
  const stored = getOfflinePinHash(tenantId);
  if (!stored) return true;
  const candidate = await hashOfflinePin(pin, tenantId);
  return candidate === stored;
}

/**
 * Encrypted side-cache (e.g. last downloaded website orders) stored under its
 * own key, so it never races with the main POS workspace record and never
 * sits in plain-text localStorage.
 */
export async function saveEncryptedCache(name: string, value: unknown, explicitTenantId?: string): Promise<void> {
  const key = `${workspaceKey(explicitTenantId)}:cache:${name}`;
  await writeIndexedData(key, { cache: value });
}

export async function loadEncryptedCache<T>(name: string, fallback: T, explicitTenantId?: string): Promise<T> {
  try {
    const key = `${workspaceKey(explicitTenantId)}:cache:${name}`;
    const data = await readIndexedData(key);
    return data && 'cache' in data ? (data.cache as T) : fallback;
  } catch {
    return fallback;
  }
}

type Workspace = { tenantId: string; tenantName: string; tenantSlug: string; subscriptionEndsAt?: string };
type OfflineIdentity = { version: 2; email: string; salt: string; verifier: string; workspace: Workspace; user: { id: string; email: string; firstName: string; lastName: string }; expiresAt: number };
type ActiveDeviceLease = {
  version: 1;
  email: string;
  user: OfflineIdentity['user'];
  workspace: Workspace;
  expiresAt: number;
  lastSeenAt: number;
};

// Keep this storage key stable so existing device data is preserved.
const STORE = 'billdesk:offline-identities:v1';
const ACTIVE_LEASE_KEY = 'ollaibooks:active-device-lease:v1';
const SESSION_FLAG = 'billdesk_pos_auth';
const ITERATIONS = 310000;
const CLOCK_SKEW_TOLERANCE_MS = 5 * 60 * 1000;

function readActiveLease(): ActiveDeviceLease | null {
  try {
    const raw = JSON.parse(localStorage.getItem(ACTIVE_LEASE_KEY) || 'null');
    if (!raw || raw.version !== 1 || !raw.workspace?.tenantId || !Number.isFinite(raw.expiresAt)) return null;
    return raw as ActiveDeviceLease;
  } catch {
    return null;
  }
}

function writeActiveLease(lease: ActiveDeviceLease) {
  try {
    localStorage.setItem(ACTIVE_LEASE_KEY, JSON.stringify(lease));
  } catch {
    /* ignore storage quota errors */
  }
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function deriveVerifier(email: string, password: string, salt: Uint8Array) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(`${email.toLowerCase()}\u0000${password}`), 'PBKDF2', false, ['deriveBits']);
  const saltBuffer = new Uint8Array(salt).buffer as ArrayBuffer;
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: saltBuffer, iterations: ITERATIONS }, material, 256);
  return bytesToHex(new Uint8Array(bits));
}

function readIdentities(): OfflineIdentity[] {
  try {
    const value = JSON.parse(localStorage.getItem(STORE) || '[]');
    return Array.isArray(value) ? value.filter((item) => item?.version === 2 && typeof item?.email === 'string' && typeof item?.salt === 'string' && typeof item?.verifier === 'string' && item?.workspace?.tenantId && Number.isFinite(item?.expiresAt)) : [];
  } catch { return []; }
}

export async function rememberOfflineIdentity(input: {
  email: string; password: string; user: OfflineIdentity['user']; workspace: Workspace;
}) {
  if (!input.workspace.tenantId || typeof crypto === 'undefined' || !crypto.subtle) return;
  const now = Date.now();
  const subscriptionEnd = input.workspace.subscriptionEndsAt ? new Date(input.workspace.subscriptionEndsAt).getTime() : Number.NaN;
  if (!Number.isFinite(subscriptionEnd) || subscriptionEnd <= now) return;
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const verifier = await deriveVerifier(input.email, input.password, salt);
  const identity: OfflineIdentity = {
    version: 2,
    email: input.email.trim().toLowerCase(), salt: bytesToHex(salt), verifier,
    workspace: input.workspace, user: input.user, expiresAt: subscriptionEnd,
  };
  const identities = readIdentities().filter((item) => !(item.email === identity.email && item.workspace.tenantId === identity.workspace.tenantId));
  identities.push(identity);
  try { localStorage.setItem(STORE, JSON.stringify(identities)); } catch { /* Online sign-in remains usable if this device cannot cache offline access. */ }
  writeActiveLease({
    version: 1,
    email: identity.email,
    user: identity.user,
    workspace: identity.workspace,
    expiresAt: subscriptionEnd,
    lastSeenAt: now,
  });
}

export async function loginOffline(emailInput: string, password: string) {
  const email = emailInput.trim().toLowerCase();
  const candidates = readIdentities().filter((item) => item.email === email && item.expiresAt > Date.now());
  if (!candidates.length) {
    throw new Error('Sign in online once on this device to enable offline billing. Offline access lasts up to 7 days and follows your subscription end date.');
  }
  if (typeof crypto === 'undefined' || !crypto.subtle) throw new Error('Secure offline sign-in is unavailable in this browser. Open the installed app over HTTPS.');
  for (const identity of candidates) {
    const salt = Uint8Array.from(identity.salt.match(/.{2}/g)?.map((part) => parseInt(part, 16)) || []);
    const actual = await deriveVerifier(email, password, salt);
    let diff = actual.length ^ identity.verifier.length;
    for (let i = 0; i < Math.max(actual.length, identity.verifier.length); i++) diff |= (actual.charCodeAt(i) || 0) ^ (identity.verifier.charCodeAt(i) || 0);
    if (diff === 0) {
      sessionStorage.setItem('billpilot_workspaces', JSON.stringify([identity.workspace]));
      sessionStorage.setItem('billpilot_active_tenant_id', identity.workspace.tenantId);
      sessionStorage.setItem(SESSION_FLAG, 'offline');
      sessionStorage.setItem('billdesk_pos_offline_expires_at', String(identity.expiresAt));
      sessionStorage.removeItem('billpilot_jwt_token');
      sessionStorage.setItem('ollaibooks_account', JSON.stringify({
        email: identity.user?.email || identity.email,
        name: [identity.user?.firstName, identity.user?.lastName].filter(Boolean).join(' '),
        mode: 'offline',
      }));
      return identity;
    }
  }
  throw new Error('Email or password is incorrect.');
}

export function setPosOnlineSession() {
  sessionStorage.setItem(SESSION_FLAG, 'online');
  sessionStorage.removeItem('billdesk_pos_offline_expires_at');
}

export function hasPosSession() {
  if (sessionStorage.getItem(SESSION_FLAG) === 'offline') {
    return Number(sessionStorage.getItem('billdesk_pos_offline_expires_at') || 0) > Date.now();
  }
  return (sessionStorage.getItem(SESSION_FLAG) === 'online' || !!sessionStorage.getItem('billpilot_jwt_token')) && !!sessionStorage.getItem('billpilot_jwt_token');
}

export function getPosSessionMode() {
  if (!hasPosSession()) return null;
  return sessionStorage.getItem(SESSION_FLAG) === 'offline' ? 'offline' : 'online';
}

export function clearPosSession() {
  sessionStorage.removeItem(SESSION_FLAG);
  sessionStorage.removeItem('billdesk_pos_offline_expires_at');
  sessionStorage.removeItem('billpilot_jwt_token');
  sessionStorage.removeItem('billpilot_workspaces');
  sessionStorage.removeItem('billpilot_active_tenant_id');
  sessionStorage.removeItem('ollaibooks_account');
}

/** Revokes the saved one-time device activation (used on explicit Sign Out or Admin Stop/Reset). */
export function revokeDeviceLease() {
  try {
    localStorage.removeItem(ACTIVE_LEASE_KEY);
    localStorage.removeItem(STORE);
  } catch {
    /* ignore */
  }
  clearPosSession();
}

/**
 * Restores a previously activated offline POS session automatically on app reopen,
 * valid until the Admin-configured subscriptionEndsAt date (with clock-rollback protection).
 */
export function tryAutoRestorePosSession(): boolean {
  if (typeof window === 'undefined') return false;
  if (hasPosSession()) return true;
  const lease = readActiveLease();
  if (!lease) return false;
  const now = Date.now();
  if (now + CLOCK_SKEW_TOLERANCE_MS < lease.lastSeenAt) {
    // Device clock moved backward — require online verification.
    return false;
  }
  if (lease.expiresAt <= now) {
    return false;
  }
  writeActiveLease({ ...lease, lastSeenAt: Math.max(lease.lastSeenAt, now) });
  sessionStorage.setItem('billpilot_workspaces', JSON.stringify([lease.workspace]));
  sessionStorage.setItem('billpilot_active_tenant_id', lease.workspace.tenantId);
  sessionStorage.setItem(SESSION_FLAG, 'offline');
  sessionStorage.setItem('billdesk_pos_offline_expires_at', String(lease.expiresAt));
  sessionStorage.setItem('ollaibooks_account', JSON.stringify({
    email: lease.user?.email || lease.email,
    name: [lease.user?.firstName, lease.user?.lastName].filter(Boolean).join(' '),
    mode: 'offline',
  }));
  return true;
}

/** Syncs an updated subscription end date from the server into the active device lease. */
export function refreshDeviceLeaseSubscription(subscriptionEndsAt?: string) {
  const lease = readActiveLease();
  if (!lease || !subscriptionEndsAt) return;
  const nextEnd = new Date(subscriptionEndsAt).getTime();
  if (!Number.isFinite(nextEnd)) return;
  if (nextEnd <= Date.now()) {
    revokeDeviceLease();
    return;
  }
  writeActiveLease({
    ...lease,
    workspace: { ...lease.workspace, subscriptionEndsAt },
    expiresAt: nextEnd,
    lastSeenAt: Math.max(lease.lastSeenAt, Date.now()),
  });
  if (sessionStorage.getItem(SESSION_FLAG) === 'offline') {
    sessionStorage.setItem('billdesk_pos_offline_expires_at', String(nextEnd));
  }
}

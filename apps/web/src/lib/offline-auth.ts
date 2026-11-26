type Workspace = { tenantId: string; tenantName: string; tenantSlug: string; subscriptionEndsAt?: string };
type OfflineIdentity = { version: 2; email: string; salt: string; verifier: string; workspace: Workspace; user: { id: string; email: string; firstName: string; lastName: string }; expiresAt: number };

// Keep this storage key stable so existing device data is preserved. Old entries
// are replaced after the next successful online sign-in without a license key.
const STORE = 'billdesk:offline-identities:v1';
const SESSION_FLAG = 'billdesk_pos_auth';
const ITERATIONS = 310000;
const OFFLINE_LEASE_MS = 7 * 24 * 60 * 60 * 1000;

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
    workspace: input.workspace, user: input.user, expiresAt: Math.min(now + OFFLINE_LEASE_MS, subscriptionEnd),
  };
  const identities = readIdentities().filter((item) => !(item.email === identity.email && item.workspace.tenantId === identity.workspace.tenantId));
  identities.push(identity);
  try { localStorage.setItem(STORE, JSON.stringify(identities)); } catch { /* Online sign-in remains usable if this device cannot cache offline access. */ }
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
}

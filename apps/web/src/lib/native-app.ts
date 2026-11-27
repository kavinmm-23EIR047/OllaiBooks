/**
 * Detects whether ollaiBooks is running inside the installed app
 * (Windows/macOS desktop via Electron, or Android via Capacitor).
 *
 * Product rule: the browser is ONLINE-only (after login). Offline billing is
 * available only in the installed app, where data lives on the device and
 * invoices are saved as files on the laptop.
 */

export interface DesktopPaths {
  root: string;
  invoices: string;
  backups: string;
  appData: string;
  appVersion: string;
}

export interface DesktopBridge {
  isElectron: true;
  platform: string;
  getPaths: (business?: string) => Promise<DesktopPaths>;
  saveInvoiceFile: (input: { html: string; fileName: string; business?: string; date?: string }) => Promise<{ ok: boolean; path?: string; error?: string }>;
  saveBackupFile: (input: { json: string; fileName: string; business?: string }) => Promise<{ ok: boolean; path?: string; error?: string }>;
  openFolder: (target: 'invoices' | 'backups' | 'root', business?: string) => Promise<{ ok: boolean }>;
  listBackups?: (business?: string) => Promise<Array<{ name: string; size: number; modifiedAt: string }>>;
}

declare global {
  interface Window {
    electronAPI?: DesktopBridge;
    Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string };
  }
}

export function getDesktopBridge(): DesktopBridge | null {
  if (typeof window === 'undefined') return null;
  const api = window.electronAPI;
  return api && api.isElectron && typeof api.getPaths === 'function' ? api : null;
}

export function isAndroidApp() {
  if (typeof window === 'undefined') return false;
  return Boolean(window.Capacitor?.isNativePlatform?.());
}

export function isNativeApp() {
  if (typeof window === 'undefined') return false;
  if (process.env.NEXT_PUBLIC_ALLOW_WEB_OFFLINE === '1') return true; // developer override only
  return Boolean(window.electronAPI?.isElectron) || isAndroidApp();
}

export function nativePlatformLabel() {
  if (getDesktopBridge()) {
    const p = window.electronAPI!.platform;
    return p === 'darwin' ? 'macOS app' : p === 'win32' ? 'Windows app' : 'Desktop app';
  }
  if (isAndroidApp()) return 'Android app';
  return 'Web browser';
}

export const SUPPORT = {
  phone: '+91 96007 32162',
  phoneHref: 'tel:+919600732162',
  whatsapp: 'https://wa.me/919600732162',
  email: 'support@ollaibooks.in',
  hours: 'Mon–Sat, 9:00 AM – 8:00 PM IST',
};

export const DOWNLOADS = {
  windows: '/download?platform=windows',
  android: '/download?platform=android',
  mac: '/download?platform=mac',
};

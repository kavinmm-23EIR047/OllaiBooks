'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity, Archive, ArchiveRestore, ArrowDownToLine, ArrowUpFromLine, BadgeIndianRupee, Banknote,
  Check, ChevronDown, CircleHelp, Cloud, CloudOff, Download, LogOut,
  FileSpreadsheet, IndianRupee, Menu, Minus, Package, Plus, Printer,
  Search, Settings2, ShoppingBag, ShoppingCart, Sparkles, Trash2, Wifi, WifiOff, X,
  Building2, Upload, FileText, CheckCircle2, AlertCircle, RefreshCw,
  QrCode, CreditCard, Laptop, Shirt, Coffee, Tag, Boxes, Layers, Store,
  Smartphone, User, Clock, Receipt, ShieldCheck, Pencil, Calculator,
  ExternalLink, Copy, Monitor, Share2, Lock, KeyRound, Palette
} from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import { clearPosSession, getPosSessionMode } from '@/lib/offline-auth';
import {
  loadOfflinePosData,
  requestPersistentStorage,
  saveOfflinePosData,
  isOfflineVaultEncrypted,
  getOfflinePinHash,
  setOfflineCounterPin,
  verifyOfflineCounterPin,
  saveEncryptedCache,
  loadEncryptedCache,
  type OfflineStorageMode,
  type StoragePersistence,
} from '@/lib/offline-pos-storage';
import { getOfflineCache, setOfflineCache, clearOfflineCache } from '@/lib/offline-invoices';
import { buildOrderBook, filterOrderBook, type OrderBookTab } from '@/lib/order-book';
import {
  printKitchenOrderTicket,
  printInvoiceDocument,
  printKotAndBill,
  type InvoiceTemplateId,
  type ThermalPaperWidth,
} from '@/lib/print-documents';
import { buildInvoiceHtml, buildSampleSale, type GstRegistrationType } from '@/lib/print-documents';
import { INDIAN_GST_STATES, detectGstState, isInterstateGst } from '@/lib/gst-utils';
import { appendAudit, verifyAuditChain, auditSeverity, AUDIT_LABELS, type AuditEntry, type AuditAction } from '@/lib/audit-trail';
import { useToasts, ToastStack } from '@/components/ui/pos-toast';
import { getDesktopBridge, isNativeApp, nativePlatformLabel, SUPPORT, type DesktopPaths } from '@/lib/native-app';
import { DownloadAppGate } from '@/components/native/download-app-gate';
import {
  OfflineCounterIllustration, SyncCloudIllustration, EmptyCartIllustration,
  AuditShieldIllustration, LogoUploadIllustration,
} from '@/components/illustrations/pos-illustrations';

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  isArchived?: boolean;
  tracksStock?: boolean;
  emoji: string;
  color: string;
  hsn?: string;
  stockUnit?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  weight?: string;
  extra?: string;
  purchaseBill?: { name: string; type: string; dataUrl: string };
  stockMovements?: Array<{ id: string; date: string; direction: 'IN' | 'OUT'; quantity: number; reason: string }>;
}

export interface LineItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  hsn?: string;
  unit?: string;
}

export interface Sale {
  id: string;
  number: string;
  date: string;
  customer: string;
  phone: string;
  items: LineItem[];
  subtotal: number;
  discount: number;
  taxRate: number;
  gst: number;
  total: number;
  paid: number;
  method: string;
  note: string;
  pickup: string;
  orderType?: string;
  tableNumber?: string;
  placeOfSupply?: string;
  isInterstate?: boolean;
  customerGstin?: string;
  customerAddress?: string;
  sync: 'pending' | 'synced';
  syncedAt?: string;
  filePath?: string;
}

interface PosReminder {
  id: string;
  title: string;
  startsAt: string;
  note?: string;
}

export interface Shop {
  name: string;
  phone: string;
  address: string;
  gstin: string;
  businessType: string;
  state?: string;
  logo?: string;
  email?: string;
  upiId?: string;
  bankDetails?: string;
  terms?: string;
  footerNote?: string;
  fssai?: string;
  gstRegistration?: GstRegistrationType;
  brandColor?: string;
  secondaryColor?: string;
  appAccentColor?: string;
  appSurfaceColor?: string;
  appSidebarColor?: string;
  [key: string]: unknown;
}

const APP_THEME_PRESETS = [
  { id: 'blue-silver', name: 'Blue & Silver', accent: '#2563eb', surface: '#f1f5f9', sidebar: '#ffffff' },
  { id: 'emerald-mist', name: 'Emerald & Mist', accent: '#059669', surface: '#ecfdf5', sidebar: '#ffffff' },
  { id: 'indigo-gray', name: 'Indigo & Cool Gray', accent: '#4f46e5', surface: '#eef2ff', sidebar: '#f8fafc' },
  { id: 'teal-slate', name: 'Teal & Slate', accent: '#0d9488', surface: '#f0fdfa', sidebar: '#ffffff' },
  { id: 'violet-pearl', name: 'Violet & Pearl', accent: '#7c3aed', surface: '#f5f3ff', sidebar: '#ffffff' },
  { id: 'rose-warm', name: 'Rose & Warm Gray', accent: '#e11d48', surface: '#fff1f2', sidebar: '#ffffff' },
  { id: 'amber-sand', name: 'Amber & Sand', accent: '#d97706', surface: '#fffbeb', sidebar: '#ffffff' },
] as const;

function safeHex(val: string | undefined, fallback: string) {
  return val && /^#[0-9a-fA-F]{6}$/.test(val.trim()) ? val.trim() : fallback;
}

function mixHex(hex: string, target: string, weight: number) {
  const a = safeHex(hex, '#2563eb').slice(1);
  const b = safeHex(target, '#ffffff').slice(1);
  const mix = (i: number) => Math.round(parseInt(a.slice(i, i + 2), 16) * (1 - weight) + parseInt(b.slice(i, i + 2), 16) * weight);
  return `#${[mix(0), mix(2), mix(4)].map(n => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0')).join('')}`;
}

function buildAppThemeVars(shop: Shop): React.CSSProperties {
  const accent = safeHex(shop.appAccentColor, '#2563eb');
  const surface = safeHex(shop.appSurfaceColor, '#f1f5f9');
  const sidebar = safeHex(shop.appSidebarColor, '#ffffff');
  return {
    '--brand-blue': accent,
    '--brand-blue-hover': mixHex(accent, '#000000', 0.14),
    '--brand-blue-soft': mixHex(accent, '#ffffff', 0.90),
    '--brand-blue-border': mixHex(accent, '#ffffff', 0.72),
    '--silver': surface,
    '--silver-soft': mixHex(surface, '#ffffff', 0.55),
    '--sidebar-bg': sidebar,
  } as React.CSSProperties;
}

const GSTIN_PATTERN = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/;

/** Resize an uploaded logo to max 320px and return a compact data URL, safe for offline storage and printing. */
async function resizeLogo(file: File): Promise<string> {
  if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.type)) throw new Error('Please choose a PNG, JPG, WebP or SVG image.');
  if (file.size > 4 * 1024 * 1024) throw new Error('Logo must be 4 MB or smaller.');
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the logo file.'));
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('That image could not be opened.'));
    el.src = dataUrl;
  });
  const max = 320;
  const scale = Math.min(1, max / Math.max(img.naturalWidth || max, img.naturalHeight || max));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round((img.naturalWidth || max) * scale));
  canvas.height = Math.max(1, Math.round((img.naturalHeight || max) * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/png');
}

export interface WorkspaceItem {
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
}

const roundMoney = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const money = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const csvCell = (value: unknown) => {
  let text = String(value ?? '');
  if (/^[\s]*[=+@\-\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
};

const dateLabel = (value: string) => new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

const makeId = () => typeof crypto !== 'undefined' && 'randomUUID' in crypto
  ? crypto.randomUUID()
  : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

type IndustryKey = 'bakery' | 'salon' | 'restaurant' | 'general';

function getIndustryProfile(businessType: string): {
  key: IndustryKey;
  title: string;
  catalogTitle: string;
  itemSingular: string;
  itemPlural: string;
  dateLabel: string;
  dateTitle: string;
  notesLabel: string;
  notesPlaceholder: string;
  orderTypes: string[];
  customerLabel: string;
  searchPlaceholder: string;
} {
  const type = businessType.toLowerCase();
  if (/salon|spa|beauty|barber/.test(type)) return {
    key: 'salon', title: 'Salon & Spa', catalogTitle: 'Services & products', itemSingular: 'service or product', itemPlural: 'services and products',
    dateLabel: 'Appointment time', dateTitle: 'Appointment date and time', notesLabel: 'Service notes', notesPlaceholder: 'Stylist, treatment, or customer instructions',
    orderTypes: ['Appointment', 'Walk-in service', 'Retail product'], customerLabel: 'Client', searchPlaceholder: 'Search service, product, or code…',
  };
  if (/restaurant|cafe|café|hotel|food service/.test(type)) return {
    key: 'restaurant', title: 'Restaurant', catalogTitle: 'Menu & dishes', itemSingular: 'menu item', itemPlural: 'menu items',
    dateLabel: 'Pickup / delivery time', dateTitle: 'Pickup or delivery time', notesLabel: 'Kitchen notes', notesPlaceholder: 'Dietary requests or kitchen instructions',
    orderTypes: ['Dine-in', 'Takeaway', 'Delivery'], customerLabel: 'Guest', searchPlaceholder: 'Search menu or item code…',
  };
  if (/bakery|confectionery|patisserie|cake/.test(type)) return {
    key: 'bakery', title: 'Bakery', catalogTitle: 'Bakery products', itemSingular: 'bakery item', itemPlural: 'bakery items',
    dateLabel: 'Pickup / due time', dateTitle: 'Cake pickup or delivery time', notesLabel: 'Order details', notesPlaceholder: 'Cake message, flavor, size, or pickup notes',
    orderTypes: ['Counter sale', 'Pre-order', 'Pickup'], customerLabel: 'Customer', searchPlaceholder: 'Search bakery item or code…',
  };
  return {
    key: 'general', title: businessType.trim() || 'General business', catalogTitle: 'Products & services', itemSingular: 'item', itemPlural: 'items',
    dateLabel: 'Delivery / due', dateTitle: 'Delivery or due time', notesLabel: 'Order notes / reference', notesPlaceholder: 'Special instructions or bill notes',
    orderTypes: ['Counter sale', 'Pickup', 'Delivery'], customerLabel: 'Customer', searchPlaceholder: 'Search item name or code…',
  };
}

// Category Icon Helper for Multi-Tenant Businesses
function getCategoryIcon(cat: string) {
  const c = (cat || '').toLowerCase();
  if (c === 'all items') return <Layers size={13} className="text-[var(--brand-blue)]" />;
  if (c.includes('electron') || c.includes('tech') || c.includes('hardware') || c.includes('mobile')) return <Laptop size={13} className="text-sky-600" />;
  if (c.includes('apparel') || c.includes('cloth') || c.includes('fashion') || c.includes('shirt')) return <Shirt size={13} className="text-indigo-600" />;
  if (c.includes('beverage') || c.includes('coffee') || c.includes('drink') || c.includes('tea')) return <Coffee size={13} className="text-amber-600" />;
  if (c.includes('food') || c.includes('grocer') || c.includes('supermarket')) return <ShoppingCart size={13} className="text-emerald-600" />;
  if (c.includes('service') || c.includes('consult')) return <Building2 size={13} className="text-purple-600" />;
  if (c.includes('retail') || c.includes('confectionery')) return <ShoppingBag size={13} className="text-[var(--brand-blue)]" />;
  return <Tag size={13} className="text-slate-500" />;
}

// Product Art Renderer with Multi-Tenant Lucide Icons
function renderProductCardArt(p: Product) {
  const name = (p.name || '').toLowerCase();
  const cat = (p.category || '').toLowerCase();

  if (name.includes('mouse') || name.includes('cable') || name.includes('phone') || name.includes('laptop') || name.includes('keyboard') || cat.includes('electron')) {
    return <Laptop size={32} className="text-[var(--brand-blue)]" />;
  }
  if (name.includes('shirt') || name.includes('cloth') || name.includes('pant') || name.includes('t-shirt') || cat.includes('apparel')) {
    return <Shirt size={32} className="text-indigo-600" />;
  }
  if (name.includes('coffee') || name.includes('tea') || name.includes('cider') || name.includes('juice') || cat.includes('beverage')) {
    return <Coffee size={32} className="text-amber-600" />;
  }
  if (name.includes('grocer') || name.includes('organic') || cat.includes('grocery')) {
    return <ShoppingCart size={32} className="text-emerald-600" />;
  }
  if (cat.includes('services') || name.includes('consulting')) {
    return <Building2 size={26} className="text-purple-600" />;
  }
  if (cat.includes('confectionery') || cat.includes('gourmet')) {
    return <ShoppingBag size={26} className="text-purple-600" />;
  }
  const iconKey = p.emoji || '';
  if (iconKey === 'icon:laptop' || iconKey === '💻') return <Laptop size={26} className="text-[var(--brand-blue)]" />;
  if (iconKey === 'icon:phone' || iconKey === '📱') return <Smartphone size={26} className="text-indigo-600" />;
  if (iconKey === 'icon:shirt' || iconKey === '👕') return <Shirt size={26} className="text-rose-600" />;
  if (iconKey === 'icon:bag' || iconKey === '🛒') return <ShoppingBag size={26} className="text-emerald-600" />;
  if (iconKey === 'icon:coffee' || iconKey === '☕') return <Coffee size={26} className="text-amber-600" />;
  if (iconKey === 'icon:layers' || iconKey === '💼') return <Layers size={26} className="text-purple-600" />;
  if (iconKey === 'icon:tag' || iconKey === '🏷️') return <Tag size={26} className="text-sky-600" />;
  return <Package size={26} className="text-slate-600" />;
}

// Zero-dependency, standards-compliant CSV parser for Excel & Google Sheets
function parseCsv(text: string): Record<string, string>[] {
  const cleanText = text.replace(/^\uFEFF/, ''); // Strip BOM if present
  const lines: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    if (char === '"') {
      if (inQuotes && cleanText[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && cleanText[i + 1] === '\n') i++;
      lines.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  if (current.trim()) lines.push(current);
  if (lines.length < 2) return [];

  const parseRow = (line: string): string[] => {
    const cells: string[] = [];
    let cell = '';
    let inQ = false;
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      if (c === '"') {
        if (inQ && line[j + 1] === '"') {
          cell += '"';
          j++;
        } else {
          inQ = !inQ;
        }
      } else if (c === ',' && !inQ) {
        cells.push(cell.trim());
        cell = '';
      } else {
        cell += c;
      }
    }
    cells.push(cell.trim());
    return cells;
  };

  const headers = parseRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const results: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseRow(lines[i]);
    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = values[idx] || '';
    });
    results.push(obj);
  }
  return results;
}

/** Browser = online only. The offline counter runs only inside the installed desktop / Android app. */
export default function OfflinePosPage() {
  const [native, setNative] = React.useState<boolean | null>(null);
  React.useEffect(() => { setNative(isNativeApp()); }, []);
  if (native === null) return null;
  if (!native) return <DownloadAppGate reason="offline-billing" />;
  return <OfflinePosApp />;
}

function OfflinePosApp() {
  const router = useRouter();

  // Multi-tenant workspaces state
  const [workspaces, setWorkspaces] = React.useState<WorkspaceItem[]>([]);
  const [activeTenantId, setActiveTenantId] = React.useState<string>('default');
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = React.useState(false);

  // Business Profile / Shop state
  const [shop, setShop] = React.useState<Shop>({
    name: 'Enterprise Store',
    phone: '+91 96007 32162',
    address: '100 Innovation Boulevard, Bengaluru',
    gstin: '29ABCDE1234F1Z5',
    businessType: 'Retail & E-Commerce',
  });
  const industry = React.useMemo(() => getIndustryProfile(shop.businessType), [shop.businessType]);

  // POS Inventory, Cart & Sales
  const [products, setProducts] = React.useState<Product[]>([]);
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [websiteOrders, setWebsiteOrders] = React.useState<any[]>([]);
  const [orderBookTab, setOrderBookTab] = React.useState<OrderBookTab>('all');
  const [orderSearch, setOrderSearch] = React.useState('');
  const [reminders, setReminders] = React.useState<PosReminder[]>([]);
  const [reminderTitle, setReminderTitle] = React.useState('');
  const [reminderDate, setReminderDate] = React.useState('');
  const [reminderNote, setReminderNote] = React.useState('');
  const [cart, setCart] = React.useState<LineItem[]>([]);
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState('All items');
  const [tab, setTab] = React.useState<'dashboard' | 'billing' | 'sales' | 'products' | 'settings' | 'help'>('dashboard');

  // Fast Checkout form fields
  const [customer, setCustomer] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [note, setNote] = React.useState('');
  const [pickup, setPickup] = React.useState('');
  const [orderType, setOrderType] = React.useState('Counter sale');
  const [tableNumber, setTableNumber] = React.useState('');
  const [customerState, setCustomerState] = React.useState('');
  const [customerGstin, setCustomerGstin] = React.useState('');
  const [customerAddress, setCustomerAddress] = React.useState('');
  const [showExtraBillFields, setShowExtraBillFields] = React.useState(false);
  const [method, setMethod] = React.useState('UPI');
  const [discount, setDiscount] = React.useState(0);
  const [taxEnabled, setTaxEnabled] = React.useState(true);
  const [taxRate, setTaxRate] = React.useState(5);

  // App Health & Telemetry
  const [online, setOnline] = React.useState(true);
  const [posSessionMode, setPosSessionMode] = React.useState<'online' | 'offline' | null>(null);
  const [ready, setReady] = React.useState(false);
  const [loadedTenantId, setLoadedTenantId] = React.useState<string | null>(null);
  const [authReady, setAuthReady] = React.useState(false);
  const { toasts, notify, dismiss: dismissToast, legacyToast: setToast } = useToasts();
  const [auditLog, setAuditLog] = React.useState<AuditEntry[]>([]);
  const [auditFilter, setAuditFilter] = React.useState<'all' | 'sale' | 'sync' | 'stock' | 'settings'>('all');
  const [showTemplatePreview, setShowTemplatePreview] = React.useState(false);
  const [mobileMenu, setMobileMenu] = React.useState(false);
  const [mobileCartOpen, setMobileCartOpen] = React.useState(false);
  const [storageMode, setStorageMode] = React.useState<OfflineStorageMode>('indexeddb');
  const [storagePersistence, setStoragePersistence] = React.useState<StoragePersistence | 'checking'>('checking');
  const [installEnvironment, setInstallEnvironment] = React.useState<'checking' | 'installed' | 'ios-browser' | 'browser'>('checking');
  const [installPrompt, setInstallPrompt] = React.useState<(Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }) | null>(null);
  const [calculatorOpen, setCalculatorOpen] = React.useState(false);
  const [calculatorDisplay, setCalculatorDisplay] = React.useState('0');
  const [calculatorAccumulator, setCalculatorAccumulator] = React.useState<number | null>(null);
  const [calculatorOperator, setCalculatorOperator] = React.useState<string | null>(null);
  const [calculatorReplaceDisplay, setCalculatorReplaceDisplay] = React.useState(false);
  const [calculatorHistory, setCalculatorHistory] = React.useState('');
  const saleInProgress = React.useRef(false);
  const tenantLoadGeneration = React.useRef(0);
  const [savingSale, setSavingSale] = React.useState(false);
  const [syncingSales, setSyncingSales] = React.useState(false);
  const [syncMessage, setSyncMessage] = React.useState('Bills sync to the cloud on their own whenever you’re online.');
  const [lastSyncedAt, setLastSyncedAt] = React.useState<string | null>(null);
  const [lastBackupAt, setLastBackupAt] = React.useState<string | null>(null);
  const [desktopPaths, setDesktopPaths] = React.useState<DesktopPaths | null>(null);
  const [account, setAccount] = React.useState<{ email?: string; name?: string; mode?: string } | null>(null);
  const [syncAttempt, setSyncAttempt] = React.useState(0);

  // Modals state
  const [addProductModalOpen, setAddProductModalOpen] = React.useState(false);
  const [importExcelModalOpen, setImportExcelModalOpen] = React.useState(false);
  const [completedSale, setCompletedSale] = React.useState<Sale | null>(null);
  const [invoiceTemplate, setInvoiceTemplate] = React.useState<InvoiceTemplateId>('thermal');
  const [paperWidth, setPaperWidth] = React.useState<ThermalPaperWidth>('80mm');
  const [autoPrintOnComplete, setAutoPrintOnComplete] = React.useState<'none' | 'bill' | 'kot-and-bill'>('none');
  const [vaultEncrypted, setVaultEncrypted] = React.useState(false);
  const [hasCounterPin, setHasCounterPin] = React.useState(false);
  const [counterLocked, setCounterLocked] = React.useState(false);
  const [pinInput, setPinInput] = React.useState('');
  const [pinError, setPinError] = React.useState('');
  const [newPinInput, setNewPinInput] = React.useState('');

  React.useEffect(() => {
    setVaultEncrypted(isOfflineVaultEncrypted());
    setHasCounterPin(Boolean(getOfflinePinHash(activeTenantId)));
  }, [activeTenantId]);

  const recentCustomers = React.useMemo(() => {
    const map = new Map<string, { name: string; phone: string; state: string }>();
    sales.forEach(s => {
      const name = s.customer?.trim();
      if (!name || name === 'Walk-in customer') return;
      if (!map.has(name.toLowerCase())) {
        map.set(name.toLowerCase(), { name, phone: s.phone || '', state: s.placeOfSupply || '' });
      }
    });
    return Array.from(map.values()).slice(0, 50);
  }, [sales]);

  React.useEffect(() => {
    try {
      const savedTpl = localStorage.getItem('ollaibooks_invoice_template') as InvoiceTemplateId | null;
      const savedWidth = localStorage.getItem('ollaibooks_paper_width') as ThermalPaperWidth | null;
      const savedAuto = localStorage.getItem('ollaibooks_auto_print') as 'none' | 'bill' | 'kot-and-bill' | null;
      if (savedTpl === 'thermal' || savedTpl === 'classic-gst' || savedTpl === 'modern-gst') setInvoiceTemplate(savedTpl);
      if (savedWidth === '80mm' || savedWidth === '58mm') setPaperWidth(savedWidth);
      if (savedAuto === 'none' || savedAuto === 'bill' || savedAuto === 'kot-and-bill') setAutoPrintOnComplete(savedAuto);
    } catch { /* ignore storage errors */ }
  }, []);

  React.useEffect(() => {
    try {
      localStorage.setItem('ollaibooks_invoice_template', invoiceTemplate);
      localStorage.setItem('ollaibooks_paper_width', paperWidth);
      localStorage.setItem('ollaibooks_auto_print', autoPrintOnComplete);
    } catch { /* ignore storage errors */ }
  }, [invoiceTemplate, paperWidth, autoPrintOnComplete]);

  // New product form inputs
  const [newProdName, setNewProdName] = React.useState('');
  const [newProdCategory, setNewProdCategory] = React.useState('General');
  const [newProdPrice, setNewProdPrice] = React.useState<number | ''>('');
  const [newProdStock, setNewProdStock] = React.useState<number | ''>(50);
  const [newProdTracksStock, setNewProdTracksStock] = React.useState(true);
  const [newProdHsn, setNewProdHsn] = React.useState('');
  const [newProdEmoji, setNewProdEmoji] = React.useState('icon:package');
  const [newProdUnit, setNewProdUnit] = React.useState('pcs');
  const [newProdPurchaseDate, setNewProdPurchaseDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [newProdPurchasePrice, setNewProdPurchasePrice] = React.useState<number | ''>('');
  const [newProdWeight, setNewProdWeight] = React.useState('');
  const [newProdExtra, setNewProdExtra] = React.useState('');
  const [newProdBill, setNewProdBill] = React.useState<Product['purchaseBill']>();
  const [editingProductId, setEditingProductId] = React.useState<string | null>(null);
  const [stockModalProduct, setStockModalProduct] = React.useState<Product | null>(null);
  const [stockDirection, setStockDirection] = React.useState<'IN' | 'OUT'>('IN');
  const [stockChange, setStockChange] = React.useState<number | ''>('');
  const [stockReason, setStockReason] = React.useState('Purchase / restock');

  // 1. Initial Authentication & Multi-Tenant Detection
  React.useEffect(() => {
    try {
      const storedWorkspacesStr = sessionStorage.getItem('billpilot_workspaces');
      const storedActiveId = sessionStorage.getItem('billpilot_active_tenant_id');

      if (storedWorkspacesStr) {
        const parsed = JSON.parse(storedWorkspacesStr);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWorkspaces(parsed);
          const activeId = storedActiveId || parsed[0].tenantId;
          setActiveTenantId(activeId);
          const activeWp = parsed.find((w: any) => w.tenantId === activeId) || parsed[0];
          setShop(prev => ({ ...prev, name: activeWp.tenantName || prev.name }));
        }
      }
    } catch {
      // Keep defaults
    }

    const mode = getPosSessionMode();
    setPosSessionMode(mode);
    if (!mode) {
      router.replace('/login?next=%2Foffline-pos');
      return;
    }
    if (mode === 'offline') {
      setAuthReady(true);
    } else {
      if (!navigator.onLine) {
        clearPosSession();
        router.replace('/login?next=%2Foffline-pos');
        return;
      }
      ApiClient.get('/auth/me')
        .then(() => setAuthReady(true))
        .catch(() => {
          clearPosSession();
          router.replace('/login?next=%2Foffline-pos');
        });
    }

    const checkConnectivity = async () => {
      if (!navigator.onLine) {
        setOnline(false);
        return;
      }
      try {
        const base = process.env.NEXT_PUBLIC_API_URL || '/api/v1';
        const res = await fetch(`${base}/health`, {
          method: 'GET',
          cache: 'no-store',
          signal: AbortSignal.timeout(3500),
        });
        setOnline(res.status < 500);
      } catch {
        setOnline(false);
      }
    };

    void checkConnectivity();
    const onOnline = () => { void checkConnectivity(); };
    const onOffline = () => setOnline(false);
    const probeTimer = window.setInterval(() => { void checkConnectivity(); }, 15000);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.clearInterval(probeTimer);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [router]);

  React.useEffect(() => {
    if (!authReady) return;
    let active = true;
    requestPersistentStorage().then(status => {
      if (active) setStoragePersistence(status);
    });
    return () => { active = false; };
  }, [authReady]);

  React.useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
    const platform = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform || navigator.platform || '';
    const isIos = /iPhone|iPad|iPod/i.test(navigator.userAgent)
      || (platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setInstallEnvironment(isStandalone ? 'installed' : isIos ? 'ios-browser' : 'browser');
  }, []);

  React.useEffect(() => {
    const handleInstallAvailable = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> });
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setInstallEnvironment('installed');
      setToast('ollaiBooks is installed on this device.');
    };
    window.addEventListener('beforeinstallprompt', handleInstallAvailable);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallAvailable);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  React.useEffect(() => {
    setOrderType(industry.orderTypes[0] || 'Counter sale');
    setTableNumber('');
  }, [industry.key]);

  // 2. Load Tenant-specific Offline Data from IndexedDB. Never filter or rewrite
  // user records here: names can match sample data and must still be preserved.
  const loadTenantData = React.useCallback(async (tenantId: string) => {
    const generation = ++tenantLoadGeneration.current;
    setReady(false);
    setLoadedTenantId(null);
    try {
      const { data, mode } = await loadOfflinePosData(tenantId);
      if (generation !== tenantLoadGeneration.current) return;
      const storedProducts = Array.isArray(data?.products) ? data.products as Product[] : [];
      setProducts(storedProducts);

      if (Array.isArray(data?.sales)) {
        setSales(data.sales as Sale[]);
      } else {
        setSales([]);
      }

      const workspace = workspaces.find(item => item.tenantId === tenantId);
      setShop({
        name: workspace?.tenantName || 'Enterprise Store', phone: '', address: '', gstin: '', businessType: 'Retail & E-Commerce',
        ...(data?.shop as Partial<Shop> | undefined),
      });

      if (typeof data?.taxEnabled === 'boolean') setTaxEnabled(data.taxEnabled);
      if (typeof data?.taxRate === 'number') setTaxRate(data.taxRate);
      setAuditLog(Array.isArray(data?.auditLog) ? data.auditLog as AuditEntry[] : []);
      setLastSyncedAt(typeof data?.lastSyncedAt === 'string' ? data.lastSyncedAt : null);
      setLastBackupAt(typeof data?.lastBackupAt === 'string' ? data.lastBackupAt : null);

      setStorageMode(mode);
      setLoadedTenantId(tenantId);
      setReady(true);
    } catch {
      if (generation !== tenantLoadGeneration.current) return;
      setStorageMode('localStorage');
      setReady(false);
      notify('warning', 'Using backup storage', 'This browser blocked the secure database, so bills are kept in simpler local storage. Export a backup regularly.');
    }
  }, [workspaces, notify]);

  const auditActor = posSessionMode === 'offline' ? 'Counter · offline login' : 'Counter · online login';
  const recordAudit = React.useCallback((action: AuditAction, summary: string, extra?: { ref?: string; amount?: number }) => {
    setAuditLog(log => appendAudit(log, { action, summary, actor: auditActor, ...extra }));
  }, [auditActor]);

  React.useEffect(() => {
    if (activeTenantId) {
      loadTenantData(activeTenantId);
    }
  }, [activeTenantId, loadTenantData]);

  // 3. Auto-save State to IndexedDB on Changes
  React.useEffect(() => {
    if (!ready || !activeTenantId || loadedTenantId !== activeTenantId) return;
    saveOfflinePosData({ products, sales, shop, taxEnabled, taxRate, auditLog, lastSyncedAt, lastBackupAt }, activeTenantId)
      .then(mode => setStorageMode(mode))
      .catch(error => notify('error', 'Device storage is full', error instanceof Error ? error.message : 'Free up space or export a backup so no bill is lost.'));
  }, [products, sales, shop, taxEnabled, taxRate, auditLog, lastSyncedAt, lastBackupAt, ready, loadedTenantId, activeTenantId, notify]);

  // Record settings edits in the audit trail (debounced so typing doesn't flood the log)
  const settingsSnapshot = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!ready || loadedTenantId !== activeTenantId) { settingsSnapshot.current = null; return; }
    const { logo: _logo, ...rest } = shop;
    const snapshot = JSON.stringify({ rest, taxEnabled, taxRate });
    if (settingsSnapshot.current === null) { settingsSnapshot.current = snapshot; return; }
    if (settingsSnapshot.current === snapshot) return;
    const timer = window.setTimeout(() => {
      settingsSnapshot.current = snapshot;
      recordAudit('settings.updated', `Store / tax settings updated (GST ${taxEnabled ? `${taxRate}%` : 'off'})`);
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [shop, taxEnabled, taxRate, ready, loadedTenantId, activeTenantId, recordAudit]);

  // Older versions mirrored bills in plain-text localStorage; the encrypted vault is now the only copy.
  React.useEffect(() => { clearOfflineCache('shop-orders'); }, [activeTenantId]);

  // Friendly network status toasts + audit entries when the connection changes
  const previousOnline = React.useRef<boolean | null>(null);
  React.useEffect(() => {
    if (!ready) return;
    if (previousOnline.current === null) {
      previousOnline.current = online;
      return;
    }
    if (previousOnline.current === online) return;
    previousOnline.current = online;
    if (online) {
      notify('success', 'You’re back online', 'Waiting bills will now sync to your cloud workspace on their own.');
      recordAudit('network.online', 'Internet connection restored');
    } else {
      notify('offline', 'You’re offline — keep billing', 'Nothing stops. Every bill is saved and encrypted on this device and syncs once you’re back online.');
      recordAudit('network.offline', 'Internet connection lost; counter continues offline');
    }
  }, [online, ready, notify, recordAudit]);

  /**
   * Website orders: when online we download the latest 100 orders from the API
   * and keep an AES-encrypted copy on this device, so the order book (and KOT
   * printing) still works offline. Offline, we show that last saved copy.
   */
  const [websiteOrdersSavedAt, setWebsiteOrdersSavedAt] = React.useState<string | null>(null);
  const refreshWebsiteOrders = React.useCallback(async () => {
    const tenantId = activeTenantId;
    try {
      const data = await ApiClient.get<any>('/orders?limit=100');
      const items = Array.isArray(data?.items) ? data.items : [];
      const savedAt = new Date().toISOString();
      setWebsiteOrders(items);
      setWebsiteOrdersSavedAt(savedAt);
      await saveEncryptedCache('website-orders', { items, savedAt }, tenantId);
      clearOfflineCache('orders');
    } catch {
      const cached = await loadEncryptedCache<{ items: any[]; savedAt: string } | null>('website-orders', null, tenantId);
      if (cached) {
        setWebsiteOrders(cached.items || []);
        setWebsiteOrdersSavedAt(cached.savedAt || null);
      } else {
        // One-time migration from the old plain-text cache
        const legacy = getOfflineCache<any[]>('orders', []);
        setWebsiteOrders(legacy);
        if (legacy.length) {
          await saveEncryptedCache('website-orders', { items: legacy, savedAt: new Date().toISOString() }, tenantId).catch(() => undefined);
          clearOfflineCache('orders');
        }
      }
    }
  }, [activeTenantId]);

  React.useEffect(() => {
    if (ready && loadedTenantId === activeTenantId) void refreshWebsiteOrders();
  }, [ready, loadedTenantId, activeTenantId, refreshWebsiteOrders]);

  React.useEffect(() => {
    setReminders(getOfflineCache<PosReminder[]>('pos-calendar', []));
  }, [activeTenantId]);

  React.useEffect(() => {
    if (ready && loadedTenantId === activeTenantId) setOfflineCache('pos-calendar', reminders);
  }, [reminders, ready, loadedTenantId, activeTenantId]);

  React.useEffect(() => {
    const refreshOnReconnect = () => { void refreshWebsiteOrders(); };
    window.addEventListener('online', refreshOnReconnect);
    return () => window.removeEventListener('online', refreshOnReconnect);
  }, [refreshWebsiteOrders]);

  // Switch Active Workspace
  const handleSwitchWorkspace = (targetTenantId: string) => {
    setWorkspaceMenuOpen(false);
    if (targetTenantId === activeTenantId) return;

    setActiveTenantId(targetTenantId);
    sessionStorage.setItem('billpilot_active_tenant_id', targetTenantId);
    const targetWp = workspaces.find(w => w.tenantId === targetTenantId);
    setCart([]);
    setReady(false);
    notify('info', `Switched to ${targetWp?.tenantName || 'new store'}`, 'Each store keeps its own bills, stock and settings on this device.');
  };

  // Dynamic Categories from Products
  const activeProducts = React.useMemo(() => products.filter(product => !product.isArchived), [products]);

  const categories = React.useMemo(() => {
    const list = Array.from(new Set(activeProducts.map(p => p.category).filter(Boolean)));
    return ['All items', ...list];
  }, [activeProducts]);

  const filteredProducts = React.useMemo(() => {
    return activeProducts.filter(p => {
      const matchCat = category === 'All items' || p.category.toLowerCase() === category.toLowerCase();
      const matchQuery = p.name.toLowerCase().includes(query.toLowerCase()) || (p.hsn && p.hsn.includes(query));
      return matchCat && matchQuery;
    });
  }, [activeProducts, category, query]);

  const [nativeModalOpen, setNativeModalOpen] = React.useState(false);
  const [activePlatformTab, setActivePlatformTab] = React.useState<'android' | 'windows' | 'mac' | 'ios'>('android');
  const [nativeDownloads, setNativeDownloads] = React.useState<{
    release: { name: string; url: string } | null;
    downloads: Partial<Record<'windows' | 'mac' | 'android', { name: string; url: string }>>;
    unavailable?: boolean;
  } | null>(null);

  React.useEffect(() => {
    if (!nativeModalOpen || nativeDownloads) return;
    fetch('/api/native-downloads')
      .then(response => response.ok ? response.json() : Promise.reject(new Error('Release lookup failed')))
      .then(setNativeDownloads)
      .catch(() => setNativeDownloads({ release: null, downloads: {}, unavailable: true }));
  }, [nativeModalOpen, nativeDownloads]);

  const triggerDirectInstall = async () => {
    if (!installPrompt) {
      setToast('This browser does not offer one-click install. Use the browser’s Install app option, or Safari Share → Add to Home Screen on iPhone/iPad.');
      return;
    }
    try {
      await installPrompt.prompt();
      const choice = await installPrompt.userChoice;
      setInstallPrompt(null);
      setToast(choice.outcome === 'accepted' ? 'ollaiBooks app installation started.' : 'Installation dismissed.');
    } catch {
      setToast('The browser could not start installation. Try its Install app option.');
    }
  };

  // Mathematical Totals & Offline GST State Detection
  const resolvedShopState = React.useMemo(
    () => (shop.state ? detectGstState(shop.state) : null) || detectGstState(shop.gstin) || detectGstState(shop.address),
    [shop],
  );
  const customerGstinClean = customerGstin.trim().toUpperCase();
  const customerGstinValid = !customerGstinClean || GSTIN_PATTERN.test(customerGstinClean);
  const resolvedCustomerState = React.useMemo(
    () => (customerState
      ? detectGstState(customerState)
      : (customerGstinClean && GSTIN_PATTERN.test(customerGstinClean) ? detectGstState(customerGstinClean) : resolvedShopState)),
    [customerState, customerGstinClean, resolvedShopState],
  );
  const isInterstateSale = React.useMemo(
    () => isInterstateGst(
      shop.state || shop.gstin || shop.address,
      customerState || (GSTIN_PATTERN.test(customerGstinClean) ? customerGstinClean : undefined),
      shop.gstin,
    ),
    [shop, customerState, customerGstinClean],
  );
  const subtotal = roundMoney(cart.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const discountAmount = Math.min(subtotal, roundMoney(Math.max(0, discount)));
  const taxable = roundMoney(subtotal - discountAmount);
  const gst = taxEnabled ? roundMoney(taxable * taxRate / 100) : 0;
  const total = roundMoney(taxable + gst);
  const today = new Date().toDateString();
  const todaySales = sales.filter(s => new Date(s.date).toDateString() === today);
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const averageBill = todaySales.length ? todayRevenue / todaySales.length : 0;
  const todayPaymentTotals = React.useMemo(() => todaySales.reduce<Record<string, number>>((totals, sale) => {
    const key = sale.method || 'Other';
    totals[key] = (totals[key] || 0) + sale.paid;
    return totals;
  }, {}), [todaySales]);
  const topSellingItems = React.useMemo(() => {
    const totals = new Map<string, { name: string; quantity: number; revenue: number }>();
    todaySales.forEach(sale => sale.items.forEach(item => {
      const existing = totals.get(item.productId) || { name: item.name, quantity: 0, revenue: 0 };
      existing.quantity += item.quantity;
      existing.revenue += item.quantity * item.price;
      totals.set(item.productId, existing);
    }));
    return Array.from(totals.values()).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
  }, [todaySales]);
  const pendingCount = sales.filter(s => s.sync === 'pending').length;
  const pendingSales = React.useMemo(() => sales.filter(sale => sale.sync === 'pending'), [sales]);
  const syncPendingSales = React.useCallback(async (manual = false) => {
    if (syncingSales || !online || !authReady || !ready || loadedTenantId !== activeTenantId || posSessionMode !== 'online' || !pendingSales.length) return;
    const tenantId = activeTenantId;
    setSyncingSales(true);
    try {
      const result = await ApiClient.post<{ syncedIds: string[] }>('/offline-pos/sync', {
        sales: pendingSales.slice(0, 100).map(sale => ({ id: sale.id, sale, updatedAt: sale.date })),
      });
      if (sessionStorage.getItem('billpilot_active_tenant_id') !== tenantId) return;
      const syncedIds = new Set(result.syncedIds || []);
      if (syncedIds.size) {
        const at = new Date().toISOString();
        setSales(current => current.map(sale => syncedIds.has(sale.id) ? { ...sale, sync: 'synced', syncedAt: at } : sale));
        setLastSyncedAt(at);
        setSyncMessage(`${syncedIds.size} bill${syncedIds.size === 1 ? '' : 's'} safely copied to your cloud workspace.`);
        recordAudit('sync.success', `${syncedIds.size} bill${syncedIds.size === 1 ? '' : 's'} synced to cloud`);
        if (manual) notify('success', 'All caught up', `${syncedIds.size} bill${syncedIds.size === 1 ? ' is' : 's are'} now in your cloud workspace.`);
      } else if (manual) {
        notify('warning', 'Nothing was accepted', 'The server didn’t confirm any bills. They stay safe here and we’ll retry.');
      }
      setSyncAttempt(0);
    } catch {
      setSyncMessage('Couldn’t reach the cloud just now. Your bills are safe on this device — we’ll retry shortly.');
      if (manual || syncAttempt === 0) recordAudit('sync.failed', `Sync attempt failed for ${pendingSales.length} bill(s)`);
      if (manual) notify('error', 'Sync didn’t go through', 'Your bills are still saved on this device. We’ll keep retrying automatically.');
      setSyncAttempt(current => current + 1);
    } finally {
      setSyncingSales(false);
    }
  }, [syncingSales, online, authReady, ready, loadedTenantId, activeTenantId, posSessionMode, pendingSales, syncAttempt, recordAudit, notify]);

  /** User clicked "Sync" — always explain what happens, especially when offline. */
  const requestSync = () => {
    if (!online) {
      notify(
        'offline',
        'You’re offline right now',
        pendingCount
          ? `${pendingCount} bill${pendingCount === 1 ? ' is' : 's are'} safely saved and encrypted on this device. We’ll sync ${pendingCount === 1 ? 'it' : 'them'} automatically as soon as the internet is back.`
          : 'All your bills are already synced. New bills will be saved here and synced when you reconnect.',
        { duration: 7000 },
      );
      recordAudit('sync.blocked_offline', `Sync requested while offline (${pendingCount} waiting)`);
      return;
    }
    if (posSessionMode === 'offline') {
      notify('warning', 'Signed in with offline login', 'To send bills to the cloud, sign in once with internet. Your bills stay safe here till then.', {
        duration: 7000,
        action: { label: 'Sign in online', onClick: () => { clearPosSession(); router.replace('/login?next=%2Foffline-pos'); } },
      });
      recordAudit('sync.blocked_offline', 'Sync requested in offline-login session');
      return;
    }
    if (!pendingCount) {
      notify('success', 'Everything is synced', lastSyncedAt ? `Last synced ${new Date(lastSyncedAt).toLocaleString('en-IN')}.` : 'There are no bills waiting to sync.');
      return;
    }
    if (syncingSales) {
      notify('sync', 'Sync already running', 'Hang on — we’re sending your bills right now.');
      return;
    }
    notify('sync', `Syncing ${pendingCount} bill${pendingCount === 1 ? '' : 's'}…`, 'You can keep billing while this runs.', { duration: 2500 });
    void syncPendingSales(true);
  };

  React.useEffect(() => {
    if (!online || !authReady || !ready || loadedTenantId !== activeTenantId || posSessionMode !== 'online' || pendingCount === 0) return;
    const delay = Math.min(30000, syncAttempt === 0 ? 1000 : 1000 * 2 ** Math.min(syncAttempt, 5));
    const timer = window.setTimeout(() => { void syncPendingSales(); }, delay);
    return () => window.clearTimeout(timer);
  }, [online, authReady, ready, loadedTenantId, activeTenantId, posSessionMode, pendingCount, syncAttempt, syncPendingSales]);

  const orderBook = React.useMemo(() => buildOrderBook(sales, websiteOrders), [sales, websiteOrders]);
  const visibleOrderBook = React.useMemo(() => filterOrderBook(orderBook, { tab: orderBookTab, query: orderSearch }), [orderBook, orderBookTab, orderSearch]);
  const todayWebsiteOrders = websiteOrders.filter(order => new Date(order.orderDate || order.createdAt || 0).toDateString() === today);
  const lowStockProducts = React.useMemo(() => activeProducts.filter(product => product.tracksStock !== false && product.stock <= (product.stockUnit?.toLowerCase() === 'kg' ? 2 : 5)).sort((a, b) => a.stock - b.stock), [activeProducts]);
  const upcomingReminders = React.useMemo(() => reminders.filter(reminder => new Date(reminder.startsAt).getTime() >= Date.now()).sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 6), [reminders]);

  const calculate = (left: number, right: number, operator: string) => {
    if (operator === '+') return left + right;
    if (operator === '−') return left - right;
    if (operator === '×') return left * right;
    if (operator === '÷') return right === 0 ? NaN : left / right;
    return right;
  };

  const calculatorPress = (key: string) => {
    if (/^\d$/.test(key) || key === '.' || key === '00') {
      setCalculatorDisplay(current => {
        const value = calculatorReplaceDisplay ? '' : current;
        if (key === '.' && value.includes('.')) return value || '0';
        if (key === '.' && (!value || value === '0')) return '0.';
        if (key === '00') return !value || value === '0' ? '0' : `${value}00`;
        return `${value === '0' ? '' : value}${key}` || '0';
      });
      setCalculatorReplaceDisplay(false);
      if (calculatorAccumulator === null && calculatorHistory) setCalculatorHistory('');
      return;
    }
    if (key === 'C') {
      setCalculatorDisplay('0');
      setCalculatorAccumulator(null);
      setCalculatorOperator(null);
      setCalculatorReplaceDisplay(false);
      setCalculatorHistory('');
      return;
    }
    if (key === '⌫') {
      if (calculatorReplaceDisplay) return;
      setCalculatorDisplay(current => current.length > 1 ? current.slice(0, -1) : '0');
      return;
    }
    const current = Number(calculatorDisplay);
    if (!Number.isFinite(current)) return;
    if (key === '%') {
      const pct = calculatorAccumulator !== null && calculatorOperator
        ? (calculatorAccumulator * current) / 100
        : current / 100;
      setCalculatorDisplay(Number.isFinite(pct) ? String(Number(pct.toFixed(8))) : 'Error');
      setCalculatorReplaceDisplay(false);
      return;
    }
    if (key === '=') {
      if (calculatorAccumulator === null || !calculatorOperator) return;
      const result = calculate(calculatorAccumulator, current, calculatorOperator);
      setCalculatorHistory(`${calculatorAccumulator} ${calculatorOperator} ${current} =`);
      setCalculatorDisplay(Number.isFinite(result) ? String(Number(result.toFixed(8))) : 'Error');
      setCalculatorAccumulator(null);
      setCalculatorOperator(null);
      setCalculatorReplaceDisplay(true);
      return;
    }
    if (calculatorAccumulator !== null && calculatorOperator && !calculatorReplaceDisplay) {
      const result = calculate(calculatorAccumulator, current, calculatorOperator);
      if (!Number.isFinite(result)) {
        setCalculatorDisplay('Error');
        setCalculatorAccumulator(null);
        setCalculatorOperator(null);
        setCalculatorReplaceDisplay(true);
        return;
      }
      setCalculatorAccumulator(result);
      setCalculatorDisplay(String(Number(result.toFixed(8))));
    } else {
      setCalculatorAccumulator(current);
    }
    setCalculatorOperator(key);
    setCalculatorReplaceDisplay(true);
  };

  const addReminder = (event: React.FormEvent) => {
    event.preventDefault();
    if (!reminderTitle.trim() || !reminderDate) return;
    setReminders(current => [...current, { id: makeId(), title: reminderTitle.trim(), startsAt: new Date(reminderDate).toISOString(), note: reminderNote.trim() }].sort((a, b) => a.startsAt.localeCompare(b.startsAt)));
    setReminderTitle('');
    setReminderDate('');
    setReminderNote('');
    setToast('Reminder saved on this device.');
  };

  const addToCart = (p: Product) => {
    const step = p.stockUnit?.toLowerCase() === 'kg' ? 0.1 : 1;
    const tracksStock = p.tracksStock !== false;
    if (tracksStock && p.stock <= 0) {
      setToast(`${p.name} is out of stock.`);
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.productId === p.id);
      if (existing) {
        if (tracksStock && existing.quantity + step > p.stock) {
          setToast(`Only ${p.stock} ${p.stockUnit || 'units'} of ${p.name} are in stock.`);
          return prev;
        }
        return prev.map(item => item.productId === p.id ? { ...item, quantity: item.quantity + step } : item);
      }
      return [...prev, { productId: p.id, name: p.name, quantity: tracksStock ? Math.min(step, p.stock) : step, price: p.price, hsn: p.hsn, unit: tracksStock ? (p.stockUnit || 'pcs') : 'svc' }];
    });
  };

  const setQuantity = (id: string, delta: number) => {
    const product = products.find(item => item.id === id);
    const step = product?.stockUnit?.toLowerCase() === 'kg' ? 0.1 : 1;
    setCart(prev => prev.map(item => {
      if (item.productId !== id) return item;
      const nextQuantity = Math.round((item.quantity + delta * step) * 1000) / 1000;
      if (product?.tracksStock !== false && nextQuantity > (product?.stock ?? Infinity)) {
        setToast(`Only ${product?.stock} ${product?.stockUnit || 'units'} are in stock.`);
        return item;
      }
      return { ...item, quantity: nextQuantity };
    }).filter(item => item.quantity > 0));
  };

  // Complete & Save Bill Offline
  const finishSale = async () => {
    if (!cart.length || saleInProgress.current) return;
    if (!customerGstinValid) {
      notify('warning', 'Check the customer GSTIN', 'A GSTIN has 15 characters, like 33ABCDE1234F1Z5. Fix it or leave it empty for a B2C bill.');
      return;
    }
    saleInProgress.current = true;
    setSavingSale(true);
    const date = new Date().toISOString();
    // Unique, consecutive per-day invoice series (GST Rule 46: ≤16 chars, unique per financial year)
    const datePrefix = `INV-${date.slice(2, 10).replaceAll('-', '')}-`;
    const nextSeq = sales.reduce((max, s) => {
      if (!s.number?.startsWith(datePrefix)) return max;
      const seq = Number(s.number.slice(datePrefix.length));
      return Number.isFinite(seq) && seq > max ? seq : max;
    }, 0) + 1;
    const number = `${datePrefix}${String(nextSeq).padStart(3, '0')}`;
    const sale: Sale = {
      id: makeId(),
      number,
      date,
      customer: customer.trim() || 'Walk-in customer',
      phone: phone.trim(),
      items: cart,
      subtotal,
      discount: discountAmount,
      taxRate: taxEnabled ? taxRate : 0,
      gst,
      total,
      paid: total,
      method,
      note: note.trim(),
      pickup,
      orderType,
      ...(industry.key === 'restaurant' && tableNumber.trim() ? { tableNumber: tableNumber.trim() } : {}),
      ...(resolvedCustomerState ? { placeOfSupply: `${resolvedCustomerState.name} (${resolvedCustomerState.code})` } : {}),
      isInterstate: isInterstateSale,
      ...(customerGstinClean ? { customerGstin: customerGstinClean } : {}),
      ...(customerAddress.trim() ? { customerAddress: customerAddress.trim() } : {}),
      sync: 'pending',
    };
    const nextAudit = appendAudit(auditLog, {
      action: 'sale.created',
      summary: `${number} · ${sale.customer} · ${sale.items.length} item${sale.items.length === 1 ? '' : 's'} · ${method}`,
      actor: auditActor,
      ref: number,
      amount: total,
    });

    const nextSales = [sale, ...sales];
    const nextProducts = products.map(p => {
      const line = cart.find(item => item.productId === p.id);
      return line && p.tracksStock !== false ? {
        ...p,
        stock: Math.max(0, p.stock - line.quantity),
        stockMovements: [...(p.stockMovements || []), {
          id: makeId(), date, direction: 'OUT' as const, quantity: line.quantity,
          reason: `Offline sale ${number}`,
        }],
      } : p;
    });

    try {
      const mode = await saveOfflinePosData({ products: nextProducts, sales: nextSales, shop, taxEnabled, taxRate, auditLog: nextAudit, lastSyncedAt, lastBackupAt }, activeTenantId);
      setStorageMode(mode);
    } catch (error) {
      notify('error', 'This bill wasn’t saved', error instanceof Error ? error.message : 'Device storage refused the bill. Free some space and try again.');
      saleInProgress.current = false;
      setSavingSale(false);
      return;
    }

    setSales(nextSales);
    setProducts(nextProducts);
    setAuditLog(nextAudit);
    setCart([]);
    setCustomer('');
    setPhone('');
    setNote('');
    setPickup('');
    setOrderType(industry.orderTypes[0] || 'Counter sale');
    setTableNumber('');
    setCustomerState('');
    setCustomerGstin('');
    setCustomerAddress('');
    setShowExtraBillFields(false);
    setDiscount(0);
    setMobileCartOpen(false);
    setCompletedSale(sale);
    void saveInvoiceToLaptop(sale);
    notify(
      'success',
      `Bill ${number} saved`,
      online && posSessionMode === 'online'
        ? `${money(total)} received via ${method}. Syncing to the cloud in the background.`
        : `${money(total)} received via ${method}. Saved securely on this device — it will sync when you’re back online.`,
    );
    if (autoPrintOnComplete === 'bill') {
      try {
        printInvoiceDocument(sale, shop, { template: invoiceTemplate, paperWidth });
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Allow pop-ups to auto-print bill.');
      }
    } else if (autoPrintOnComplete === 'kot-and-bill') {
      try {
        printKotAndBill(sale, shop, { paperWidth });
      } catch (err) {
        setToast(err instanceof Error ? err.message : 'Allow pop-ups to auto-print KOT & bill.');
      }
    }
    saleInProgress.current = false;
    setSavingSale(false);
  };

  const resetProductForm = () => {
    setEditingProductId(null);
    setNewProdName('');
    setNewProdCategory(industry.key === 'salon' ? 'Services' : industry.key === 'restaurant' ? 'Menu' : industry.key === 'bakery' ? 'Bakery' : 'General');
    setNewProdPrice('');
    setNewProdStock(50);
    setNewProdTracksStock(industry.key !== 'salon');
    setNewProdHsn('');
    setNewProdEmoji('🏷️');
    setNewProdUnit('pcs');
    setNewProdPurchaseDate(new Date().toISOString().slice(0, 10));
    setNewProdPurchasePrice('');
    setNewProdWeight('');
    setNewProdExtra('');
    setNewProdBill(undefined);
  };

  const openEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setNewProdName(product.name);
    setNewProdCategory(product.category);
    setNewProdPrice(product.price);
    setNewProdStock(product.stock);
    setNewProdTracksStock(product.tracksStock !== false);
    setNewProdHsn(product.hsn || '');
    setNewProdEmoji(product.emoji);
    setNewProdUnit(product.stockUnit || 'pcs');
    setNewProdPurchaseDate(product.purchaseDate || '');
    setNewProdPurchasePrice(product.purchasePrice ?? '');
    setNewProdWeight(product.weight || '');
    setNewProdExtra(product.extra || '');
    setNewProdBill(product.purchaseBill);
    setAddProductModalOpen(true);
  };

  // Add or edit products locally, recording any manual stock adjustment in the ledger.
  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || typeof newProdPrice !== 'number' || !Number.isFinite(newProdPrice) || newProdPrice < 0 || (newProdTracksStock && (typeof newProdStock !== 'number' || !Number.isFinite(newProdStock) || newProdStock < 0))) {
      setToast(newProdTracksStock ? 'Enter a name, valid price, and stock quantity.' : 'Enter a service name and valid price.');
      return;
    }

    if (editingProductId) {
      const existing = products.find(product => product.id === editingProductId);
      if (!existing) {
        setToast('This product is no longer in the catalog.');
        setEditingProductId(null);
        return;
      }
      const nextStock = newProdTracksStock ? Number(newProdStock) : existing.stock;
      const stockDifference = newProdTracksStock ? nextStock - existing.stock : 0;
      const stockMovements = [...(existing.stockMovements || [])];
      if (stockDifference !== 0) {
        stockMovements.push({
          id: makeId(), date: new Date().toISOString(), direction: stockDifference > 0 ? 'IN' : 'OUT',
          quantity: Math.abs(stockDifference), reason: 'Stock level changed while editing product',
        });
      }
      const updated: Product = {
        ...existing,
        name: newProdName.trim(),
        category: newProdCategory.trim() || 'General',
        price: Number(newProdPrice),
        stock: nextStock,
        tracksStock: newProdTracksStock,
        hsn: newProdHsn.trim() || undefined,
        emoji: newProdEmoji || '🏷️',
        stockUnit: newProdUnit,
        purchaseDate: newProdPurchaseDate || undefined,
        purchasePrice: Number(newProdPurchasePrice || 0),
        weight: newProdWeight.trim() || undefined,
        extra: newProdExtra.trim() || undefined,
        purchaseBill: newProdBill,
        stockMovements,
      };
      setProducts(current => current.map(product => product.id === updated.id ? updated : product));
      setAddProductModalOpen(false);
      resetProductForm();
      setToast(`Updated ${updated.name}; stock history saved.`);
      recordAudit('product.updated', `${updated.name} edited`);
      return;
    }

    const newProduct: Product = {
      id: makeId(),
      name: newProdName.trim(),
      category: newProdCategory.trim() || 'General',
      price: Number(newProdPrice),
      stock: newProdTracksStock && typeof newProdStock === 'number' ? newProdStock : 0,
      tracksStock: newProdTracksStock,
      emoji: newProdEmoji || '🏷️',
      color: '#f0fdf4',
      hsn: newProdHsn.trim() || undefined,
      stockUnit: newProdUnit,
      purchaseDate: newProdPurchaseDate || undefined,
      purchasePrice: Number(newProdPurchasePrice || 0),
      weight: newProdWeight.trim() || undefined,
      extra: newProdExtra.trim() || undefined,
      ...(newProdBill ? { purchaseBill: newProdBill } : {}),
      stockMovements: newProdTracksStock && newProdStock ? [{
        id: makeId(), date: new Date().toISOString(), direction: 'IN',
        quantity: Number(newProdStock), reason: 'Opening stock',
      }] : [],
    };

    setProducts(prev => [newProduct, ...prev]);
    setAddProductModalOpen(false);
    resetProductForm();
    setToast(`✓ Added product: ${newProduct.name}`);
    recordAudit('product.created', `${newProduct.name} at ${money(newProduct.price)}`);
  };

  const handlePurchaseBillUpload = async (file?: File) => {
    if (!file) { setNewProdBill(undefined); return; }
    if (file.size > 8 * 1024 * 1024) {
      setToast('Purchase bill must be 8 MB or smaller.');
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Could not read bill file.'));
      reader.onerror = () => reject(new Error('Could not read bill file.'));
      reader.readAsDataURL(file);
    });
    setNewProdBill({ name: file.name, type: file.type || 'application/octet-stream', dataUrl });
  };

  const saveStockMovement = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!stockModalProduct || typeof stockChange !== 'number' || !Number.isFinite(stockChange) || stockChange <= 0) {
      setToast('Enter a valid stock quantity greater than zero.');
      return;
    }
    const product = products.find(item => item.id === stockModalProduct.id);
    if (!product) return;
    if (stockDirection === 'OUT' && stockChange > product.stock) {
      setToast(`Cannot remove ${stockChange}; only ${product.stock} ${product.stockUnit || 'units'} are in stock.`);
      return;
    }
    const movement = {
      id: makeId(), date: new Date().toISOString(), direction: stockDirection,
      quantity: stockChange, reason: stockReason.trim() || (stockDirection === 'IN' ? 'Stock received' : 'Manual stock adjustment'),
    };
    const nextProducts = products.map(item => item.id === product.id ? {
      ...item,
      stock: Math.max(0, item.stock + (stockDirection === 'IN' ? stockChange : -stockChange)),
      stockMovements: [...(item.stockMovements || []), movement],
    } : item);
    try {
      const mode = await saveOfflinePosData({ products: nextProducts, sales, shop, taxEnabled, taxRate }, activeTenantId);
      setStorageMode(mode);
      setProducts(nextProducts);
      setToast(`${stockDirection === 'IN' ? 'Stock received' : 'Stock removed'} · ${product.name}: ${stockChange} ${product.stockUnit || 'units'}`);
      recordAudit('stock.moved', `${stockDirection} ${stockChange} ${product.stockUnit || 'units'} · ${product.name} · ${stockReason.trim() || 'manual'}`);
      setStockModalProduct(null);
      setStockChange('');
      setStockReason('Purchase / restock');
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Could not save stock movement.');
    }
  };

  // Download Helper
  const download = (filename: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Export Sales Report to CSV (Excel / Sheets)
  const exportSales = () => {
    const header = [
      'Invoice no.', 'Date (ISO)', 'Customer', 'Phone', 'Items Breakdown',
      'Subtotal (INR)', 'Discount (INR)', 'GST Rate (%)', 'GST Amount (INR)',
      'Grand Total (INR)', 'Amount Paid (INR)', 'Payment Method', 'Order Type', 'Table', 'Pickup / Appointment', 'Notes', 'Sync Status'
    ];
    const rows = sales.map(s => [
      s.number, s.date, s.customer, s.phone,
      s.items.map(i => `${i.name} (Qty ${i.quantity} @ ₹${i.price})`).join('; '),
      s.subtotal, s.discount, s.taxRate, s.gst, s.total, s.paid, s.method, s.orderType || '', s.tableNumber || '', s.pickup || '', s.note, s.sync
    ]);
    const csv = [header, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
    download(`ollaibooks-sales-${activeTenantId}-${new Date().toISOString().slice(0, 10)}.csv`, `\uFEFF${csv}`, 'text/csv;charset=utf-8');
    setToast('Sales CSV exported for Excel / Google Sheets');
  };

  // Export Product Catalog to CSV
  const exportProductsCatalog = () => {
    const header = ['Name', 'Category', 'Selling Price (INR)', 'In Stock', 'Unit', 'Purchase Date', 'Purchase Cost (INR)', 'Weight / Pack Size', 'Extra Details', 'HSN / SAC Code', 'Purchase Bill'];
    const rows = products.map(p => [p.name, p.category, p.price, p.stock, p.stockUnit || 'pcs', p.purchaseDate || '', p.purchasePrice || 0, p.weight || '', p.extra || '', p.hsn || '', p.purchaseBill?.name || '']);
    const csv = [header, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
    download(`ollaibooks-catalog-${activeTenantId}-${new Date().toISOString().slice(0, 10)}.csv`, `\uFEFF${csv}`, 'text/csv;charset=utf-8');
    setToast('Products catalogue exported to CSV');
  };

  // Download Sample Products Template for Excel
  const downloadSampleTemplate = () => {
    const sampleCsv = `Name,Category,Price,Stock,Unit,Purchase Date,Purchase Price,Weight,Extra,HSN
Wireless Bluetooth Mouse,Electronics,799,35,pcs,2026-11-20,480,120 g,2.4GHz + BT 5.0,847160
USB-C Fast Charger 30W,Electronics,1199,24,pcs,2026-11-20,720,95 g,PD 3.0 Wall Adapter,850440
Cotton Crew Neck T-Shirt (M),Apparel,499,60,pcs,2026-11-18,260,220 g,100% Combed Cotton,610910
Denim Slim Fit Jeans (32),Apparel,1499,18,pcs,2026-11-18,850,540 g,Indigo Stretch,620342
Premium Basmati Rice,Grocery,680,40,bag,2026-11-22,510,5 kg,Aged Long Grain,100630
Cold Pressed Groundnut Oil,Grocery,240,55,ltr,2026-11-22,185,1 L,Wood Pressed,150890
Stainless Steel Water Bottle,Home & Kitchen,549,30,pcs,2026-11-19,310,1 L,Double Wall Insulated,732393
A4 Printing Paper Ream (500 Sheets),Stationery,320,75,pack,2026-11-21,235,2.5 kg,75 GSM Bright White,480256
Device Screen Guard Installation,Services,299,999,service,2026-11-25,80,Standard,Tempered Glass + Fit,998719`;
    download('ollaibooks-products-sample.csv', `\uFEFF${sampleCsv}`, 'text/csv;charset=utf-8');
    setToast('Sample multi-tenant CSV template downloaded');
  };

  // Import Products from Excel / CSV
  const handleImportExcel = async (file?: File) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsedRows = parseCsv(text);
      if (!parsedRows.length) {
        throw new Error('No valid product rows found in the CSV spreadsheet.');
      }

      const importedProducts: Product[] = [];
      for (const row of parsedRows) {
        const name = row.name || row.product || row.productname || row.item || row.itemname || row.title;
        if (!name || !name.trim()) continue;

        const price = Number(row.price || row.sellingprice || row.rate || row.unitprice || row.mrp || 0);
        const stock = Number(row.stock || row.qty || row.quantity || row.count || 50);
        const category = row.category || row.cat || row.type || 'General';
        const hsn = row.hsn || row.hsncode || row.sac || undefined;
        const unit = row.unit || row.stockunit || row.sellingunit || 'pcs';
        const purchaseDate = row.purchasedate || row.dateofpurchase || undefined;
        const purchasePrice = Number(row.purchaseprice || row.costprice || row.cost || 0);
        const weight = row.weight || row.packsize || row.weightpacksize || undefined;
        const extra = row.extra || row.extradetails || row.notes || undefined;

        importedProducts.push({
          id: makeId(),
          name: name.trim(),
          category: category.trim(),
          price: isNaN(price) ? 100 : price,
          stock: isNaN(stock) ? 50 : stock,
          emoji: 'icon:package',
          color: '#f0f9ff',
          hsn: hsn ? String(hsn).trim() : undefined,
          stockUnit: String(unit).trim() || 'pcs',
          purchaseDate: purchaseDate ? String(purchaseDate).trim() : undefined,
          purchasePrice: Number.isFinite(purchasePrice) ? purchasePrice : 0,
          weight: weight ? String(weight).trim() : undefined,
          extra: extra ? String(extra).trim() : undefined,
          stockMovements: stock > 0 ? [{ id: makeId(), date: new Date().toISOString(), direction: 'IN', quantity: stock, reason: 'Imported opening stock' }] : [],
        });
      }

      if (!importedProducts.length) {
        throw new Error('Could not find product columns (Name, Price, Category). Use the sample template.');
      }

      const productKey = (product: Product) => `${product.name.trim().toLocaleLowerCase()}::${product.category.trim().toLocaleLowerCase()}`;
      const seenProductKeys = new Set(products.map(productKey));
      const newProducts = importedProducts.filter(product => {
        const key = productKey(product);
        if (seenProductKeys.has(key)) return false;
        seenProductKeys.add(key);
        return true;
      });
      if (!newProducts.length) {
        setToast('No new products added; matching products already exist. Existing stock and records were kept.');
        return;
      }
      setProducts(prev => [...newProducts, ...prev]);
      setImportExcelModalOpen(false);
      const skipped = importedProducts.length - newProducts.length;
      setToast(`Added ${newProducts.length} products offline${skipped ? ` · skipped ${skipped} duplicates` : ''}. Existing products were kept.`);
      recordAudit('product.imported', `Imported ${newProducts.length} products${skipped ? `, skipped ${skipped}` : ''}`);
    } catch (err: any) {
      setToast(err.message || 'Could not parse spreadsheet file. Please upload a standard CSV.');
    }
  };

  // Full Device Backup & Restore (JSON)
  const backupJson = () => JSON.stringify({ version: 4, app: 'ollaiBooks', tenantId: activeTenantId, exportedAt: new Date().toISOString(), shop, products, sales, reminders, taxEnabled, taxRate, auditLog }, null, 2);
  const backupFileName = () => `ollaibooks-backup-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}`;

  const exportBackup = async (options?: { silent?: boolean }) => {
    const bridge = getDesktopBridge();
    const at = new Date().toISOString();
    if (bridge) {
      const result = await bridge.saveBackupFile({ json: backupJson(), fileName: backupFileName(), business: shop.name });
      if (!result.ok) {
        notify('error', 'Backup not saved', result.error || 'Check that the Documents folder is writable.');
        return;
      }
      setLastBackupAt(at);
      recordAudit('backup.exported', `${options?.silent ? 'Automatic' : 'Manual'} backup saved (${sales.length} bills, ${products.length} products)`);
      notify('success', options?.silent ? 'Daily backup saved' : 'Backup saved on this laptop', result.path, {
        duration: options?.silent ? 5000 : 8000,
        action: { label: 'Open folder', onClick: () => { void bridge.openFolder('backups', shop.name); } },
      });
      return;
    }
    download(`${backupFileName()}.json`, backupJson(), 'application/json');
    setLastBackupAt(at);
    notify('success', 'Backup downloaded', 'Keep this file somewhere safe — a pen drive or Google Drive works well.');
    recordAudit('backup.exported', `Backup exported (${sales.length} bills, ${products.length} products)`);
  };

  /** Desktop app: save every invoice as a PDF in Documents/ollaiBooks/<Business>/Invoices/YYYY/MM-Mon. */
  const saveInvoiceToLaptop = async (sale: Sale, options?: { announce?: boolean }) => {
    const bridge = getDesktopBridge();
    if (!bridge) return;
    const html = buildInvoiceHtml(sale, shop, { template: 'classic-gst', autoPrint: false });
    const result = await bridge.saveInvoiceFile({ html, fileName: sale.number, business: shop.name, date: sale.date });
    if (!result.ok || !result.path) {
      notify('warning', 'Invoice PDF not saved', `${sale.number} is safe in the app, but the PDF couldn’t be written: ${result.error || 'unknown error'}.`);
      return;
    }
    setSales(current => current.map(s => (s.id === sale.id ? { ...s, filePath: result.path } : s)));
    if (options?.announce) {
      notify('success', 'Invoice PDF saved', result.path, { action: { label: 'Open folder', onClick: () => { void bridge.openFolder('invoices', shop.name); } } });
    }
  };

  // Desktop paths + signed-in account details for the "Account, Data & Help" tab
  React.useEffect(() => {
    try { setAccount(JSON.parse(sessionStorage.getItem('ollaibooks_account') || 'null')); } catch { setAccount(null); }
    const bridge = getDesktopBridge();
    if (bridge) void bridge.getPaths(shop.name).then(setDesktopPaths).catch(() => setDesktopPaths(null));
  }, [shop.name]);

  // Automatic daily backup in the desktop app (keeps the newest 30 on disk)
  const autoBackupDone = React.useRef(false);
  React.useEffect(() => {
    if (!ready || loadedTenantId !== activeTenantId || autoBackupDone.current || !getDesktopBridge() || !sales.length) return;
    const age = lastBackupAt ? Date.now() - new Date(lastBackupAt).getTime() : Infinity;
    if (age < 24 * 3600_000) return;
    autoBackupDone.current = true;
    const timer = window.setTimeout(() => { void exportBackup({ silent: true }); }, 4000);
    return () => window.clearTimeout(timer);
  }, [ready, loadedTenantId, activeTenantId, sales.length, lastBackupAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const backupAgeDays = lastBackupAt ? Math.floor((Date.now() - new Date(lastBackupAt).getTime()) / 864e5) : null;
  const billsSinceBackup = lastBackupAt ? sales.filter(s => s.date > lastBackupAt).length : sales.length;
  const backupOverdue = sales.length > 0 && (backupAgeDays === null || backupAgeDays >= 7);

  const importBackup = async (file?: File) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.products) || !Array.isArray(data.sales)) throw new Error('Invalid backup format');
      // Restore additively so importing an older backup never deletes newer local records.
      const mergeById = <T extends { id?: string },>(current: T[], incoming: T[]) => {
        const seen = new Set(current.map(item => item.id).filter(Boolean));
        return [...current, ...incoming.filter(item => !item.id || !seen.has(item.id))];
      };
      setProducts(current => mergeById(current, data.products));
      setSales(current => mergeById(current, data.sales));
      if (Array.isArray(data.reminders)) setReminders(current => mergeById(current, data.reminders));
      if (data.shop) setShop(prev => ({ ...prev, ...data.shop }));
      if (typeof data.taxEnabled === 'boolean') setTaxEnabled(data.taxEnabled);
      if (typeof data.taxRate === 'number') setTaxRate(data.taxRate);
      setToast('Backup restored successfully on this device');
      recordAudit('backup.restored', `Backup merged: ${data.sales.length} bills, ${data.products.length} products`);
    } catch {
      setToast('Failed to read file. Choose a valid ollaiBooks JSON backup.');
    }
  };

  // Machine / Thermal & Invoice Printing
  const printReceipt = (sale: Sale, templateOverride?: InvoiceTemplateId) => {
    try {
      printInvoiceDocument(sale, shop, {
        template: templateOverride || invoiceTemplate,
        paperWidth,
      });
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Allow pop-ups to print bill.');
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Activity },
    { id: 'billing', label: industry.key === 'salon' ? 'Appointments & Billing' : industry.key === 'restaurant' ? 'Restaurant Billing' : 'Fast Billing', icon: ShoppingCart },
    { id: 'sales', label: 'Sales & Invoices', icon: FileSpreadsheet },
    { id: 'products', label: industry.key === 'salon' ? 'Services & Products' : industry.key === 'restaurant' ? 'Menu & Stock' : industry.key === 'bakery' ? 'Bakery Catalog' : 'Catalog & Stock', icon: Package },
    { id: 'settings', label: 'Store & Tax Setup', icon: Settings2 },
    { id: 'help', label: 'Account, Data & Help', icon: CircleHelp },
  ] as const;

  return !authReady || !ready || loadedTenantId !== activeTenantId ? (
    <main className="pos-auth-loading">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw className="h-6 w-6 animate-spin text-[var(--brand-blue)]" />
        <span>{authReady ? 'Loading this workspace’s offline records…' : 'Authenticating your subscribed workspace…'}</span>
      </div>
    </main>
  ) : (
    <main className="pos-app" style={buildAppThemeVars(shop)}>
      {/* 1. Sidebar Navigation */}
      <aside className={`pos-sidebar ${mobileMenu ? 'pos-sidebar-open' : ''}`}>
        <a className="pos-brand" href="/offline-pos">
          <span className="pos-brand-icon">
            <Store size={20} />
          </span>
          <span>
            <b>ollaiBooks</b>
            <small>UNIVERSAL MULTI-STORE POS</small>
          </span>
        </a>

        {/* Multi-Tenant Workspace Selector */}
        <div className="relative mb-5">
          <button
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
            className="pos-store-select w-full text-left cursor-pointer hover:border-[var(--brand-blue)] transition"
            title="Switch Tenant Workspace"
          >
            <div className={`pos-store-avatar ${shop.logo ? 'has-logo' : ''}`}>
              {shop.logo ? <img src={shop.logo} alt={`${shop.name} logo`} /> : shop.name.slice(0, 1).toUpperCase()}
            </div>
            <span>
              <b>{shop.name}</b>
              <small>{shop.gstin ? `GSTIN ${shop.gstin}` : (resolvedShopState?.name || 'Tap to switch store')}</small>
            </span>
            <ChevronDown size={15} />
          </button>

          {workspaceMenuOpen && (
            <div className="absolute top-full left-0 right-0 z-30 mt-1 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Workspace
              </div>
              {workspaces.map(wp => (
                <button
                  key={wp.tenantId}
                  onClick={() => handleSwitchWorkspace(wp.tenantId)}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs transition ${
                    wp.tenantId === activeTenantId ? 'bg-[var(--brand-blue-soft)] font-bold text-[var(--brand-blue-hover)]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{wp.tenantName}</span>
                  {wp.tenantId === activeTenantId && <Check size={14} className="text-[var(--brand-blue)]" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pos-nav-label">POS OPERATIONS</div>
        <nav className="pos-nav">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => { setTab(item.id); setMobileMenu(false); }}
                className={`pos-nav-item ${tab === item.id ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {item.id === 'sales' && pendingCount > 0 && <i>{pendingCount}</i>}
              </button>
            );
          })}
        </nav>

        <div className="pos-sidebar-bottom">
          <div className="pos-love">
            <ShieldCheck size={16} className="text-emerald-600 flex-shrink-0" />
            <div className="flex flex-col text-left">
              <span className="font-bold text-slate-800 text-[11px]">{vaultEncrypted ? 'Your data is encrypted' : 'Saved on this device'}</span>
              <span className="text-[9px] text-slate-500 font-normal">{vaultEncrypted ? 'AES-256 vault · only this device can read it' : 'Export a backup now and then'}</span>
            </div>
          </div>
          <div className={`pos-sidebar-note ${online ? '' : 'is-offline'}`}>
            <span className="pos-dot" />
            {!online
              ? `Offline · ${pendingCount} bill${pendingCount === 1 ? '' : 's'} waiting to sync`
              : pendingCount
                ? `${pendingCount} bill${pendingCount === 1 ? '' : 's'} syncing soon`
                : lastSyncedAt ? `All synced · ${new Date(lastSyncedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'All bills in sync'}
          </div>
          <div className="pos-support-links">
            <span>Need a hand? We’re here.</span>
            <a href="tel:+919600732162">Call ollaiBooks: +91 96007 32162</a>
            <a href="https://wa.me/919600732162" target="_blank" rel="noreferrer">Chat on WhatsApp</a>
          </div>
          <button
            className="pos-signout"
            onClick={() => { clearPosSession(); router.replace('/login'); }}
          >
            <LogOut size={14} /> Sign out workspace
          </button>
        </div>
      </aside>

      {/* 2. Main Work Area */}
      <section className="pos-main">
        {/* Top Header Bar */}
        <header className="pos-topbar">
          <button
            className="pos-icon-button pos-menu-button"
            onClick={() => setMobileMenu(!mobileMenu)}
            aria-label="Toggle menu"
          >
            <Menu size={20} />
          </button>
          <div className="pos-crumb">
            Workspace <span>/</span> <b>{navItems.find(n => n.id === tab)?.label}</b>
          </div>

          <button
            type="button"
            onClick={() => setNativeModalOpen(true)}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[var(--brand-blue-border)] bg-white px-3.5 py-1.5 text-xs font-semibold text-[var(--brand-blue-hover)] shadow-sm hover:bg-[var(--brand-blue-soft)] active:scale-95 transition-all whitespace-nowrap"
            title="Convert and install native app for Android APK, Windows, Mac, or iOS"
          >
            <Download size={15} /> Get App (APK / Desktop)
          </button>

          <button type="button" onClick={() => setCalculatorOpen(true)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 whitespace-nowrap" aria-label="Open calculator">
            <Calculator size={15} /> Calculator
          </button>

          {hasCounterPin && (
            <button
              type="button"
              onClick={() => { setPinInput(''); setPinError(''); setCounterLocked(true); }}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200 transition whitespace-nowrap"
              title="Lock counter screen with PIN"
            >
              <Lock size={14} /> Lock
            </button>
          )}

          {/* Quick Mobile Cart Pill Button */}
          {cart.length > 0 && (
            <button
              onClick={() => setMobileCartOpen(!mobileCartOpen)}
              className="pos-mobile-cart-toggle md:hidden flex items-center gap-1.5 rounded-full bg-[var(--brand-blue)] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm whitespace-nowrap"
            >
              <ShoppingCart size={14} />
              <span>{cart.reduce((a, b) => a + b.quantity, 0)}</span>
              <span>· {money(total)}</span>
            </button>
          )}

          <button
            type="button"
            onClick={requestSync}
            className={`pos-connection ${!online || posSessionMode === 'offline' ? 'disconnected' : pendingCount || syncingSales ? 'pending' : 'connected'}`}
            title={
              !online
                ? 'Offline mode — bills are saved locally on this device'
                : posSessionMode === 'offline'
                  ? 'Offline login active — sign in online to sync to cloud'
                  : 'Click to sync bills to the cloud now'
            }
          >
            {!online || posSessionMode === 'offline' ? (
              <WifiOff size={15} />
            ) : syncingSales ? (
              <RefreshCw size={15} className="animate-spin" />
            ) : pendingCount ? (
              <Cloud size={15} />
            ) : (
              <Wifi size={15} />
            )}
            <span>
              {!online
                ? 'Offline · Local Vault'
                : posSessionMode === 'offline'
                  ? 'Offline Login · Local'
                  : syncingSales
                    ? 'Online · Syncing…'
                    : pendingCount
                      ? 'Online · Pending Sync'
                      : 'Online · Synced'}
            </span>
            {pendingCount > 0 && <i className="pos-connection-count">{pendingCount}</i>}
          </button>

          <div className="pos-date">
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>

          <button
            className="pos-help"
            onClick={() => notify('info', 'How ollaiBooks keeps your data safe', 'Every bill, product and customer is saved instantly on this device in an encrypted vault, works without internet, and syncs to your cloud workspace when you’re online.', { duration: 8000 })}
            title="Help & Info"
          >
            <CircleHelp size={17} />
          </button>
        </header>

        {!online && (
          <div className="pos-offline-banner" role="status">
            <OfflineCounterIllustration className="pos-offline-art" />
            <div className="pos-offline-copy">
              <b>You’re offline — and that’s completely fine.</b>
              <span>
                Keep billing as usual. {pendingCount
                  ? `${pendingCount} bill${pendingCount === 1 ? ' is' : 's are'} saved and encrypted on this device, ready to sync.`
                  : 'New bills will be saved and encrypted on this device.'}{' '}
                We’ll sync everything automatically when the internet returns.
              </span>
              <div className="pos-offline-chips">
                <span><ShieldCheck size={13} /> {vaultEncrypted ? 'AES-256 encrypted' : 'Stored locally'}</span>
                <span><Printer size={13} /> Printing works</span>
                <span><Building2 size={13} /> {shop.name}{shop.gstin ? ` · ${shop.gstin}` : ''}</span>
              </div>
            </div>
            <button type="button" className="pos-offline-action" onClick={requestSync}>
              <RefreshCw size={14} /> Try sync
            </button>
          </div>
        )}

        {backupOverdue && tab !== 'help' && (
          <div className="pos-backup-banner" role="status">
            <AlertCircle size={18} />
            <span>
              <b>{lastBackupAt ? `No backup for ${backupAgeDays} days.` : 'You haven’t made a backup yet.'}</b>{' '}
              {billsSinceBackup} bill{billsSinceBackup === 1 ? '' : 's'} exist only inside this app. A backup takes 2 seconds.
            </span>
            <button type="button" onClick={() => void exportBackup()}>Back up now</button>
          </div>
        )}

        {tab === 'dashboard' && (
          <section className="pos-section">
            <div className="pos-page-heading">
              <div>
                <div className="pos-eyebrow"><Activity size={14} /> OFFLINE BUSINESS OVERVIEW</div>
                <h1>Today at a glance<span>.</span></h1>
                <p>{industry.title} workspace · local sales, payment totals, and stock alerts on this device.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="pos-secondary-action" onClick={() => { setTab('sales'); setOrderBookTab('all'); }}><Receipt size={15} /> Open order book</button>
                <button className="pos-primary-action" onClick={() => setTab('billing')}><ShoppingCart size={15} /> Start a bill</button>
              </div>
            </div>

              <div className="pos-metric-row pos-dashboard-metrics">
              <div className="pos-metric-card">
                <div className="flex items-center justify-between gap-2"><span>Orders today</span><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]"><ShoppingBag size={14} /></span></div>
                <b>{todaySales.length + todayWebsiteOrders.length}</b>
                <small>{todaySales.length} shop · {todayWebsiteOrders.length} website</small>
              </div>
              <div className="pos-metric-card">
                <div className="flex items-center justify-between gap-2"><span>Shop revenue today</span><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><IndianRupee size={14} /></span></div>
                <b>{money(todayRevenue)}</b>
                <small>{todaySales.length} local bills</small>
              </div>
              <div className="pos-metric-card">
                <div className="flex items-center justify-between gap-2"><span>Average bill today</span><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]"><Receipt size={14} /></span></div>
                <b>{money(averageBill)}</b>
                <small>Across {todaySales.length} local bills</small>
              </div>
              <div className="pos-metric-card">
                <div className="flex items-center justify-between gap-2"><span>Low stock</span><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><Package size={14} /></span></div>
                <b>{lowStockProducts.length}</b>
                <small>Items need attention</small>
              </div>
              <div className="pos-metric-card">
                <div className="flex items-center justify-between gap-2"><span>Upcoming reminders</span><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Clock size={14} /></span></div>
                <b>{upcomingReminders.length}</b>
                <small>Saved on this device</small>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="pos-data-card">
                <div className="pos-data-heading"><div><h2>Today’s payments</h2><span>Payment totals from bills saved on this device</span></div><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-600"><Banknote size={17} /></span></div>
                <div className="pos-card-body">
                  {Object.keys(todayPaymentTotals).length ? (
                    <div className="divide-y divide-slate-100">
                      {Object.entries(todayPaymentTotals).map(([label, amount]) => (
                        <div key={label} className="flex items-center justify-between gap-3 py-3 text-xs">
                          <span className="inline-flex items-center gap-2 font-semibold text-slate-700">
                            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]">
                              {label.toLowerCase().includes('upi') ? <QrCode size={13} /> : label.toLowerCase().includes('card') ? <CreditCard size={13} /> : <Banknote size={13} />}
                            </span>
                            {label}
                          </span>
                          <b className="text-sm text-slate-900 tabular-nums">{money(amount)}</b>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]"><Banknote size={18} /></span>
                      <p className="text-xs text-slate-500">Payment totals will appear here after your first bill.</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="pos-data-card">
                <div className="pos-data-heading"><div><h2>Top-selling today</h2><span>Ranked by units sold in local bills</span></div><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-blue-soft)] border border-[var(--brand-blue-border)] text-[var(--brand-blue)]"><Activity size={17} /></span></div>
                <div className="pos-card-body">
                  {topSellingItems.length ? (
                    <div className="divide-y divide-slate-100">
                      {topSellingItems.map((item, index) => (
                        <div key={`${item.name}:${index}`} className="flex items-center justify-between gap-3 py-3 text-xs">
                          <span className="flex items-center gap-2.5 min-w-0">
                            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-md bg-[var(--brand-blue-soft)] text-[11px] font-bold text-[var(--brand-blue-hover)]">#{index + 1}</span>
                            <span className="min-w-0">
                              <b className="block truncate text-slate-900">{item.name}</b>
                              <small className="block text-slate-500">{item.quantity} sold</small>
                            </span>
                          </span>
                          <b className="text-sm text-slate-900 tabular-nums">{money(item.revenue)}</b>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]"><Activity size={18} /></span>
                      <p className="text-xs text-slate-500">Top products appear after you complete a bill.</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="pos-data-card">
                <div className="pos-data-heading"><div><h2>Current order book</h2><span>Combined view · shop and website orders stay labelled by source</span></div><button className="pos-secondary-action" onClick={() => setTab('sales')}>View all <span>→</span></button></div>
                <div className="pos-card-body">
                  {orderBook.slice(0, 6).length ? <div className="divide-y divide-slate-100">{orderBook.slice(0, 6).map(order => <div key={`${order.source}:${order.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"><div className="min-w-0"><b className="text-slate-900">{order.orderNumber}</b><span className={`ml-2 rounded-full px-2 py-0.5 font-bold ${order.source === 'shop' ? 'bg-[var(--brand-blue-soft)] text-[var(--brand-blue-hover)]' : 'bg-violet-50 text-violet-700'}`}>{order.source === 'shop' ? 'SHOP' : 'WEBSITE'}</span><small className="mt-1 block truncate text-slate-500">{order.customerName} · {new Date(order.date).toLocaleString('en-IN')}</small>{order.source === 'shop' && (order.raw as Sale).orderType && <small className="mt-0.5 block text-[var(--brand-blue-hover)]">{(order.raw as Sale).orderType}{(order.raw as Sale).tableNumber ? ` · Table ${(order.raw as Sale).tableNumber}` : ''}</small>}</div><b className="text-sm text-slate-900 tabular-nums">{money(order.total)}</b></div>)}</div> : (
                    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                      <SyncCloudIllustration className="w-20 h-auto" />
                      <p className="text-xs text-slate-500">No orders saved yet. Start a bill to see live records here.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pos-data-card">
                <div className="pos-data-heading"><div><h2>Stock alerts</h2><span>Low quantities from this offline catalog</span></div><button className="pos-secondary-action" onClick={() => setTab('products')}>Manage stock <span>→</span></button></div>
                <div className="pos-card-body">
                  {lowStockProducts.slice(0, 6).length ? <div className="divide-y divide-slate-100">{lowStockProducts.slice(0, 6).map(product => <div key={product.id} className="flex items-center justify-between gap-3 py-3 text-xs"><span><b className="text-slate-900">{product.name}</b><small className="mt-1 block text-slate-500">{product.category}</small></span><b className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">{product.stock} {product.stockUnit || 'pcs'}</b></div>)}</div> : (
                    <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-600"><ShieldCheck size={20} /></span>
                      <b className="text-xs text-slate-800">All stock levels look healthy</b>
                      <p className="text-[11px] text-slate-500">Low-quantity alerts will automatically appear here.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pos-data-card xl:col-span-2">
                <div className="pos-data-heading"><div><h2>Offline calendar & reminders</h2><span>Private to this device and available without internet</span></div><span className="pos-method-pill">{upcomingReminders.length} upcoming</span></div>
                <div className="pos-card-body">
                  <form onSubmit={addReminder} className="grid gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50 p-3.5 sm:grid-cols-4">
                    <input required maxLength={100} value={reminderTitle} onChange={e => setReminderTitle(e.target.value)} placeholder="Reminder title" className="min-w-0 h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-[var(--brand-blue)] focus:outline-none" />
                    <input required type="datetime-local" value={reminderDate} onChange={e => setReminderDate(e.target.value)} className="min-w-0 h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-[var(--brand-blue)] focus:outline-none" />
                    <input maxLength={240} value={reminderNote} onChange={e => setReminderNote(e.target.value)} placeholder="Note (optional)" className="min-w-0 h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:border-[var(--brand-blue)] focus:outline-none" />
                    <button type="submit" className="pos-primary-action justify-center"><Plus size={14} /> Add reminder</button>
                  </form>
                  <div className="mt-3 divide-y divide-slate-100">
                    {upcomingReminders.map(reminder => <div key={reminder.id} className="flex items-center justify-between gap-3 py-2.5 text-xs"><div><b className="text-slate-900">{reminder.title}</b><small className="mt-0.5 block text-slate-500">{new Date(reminder.startsAt).toLocaleString('en-IN')}{reminder.note ? ` · ${reminder.note}` : ''}</small></div><button aria-label={`Delete ${reminder.title}`} className="pos-row-action" onClick={() => setReminders(current => current.filter(item => item.id !== reminder.id))}><X size={14} /></button></div>)}
                    {!upcomingReminders.length && <p className="py-4 text-xs text-slate-500">No upcoming reminders. Add a delivery, supplier call or follow-up above.</p>}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* TAB 1: Fast Billing Checkout */}
        {tab === 'billing' && (
          <>
            <div className="pos-page-heading">
              <div>
                <div className="pos-eyebrow">
                  <Sparkles size={14} /> FAST OFFLINE CHECKOUT
                </div>
                <h1>{industry.key === 'salon' ? 'Create an appointment bill' : industry.key === 'restaurant' ? 'Create a restaurant bill' : industry.key === 'bakery' ? 'Create a bakery bill' : 'Let’s make a bill'}<span>.</span></h1>
                <p>Every sale is saved safely on this device, even without internet.</p>
              </div>
              <div className="pos-heading-stats">
                <div>
                  <span>Today’s sales</span>
                  <b>{money(todayRevenue)}</b>
                </div>
                <div className="pos-stat-sep" />
                <div>
                  <span>Bills issued</span>
                  <b>{todaySales.length}</b>
                </div>
              </div>
            </div>

            <div className="pos-billing-layout">
              {/* Left Column: Product Catalog */}
              <section className="pos-catalog">
                <div className="pos-catalog-top">
                  <div>
                    <h2>{industry.catalogTitle}</h2>
                    <span>{activeProducts.length} active {industry.itemPlural}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="pos-search">
                      <Search size={16} />
                      <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder={industry.searchPlaceholder}
                      />
                    </div>
                    {/* Quick Add Product Button */}
                    <button
                      type="button"
                      onClick={() => { resetProductForm(); setAddProductModalOpen(true); }}
                      className="pos-primary-action"
                      style={{ height: 40, padding: '0 14px' }}
                      title={`Add a new ${industry.itemSingular} offline`}
                    >
                      <Plus size={15} />
                      <span className="hidden sm:inline">{industry.key === 'salon' ? 'Add Service' : industry.key === 'restaurant' ? 'Add Menu Item' : 'Add Item'}</span>
                    </button>
                  </div>
                </div>

                {/* Category Filter Pills with Icons */}
                <div className="pos-categories">
                  {categories.map(c => (
                    <button
                      key={c}
                      className={category === c ? 'selected' : ''}
                      onClick={() => setCategory(c)}
                    >
                      {getCategoryIcon(c)}
                      <span>{c}</span>
                    </button>
                  ))}
                </div>

                {/* Product Grid with Icons */}
                <div className="pos-product-grid">
                  {filteredProducts.map(p => (
                    <button
                      className="pos-product"
                      key={p.id}
                      onClick={() => addToCart(p)}
                    >
                      <span className="pos-product-art">
                        {renderProductCardArt(p)}
                        <i><Plus size={14} /></i>
                      </span>
                      <span className="pos-product-name">{p.name}</span>
                      <span className="pos-product-meta">
                        <b>{money(p.price)}</b>
                         <small>{p.tracksStock === false ? 'Service · no stock limit' : `${p.stock} ${p.stockUnit || 'pcs'} in stock`}</small>
                      </span>
                    </button>
                  ))}
                </div>

                {filteredProducts.length === 0 && activeProducts.length > 0 && (
                  <div className="pos-empty">
                    <Search size={24} />
                    <b>No products found</b>
                    <span>Try another keyword, or click "+ Add Product" to add one offline.</span>
                  </div>
                )}

                {activeProducts.length === 0 && (
                  <div className="pos-empty">
                    <Package size={24} />
                    <b>Your catalog is empty</b>
                    <span>Add {industry.itemPlural} or import your Excel / CSV catalog. All entries remain saved offline; archived items can be restored from the catalog.</span>
                    <div className="flex flex-wrap justify-center gap-2">
                      <button type="button" className="pos-primary-action" onClick={() => { resetProductForm(); setAddProductModalOpen(true); }}><Plus size={15} /> {industry.key === 'salon' ? 'Add Service' : industry.key === 'restaurant' ? 'Add Menu Item' : 'Add Item'}</button>
                      <button type="button" className="pos-secondary-action" onClick={() => setImportExcelModalOpen(true)}><Upload size={15} /> Import Excel</button>
                    </div>
                  </div>
                )}

                <div className="pos-catalog-foot">
                  <span>
                    <span className="pos-dot" />
                    {industry.key === 'salon' ? 'Service bookings do not reduce product stock; tracked retail items adjust automatically.' : 'Inventory automatically adjusts with each completed bill.'}
                  </span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setImportExcelModalOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                      <FileSpreadsheet size={13} />
                      <span>Import Excel</span>
                    </button>
                    <button onClick={() => setTab('products')} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-[var(--brand-blue-hover)] hover:bg-[var(--brand-blue-soft)] transition">
                       {industry.key === 'salon' ? 'Manage Services & Stock' : industry.key === 'restaurant' ? 'Manage Menu & Stock' : 'Manage Stock'} <span>→</span>
                    </button>
                  </div>
                </div>
              </section>

              {/* Right Column: Checkout Cart Panel */}
              <aside className={`pos-cart-panel ${mobileCartOpen ? 'block mobile-cart-open' : 'hidden md:flex'}`}>
                <div className="pos-cart-heading">
                  <div className="pos-cart-heading-icon">
                    <ShoppingBag size={17} />
                  </div>
                  <div>
                    <h2>{industry.key === 'restaurant' ? 'Current order' : industry.key === 'salon' ? 'Current appointment' : 'Current bill'}</h2>
                    <span>{cart.reduce((n, i) => n + i.quantity, 0)} items in bill</span>
                  </div>
                  <button
                    title="Clear bill"
                    onClick={() => setCart([])}
                    disabled={!cart.length}
                  >
                    <Trash2 size={16} />
                  </button>
                  {mobileCartOpen && <button className="pos-cart-close" aria-label="Close bill panel" onClick={() => setMobileCartOpen(false)}><X size={18} /></button>}
                </div>

                <div className="pos-cart-lines">
                  {cart.length ? (
                    cart.map(item => (
                      <div className="pos-cart-line" key={item.productId}>
                        <div className="pos-cart-line-name">
                          <b>{item.name}</b>
                          <span>{money(item.price)} / {products.find(p => p.id === item.productId)?.tracksStock === false ? 'service' : products.find(p => p.id === item.productId)?.stockUnit || 'pcs'} {item.hsn ? `· HSN: ${item.hsn}` : ''}</span>
                        </div>
                        <div className="pos-quantity">
                          <button onClick={() => setQuantity(item.productId, -1)} aria-label="Decrease">
                            <Minus size={13} />
                          </button>
                          <b>{Number(item.quantity.toFixed(3))}</b>
                          <button onClick={() => setQuantity(item.productId, 1)} aria-label="Increase">
                            <Plus size={13} />
                          </button>
                        </div>
                        <b className="pos-line-total">{money(item.quantity * item.price)}</b>
                      </div>
                    ))
                  ) : (
                    <div className="pos-cart-empty">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--brand-blue-border)] bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]">
                        <ShoppingCart size={22} />
                      </div>
                      <b>Ready for the next customer</b>
                      <span>Tap any item on the left to start a bill. It works with or without internet.</span>
                    </div>
                  )}
                </div>

                {/* Compact Customer & Order Details */}
                <div className="pos-cart-details">
                  <div className="pos-order-type-bar" role="group" aria-label="Sale type">
                    {industry.orderTypes.map(value => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setOrderType(value)}
                        className={`pos-order-pill ${orderType === value ? 'active' : ''}`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>

                  {industry.key === 'restaurant' && orderType === 'Dine-in' && (
                    <label className="pos-field-label">
                      <span>Table number</span>
                      <input value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="e.g. Table 4" />
                    </label>
                  )}

                  <div className="pos-input-row">
                    <label className="pos-field-label">
                      <span className="flex items-center gap-1.5">
                        <User size={12} className="text-[var(--brand-blue)]" />
                        <span>{industry.customerLabel}</span>
                      </span>
                      <input
                        list="pos-offline-customers"
                        value={customer}
                        onChange={e => {
                          const val = e.target.value;
                          setCustomer(val);
                          const match = recentCustomers.find(c => c.name.toLowerCase() === val.trim().toLowerCase());
                          if (match) {
                            if (match.phone && !phone) setPhone(match.phone);
                            if (match.state && !customerState) setCustomerState(match.state);
                          }
                        }}
                        placeholder={`Enter ${industry.customerLabel.toLowerCase()} name`}
                      />
                      <datalist id="pos-offline-customers">
                        {recentCustomers.map(c => (
                          <option key={c.name} value={c.name}>{c.phone ? `${c.name} (${c.phone})` : c.name}</option>
                        ))}
                      </datalist>
                    </label>

                    <label className="pos-field-label">
                      <span className="flex items-center gap-1.5">
                        <Smartphone size={12} className="text-[var(--brand-blue)]" />
                        <span>Phone</span>
                      </span>
                      <input
                        inputMode="tel"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="Enter phone number"
                      />
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowExtraBillFields(prev => !prev)}
                    className="pos-extra-toggle"
                  >
                    <Clock size={12} />
                    <span>
                      {showExtraBillFields || pickup || note || customerGstin
                        ? 'Hide GST, delivery & note fields'
                        : `+ Add customer GSTIN, ${industry.dateLabel.toLowerCase()} or notes`}
                    </span>
                  </button>

                  {(showExtraBillFields || pickup || note || customerState || customerGstin || customerAddress) && (
                    <div className="pos-extra-fields">
                      <label className="pos-field-label">
                        <span>Customer GSTIN <small className="pos-label-muted">(for B2C bills, leave this empty)</small></span>
                        <input
                          value={customerGstin}
                          onChange={e => setCustomerGstin(e.target.value.toUpperCase().replace(/\s/g, ''))}
                          placeholder="33ABCDE1234F1Z5"
                          maxLength={15}
                          aria-invalid={!customerGstinValid}
                          className={!customerGstinValid ? 'pos-input-error' : ''}
                        />
                        {customerGstinClean && (
                          <small className={customerGstinValid ? 'pos-hint-ok' : 'pos-hint-error'}>
                            {customerGstinValid
                              ? `B2B invoice · ${resolvedCustomerState?.name || 'state'} · ${isInterstateSale ? 'IGST applies' : 'CGST + SGST applies'}`
                              : `${customerGstinClean.length}/15 — check the format`}
                          </small>
                        )}
                      </label>

                      {customerGstinClean && (
                        <label className="pos-field-label">
                          <span>Customer billing address</span>
                          <input value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} placeholder="Door no, street, city, PIN" />
                        </label>
                      )}

                      <label className="pos-field-label">
                        <span>Place of Supply (Customer State)</span>
                        <select value={customerState} onChange={e => setCustomerState(e.target.value)}>
                          <option value="">
                            {resolvedShopState ? `Same as store · ${resolvedShopState.name} (${resolvedShopState.code})` : 'Same as store (CGST + SGST)'}
                          </option>
                          {INDIAN_GST_STATES.map(st => (
                            <option key={st.code} value={st.name}>{st.name} ({st.code})</option>
                          ))}
                        </select>
                      </label>

                      <label className="pos-field-label">
                        <span className="flex items-center gap-1">
                          <Clock size={12} className="text-[var(--brand-blue)]" />
                          <span>{industry.dateLabel}</span>
                        </span>
                        <input
                          type="datetime-local"
                          value={pickup}
                          onChange={e => setPickup(e.target.value)}
                          title={industry.dateTitle}
                        />
                      </label>

                      <label className="pos-field-label">
                        <span className="flex items-center gap-1">
                          <FileText size={12} className="text-[var(--brand-blue)]" />
                          <span>{industry.notesLabel}</span>
                        </span>
                        <input
                          value={note}
                          onChange={e => setNote(e.target.value)}
                          placeholder={industry.notesPlaceholder}
                        />
                      </label>
                    </div>
                  )}
                </div>

                {/* Calculations & Totals */}
                <div className="pos-cart-summary">
                  <div>
                    <span>Subtotal</span>
                    <b>{money(subtotal)}</b>
                  </div>
                  <div className="pos-discount-row">
                    <span>{isInterstateSale ? 'IGST' : 'GST'} <small>{taxRate}%</small></span>
                    <b>{money(gst)}</b>
                  </div>
                  <div className="pos-discount-input">
                    <span>Discount</span>
                    <label>
                      ₹{' '}
                      <input
                        type="number"
                        min="0"
                        max={subtotal}
                        value={discount || ''}
                        onChange={e => setDiscount(Number(e.target.value))}
                        placeholder="0"
                      />
                    </label>
                  </div>
                  <div className="pos-grand-total">
                    <span>Total Due</span>
                    <b>{money(total)}</b>
                  </div>
                </div>

                {/* Payment Methods with Icons */}
                <div className="pos-payment-methods">
                  {[
                    { id: 'UPI', label: 'UPI Instant', icon: QrCode },
                    { id: 'Cash', label: 'Cash', icon: Banknote },
                    { id: 'Card', label: 'Card (POS)', icon: CreditCard },
                  ].map(m => {
                    const Icon = m.icon;
                    return (
                      <button
                        key={m.id}
                        className={method === m.id ? 'selected' : ''}
                        onClick={() => setMethod(m.id)}
                      >
                        <Icon size={14} />
                        <span>{m.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Submit Checkout Button */}
                <button
                  className="pos-charge-button"
                  disabled={!cart.length || savingSale}
                  onClick={finishSale}
                >
                  {savingSale ? <RefreshCw size={18} className="animate-spin" /> : <Check size={18} />}
                  <span>{savingSale ? 'Saving bill…' : 'Save Bill & Complete Sale'}</span>
                  <span>{money(total)}</span>
                </button>

                <div className="pos-safe-note">
                  {online ? <ShieldCheck size={14} /> : <CloudOff size={14} />}
                  {online
                    ? 'Saved on this device first, then synced to the cloud'
                    : 'Offline mode · saved encrypted on this device, syncs later'}
                </div>
              </aside>
            </div>
          </>
        )}

        {/* TAB 2: Sales & Invoices History */}
        {tab === 'sales' && (
          <section className="pos-section">
            <div className="pos-page-heading">
              <div>
                <div className="pos-eyebrow">
                  <Activity size={14} /> SALES & INVOICE LEDGER
                </div>
                <h1>Sales & Invoices<span>.</span></h1>
                <p>Every local sale, customer receipt and payment record stored in device memory.</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="pos-primary-action" onClick={exportSales}>
                  <FileSpreadsheet size={17} /> Export for Excel
                </button>
              </div>
            </div>

            <div className="pos-metric-row">
              <div className="pos-metric-card">
                <span>Sales today</span>
                <b>{money(todayRevenue)}</b>
                <small>{todaySales.length} bills today</small>
              </div>
              <div className="pos-metric-card">
                <span>All-time revenue</span>
                <b>{money(sales.reduce((s, v) => s + v.total, 0))}</b>
                <small>{sales.length} total bills</small>
              </div>
              <div className="pos-metric-card">
                <span>Pending online sync</span>
                <b>{pendingCount}</b>
                <small>{syncMessage}</small>
                <button type="button" className="mt-2 inline-flex items-center gap-1 self-start text-left text-xs font-bold text-[var(--brand-blue-hover)] hover:underline" onClick={requestSync}>
                  {syncingSales ? <><RefreshCw size={12} className="animate-spin" /> Syncing…</> : !online ? <><CloudOff size={12} /> Sync (offline)</> : posSessionMode === 'offline' ? 'Sign in online to sync' : pendingCount ? 'Sync now →' : <><CheckCircle2 size={12} /> All synced</>}
                </button>
              </div>
              <div className="pos-metric-card">
                <span>Catalog items</span>
                <b>{products.length}</b>
                <small>{products.reduce((n, p) => n + p.stock, 0)} units in stock</small>
              </div>
            </div>

            <div className="pos-data-card">
              <div className="pos-data-heading">
                <div>
                  <h2>Order book</h2>
                  <span>Shop bills live on this device. Website orders show the copy saved {websiteOrdersSavedAt ? new Date(websiteOrdersSavedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'when you were last online'}{online ? '' : ' (offline view)'}.</span>
                </div>
                <button className="pos-secondary-action" onClick={() => void exportBackup()}>
                  <Download size={16} /> Full Backup
                </button>
              </div>

              <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Order source">
                  {([{ id: 'all', label: `All orders (${orderBook.length})` }, { id: 'shop', label: `Shop (${sales.length})` }, { id: 'website', label: `Website (${websiteOrders.length})` }] as const).map(item => <button key={item.id} role="tab" aria-selected={orderBookTab === item.id} onClick={() => setOrderBookTab(item.id)} className={`rounded-lg border px-3.5 py-2 text-xs font-bold transition whitespace-nowrap ${orderBookTab === item.id ? 'border-[var(--brand-blue)] bg-[var(--brand-blue-soft)] text-[var(--brand-blue-hover)]' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'}`}>{item.label}</button>)}
                </div>
                <label className="pos-search sm:w-64"><Search size={15} /><input value={orderSearch} onChange={e => setOrderSearch(e.target.value)} placeholder="Search order, customer, item…" /></label>
              </div>

              {visibleOrderBook.length ? (
                <div className="pos-table-scroll">
                  <table className="pos-table">
                    <thead>
                      <tr>
                        <th>ORDER</th>
                        <th>SOURCE</th>
                        <th>CUSTOMER</th>
                        <th>DATE</th>
                        <th>PAYMENT / SYNC</th>
                        <th className="right">TOTAL</th>
                        <th>PRINT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleOrderBook.map(order => (
                        <tr key={`${order.source}:${order.id}`}>
                          <td>
                            <b>{order.orderNumber}</b>
                            <small>{order.items.length} item types</small>
                          </td>
                          <td>
                            <span className={`pos-method-pill ${order.source === 'website' ? 'bg-violet-50 text-violet-700' : 'bg-[var(--brand-blue-soft)] text-[var(--brand-blue-hover)]'}`}>{order.source === 'website' ? 'Website' : 'Shop / POS'}</span>
                          </td>
                          <td>
                            <b>{order.customerName}</b>
                            <small>{order.customerPhone || 'No phone'}</small>
                          </td>
                          <td>
                            {order.date ? dateLabel(order.date) : '—'}
                            {order.date && <small>{new Date(order.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</small>}
                          </td>
                          <td>
                            <span className="pos-method-pill">{order.paymentMethod} · {order.paymentStatus}</span>
                            {order.source === 'shop' && (
                              (order.raw as Sale).sync === 'synced'
                                ? <span className="pos-sync-chip synced" title={(order.raw as Sale).syncedAt ? `Synced ${new Date((order.raw as Sale).syncedAt!).toLocaleString('en-IN')}` : 'Synced'}><Cloud size={11} /> Synced</span>
                                : <span className="pos-sync-chip pending" title="Saved on this device; waiting to sync"><CloudOff size={11} /> On device</span>
                            )}
                            {order.source === 'website' && <span className="pos-sync-chip cached" title="Copy of the online order kept on this device for offline viewing"><Download size={11} /> Cached copy</span>}
                            {order.source === 'shop' && (order.raw as Sale).orderType && <small className="mt-1 block text-slate-500">{(order.raw as Sale).orderType}{(order.raw as Sale).tableNumber ? ` · Table ${(order.raw as Sale).tableNumber}` : ''}</small>}
                          </td>
                          <td className="right">
                            <b>{money(order.total)}</b>
                          </td>
                          <td>
                            <div className="flex items-center gap-1">
                              <button
                                className="pos-row-action"
                                title="Print KOT on machine"
                                onClick={() => {
                                  try {
                                    printKitchenOrderTicket(order.raw, { paperWidth, shopName: shop.name });
                                  } catch (error) {
                                    setToast(error instanceof Error ? error.message : 'Could not open kitchen ticket.');
                                  }
                                }}
                              >
                                <Printer size={15} />
                              </button>
                              {order.source === 'shop' && (
                                <>
                                  <button
                                    className="pos-row-action"
                                    title="Print customer bill (current template)"
                                    onClick={() => printReceipt(order.raw as Sale)}
                                  >
                                    <Receipt size={15} />
                                  </button>
                                  <button
                                    className="pos-row-action"
                                    title="Print Modern Branded GST Invoice (Extra Template)"
                                    onClick={() => printReceipt(order.raw as Sale, 'modern-gst')}
                                  >
                                    <FileText size={15} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="pos-empty pos-empty-large">
                  <span className="pos-empty-illustration flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <Receipt size={24} />
                  </span>
                  <b>No matching orders</b>
                  <span>{orderBookTab === 'website' && !websiteOrders.length ? 'Website orders appear here when this device is online and they are loaded.' : 'Try another source or search, or create a shop bill.'}</span>
                  <button className="pos-primary-action" onClick={() => setTab('billing')}>
                    Start New Bill <span>→</span>
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 3: Catalog & Stock Management */}
        {tab === 'products' && (
          <section className="pos-section">
            <div className="pos-page-heading">
              <div>
                <div className="pos-eyebrow">
                  <Package size={14} /> {industry.key === 'salon' ? 'SERVICE & RETAIL CATALOG' : industry.key === 'restaurant' ? 'MENU & INVENTORY CATALOG' : 'PRODUCT & INVENTORY CATALOG'}
                </div>
                <h1>{industry.key === 'salon' ? 'Services & Products' : industry.key === 'restaurant' ? 'Menu & Stock' : industry.key === 'bakery' ? 'Bakery Catalog & Stock' : 'Products & Stock'}<span>.</span></h1>
                <p>Manage {industry.itemPlural}, pricing, stock tracking, and tax codes for this workspace.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button className="pos-secondary-action" onClick={exportProductsCatalog}>
                  <FileSpreadsheet size={15} /> Export Catalog CSV
                </button>
                <button className="pos-secondary-action" onClick={() => setImportExcelModalOpen(true)}>
                  <Upload size={15} /> Connect Excel / CSV
                </button>
                <button className="pos-primary-action" onClick={() => { resetProductForm(); setAddProductModalOpen(true); }}>
                  <Plus size={17} /> {industry.key === 'salon' ? 'Add Service' : industry.key === 'restaurant' ? 'Add Menu Item' : 'Add Item'}
                </button>
              </div>
            </div>

            <div className="pos-stock-note">
              <Sparkles size={17} />
              <span>
                <b>Automatic Inventory Tracking:</b> Whenever you complete a sale, product quantities adjust automatically on your local device.
              </span>
            </div>

            <div className="pos-product-admin-grid">
              {products.map(p => (
                <div className={`pos-stock-card ${p.isArchived ? 'opacity-60' : ''}`} key={p.id}>
                  <span className="pos-product-art" style={{ background: p.color || '#f8fafc' }}>
                    {renderProductCardArt(p)}
                  </span>
                  <div className="pos-stock-info">
                    <span>{p.category} {p.hsn ? `· HSN: ${p.hsn}` : ''}</span>
                    <b>{p.name} {p.isArchived && <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">Archived</span>}</b>
                  <strong>{money(p.price)}{p.tracksStock === false ? ' / service' : ` / ${p.stockUnit || 'pcs'}`}</strong>
                    <small>Purchased: {p.purchaseDate || '—'} · Cost: {money(p.purchasePrice || 0)}</small>
                    {p.weight && <small>Weight: {p.weight}</small>}
                    {p.extra && <small>{p.extra}</small>}
                  {p.purchaseBill && (
                    <a href={p.purchaseBill.dataUrl} download={p.purchaseBill.name} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[var(--brand-blue-hover)] underline">
                      View purchase bill · {p.purchaseBill.name}
                    </a>
                  )}
                    <small>{p.stockMovements?.length || 0} stock movements recorded</small>
                  </div>
                  {p.tracksStock === false ? <span className="rounded-full bg-violet-50 px-2 py-1 text-center text-[10px] font-bold text-violet-700">Service · no stock tracking</span> : <label className={p.stock <= 5 ? 'low' : ''}>
                    <small>IN STOCK ({p.stockUnit || 'pcs'})</small>
                    <b>{p.stock.toLocaleString('en-IN', { maximumFractionDigits: 3 })}</b>
                  </label>}
                  {p.tracksStock !== false && <button
                    className="pos-secondary-action pos-stock-movement"
                    onClick={() => { setStockModalProduct(p); setStockChange(''); setStockDirection('IN'); }}
                    title="Record stock received or removed"
                  >
                    <ArrowUpFromLine size={14} /> Stock movement
                  </button>}
                  <button className="pos-row-action pos-edit-product" title={`Edit ${p.name}`} aria-label={`Edit ${p.name}`} onClick={() => openEditProduct(p)}>
                    <Pencil size={15} />
                  </button>
                  <button
                    className="pos-row-action"
                    title={p.isArchived ? 'Restore product to billing' : 'Archive product from billing'}
                    aria-label={p.isArchived ? `Restore ${p.name}` : `Archive ${p.name}`}
                    onClick={() => {
                      setProducts(prev => prev.map(item => item.id === p.id ? { ...item, isArchived: !item.isArchived } : item));
                      setToast(p.isArchived ? `${p.name} restored to billing.` : `${p.name} archived; its history and stock are preserved.`);
                      recordAudit('product.archived', `${p.isArchived ? 'Restored' : 'Archived'} ${p.name}`);
                    }}
                  >
                    {p.isArchived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 5: Account, data on this laptop, backups & helpline */}
        {tab === 'help' && (
          <section className="pos-section">
            <div className="pos-page-heading">
              <div>
                <div className="pos-eyebrow"><ShieldCheck size={14} /> YOUR ACCOUNT &amp; DATA</div>
                <h1>Account, data &amp; help<span>.</span></h1>
                <p>Who is signed in, where your invoices are saved, how safe your backups are, and how to reach us.</p>
              </div>
            </div>

            <div className="pos-help-grid">
              {/* Account */}
              <div className="pos-data-card pos-help-card">
                <div className="pos-data-heading"><div><h2>Account</h2><span>This counter’s sign-in and subscription</span></div><User size={20} /></div>
                <dl className="pos-kv">
                  <div><dt>Business</dt><dd>{shop.name}</dd></div>
                  {shop.gstin && <div><dt>GSTIN</dt><dd>{shop.gstin}</dd></div>}
                  <div><dt>Signed in as</dt><dd>{account?.name || '—'}{account?.email ? <small>{account.email}</small> : null}</dd></div>
                  <div><dt>Sign-in type</dt><dd><span className={`pos-sync-chip ${posSessionMode === 'online' ? 'synced' : 'pending'}`}>{posSessionMode === 'online' ? 'Online sign-in' : 'Offline sign-in'}</span></dd></div>
                  {(() => {
                    const ws = workspaces.find(w => w.tenantId === activeTenantId) as (WorkspaceItem & { subscriptionEndsAt?: string }) | undefined;
                    const offlineUntil = typeof window !== 'undefined' ? Number(sessionStorage.getItem('billdesk_pos_offline_expires_at') || 0) : 0;
                    return (
                      <>
                        {ws?.subscriptionEndsAt && <div><dt>Subscription valid till</dt><dd>{new Date(ws.subscriptionEndsAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</dd></div>}
                        {posSessionMode === 'offline' && offlineUntil > 0 && <div><dt>Offline access until</dt><dd>{new Date(offlineUntil).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}<small>Sign in online before this to keep billing.</small></dd></div>}
                      </>
                    );
                  })()}
                  <div><dt>App</dt><dd>{nativePlatformLabel()}{desktopPaths?.appVersion ? ` · v${desktopPaths.appVersion}` : ''}</dd></div>
                  <div><dt>Cloud sync</dt><dd>{pendingCount ? `${pendingCount} bill${pendingCount === 1 ? '' : 's'} waiting` : 'All bills synced'}{lastSyncedAt ? <small>Last sync {new Date(lastSyncedAt).toLocaleString('en-IN')}</small> : null}</dd></div>
                </dl>
                <button type="button" className="pos-secondary-action mt-3" onClick={requestSync}><RefreshCw size={14} /> Sync now</button>
              </div>

              {/* Data on this laptop */}
              <div className="pos-data-card pos-help-card">
                <div className="pos-data-heading"><div><h2>Where your data is saved</h2><span>Everything stays on this device first</span></div><Monitor size={20} /></div>
                {desktopPaths ? (
                  <>
                    <div className="pos-path-row">
                      <div><b>Invoices (PDF)</b><code title={desktopPaths.invoices}>{desktopPaths.invoices}</code><small>Sorted by year and month. {sales.filter(s => s.filePath).length} of {sales.length} bills saved as PDF.</small></div>
                      <button type="button" className="pos-secondary-action" onClick={() => void getDesktopBridge()?.openFolder('invoices', shop.name)}><ExternalLink size={14} /> Open</button>
                    </div>
                    <div className="pos-path-row">
                      <div><b>Backups</b><code title={desktopPaths.backups}>{desktopPaths.backups}</code><small>A backup is saved automatically once a day. The newest 30 are kept.</small></div>
                      <button type="button" className="pos-secondary-action" onClick={() => void getDesktopBridge()?.openFolder('backups', shop.name)}><ExternalLink size={14} /> Open</button>
                    </div>
                    <div className="pos-path-row">
                      <div><b>App database (encrypted)</b><code title={desktopPaths.appData}>{desktopPaths.appData}</code><small>Don’t delete this folder — it holds your live bills, stock and settings.</small></div>
                    </div>
                    {sales.some(s => !s.filePath) && (
                      <button
                        type="button"
                        className="pos-secondary-action mt-2"
                        onClick={async () => {
                          const missing = sales.filter(s => !s.filePath).slice(0, 200);
                          notify('sync', `Saving ${missing.length} invoice PDF${missing.length === 1 ? '' : 's'}…`, 'You can keep billing meanwhile.');
                          for (const s of missing) await saveInvoiceToLaptop(s);
                          notify('success', 'Invoice PDFs saved', desktopPaths.invoices, { action: { label: 'Open folder', onClick: () => { void getDesktopBridge()?.openFolder('invoices', shop.name); } } });
                        }}
                      >
                        <FileText size={14} /> Save missing invoice PDFs
                      </button>
                    )}
                  </>
                ) : (
                  <div className="space-y-2.5">
                    <div className="pos-path-row">
                      <div>
                        <b>Browser encrypted database (active now)</b>
                        <code>IndexedDB (origin-isolated browser storage)</code>
                        <small>You are currently in a web browser. Bills, stock and settings are saved in this browser’s encrypted IndexedDB. Use <b>Back up now</b> to save a file to your Downloads folder.</small>
                      </div>
                    </div>
                    <div className="pos-path-row">
                      <div>
                        <b>Desktop App Invoices (Windows / Mac)</b>
                        <code>{`Documents\\ollaiBooks\\${shop.name || 'My Business'}\\Invoices\\YYYY\\MM-Mon`}</code>
                        <small>Windows: <code>{`C:\\Users\\<User>\\Documents\\ollaiBooks\\${shop.name || 'My Business'}\\Invoices`}</code> · Mac: <code>{`~/Documents/ollaiBooks/${shop.name || 'My Business'}/Invoices`}</code></small>
                      </div>
                    </div>
                    <div className="pos-path-row">
                      <div>
                        <b>Desktop App Daily Backups</b>
                        <code>{`Documents\\ollaiBooks\\${shop.name || 'My Business'}\\Backups`}</code>
                        <small>App database (userData) — Windows: <code>%APPDATA%\ollaiBooks</code> · Mac: <code>~/Library/Application Support/ollaiBooks</code></small>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Backup awareness */}
              <div className={`pos-data-card pos-help-card ${backupOverdue ? 'pos-help-warn' : ''}`}>
                <div className="pos-data-heading"><div><h2>Backups</h2><span>Your safety net if this laptop is lost or reset</span></div><ArrowDownToLine size={20} /></div>
                <div className={`pos-backup-status ${backupOverdue ? 'warn' : 'ok'}`}>
                  {backupOverdue ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                  <div>
                    <b>{lastBackupAt ? `Last backup ${backupAgeDays === 0 ? 'today' : `${backupAgeDays} day${backupAgeDays === 1 ? '' : 's'} ago`}` : 'No backup yet'}</b>
                    <span>{billsSinceBackup ? `${billsSinceBackup} bill${billsSinceBackup === 1 ? '' : 's'} not in a backup yet.` : 'All bills are in your latest backup.'}</span>
                  </div>
                </div>
                <ul className="pos-help-list">
                  <li>Keep one copy <b>off this laptop</b> — a pen drive or Google Drive — every week.</li>
                  <li>Bills also sync to your cloud workspace when you’re online.</li>
                  <li>To move to a new laptop: install the app, sign in online, then <b>Restore backup</b> in Store &amp; Tax Setup.</li>
                </ul>
                <button type="button" className="pos-primary-action mt-3" onClick={() => void exportBackup()}><ArrowDownToLine size={14} /> Back up now</button>
              </div>

              {/* Helpline */}
              <div className="pos-data-card pos-help-card">
                <div className="pos-data-heading"><div><h2>Need help?</h2><span>Real people, {SUPPORT.hours}</span></div><CircleHelp size={20} /></div>
                <div className="pos-helpline">
                  <a href={SUPPORT.phoneHref}><Smartphone size={16} /><span><b>Call us</b>{SUPPORT.phone}</span></a>
                  <a href={SUPPORT.whatsapp} target="_blank" rel="noreferrer"><Share2 size={16} /><span><b>WhatsApp</b>Fastest reply, send screenshots</span></a>
                  <a href={`mailto:${SUPPORT.email}`}><FileText size={16} /><span><b>Email</b>{SUPPORT.email}</span></a>
                </div>
                <p className="pos-help-note">When you contact us, share your business name and app version{desktopPaths?.appVersion ? ` (v${desktopPaths.appVersion})` : ''}. Never share your password or PIN.</p>
              </div>
            </div>
          </section>
        )}

        {/* TAB 4: Store & Tax Settings */}
        {tab === 'settings' && (
          <section className="pos-section">
            <div className="pos-page-heading">
              <div>
                <div className="pos-eyebrow">
                  <Settings2 size={14} /> MULTI-TENANT CONFIGURATION
                </div>
                <h1>Store & Tax Settings<span>.</span></h1>
                <p>Customize your legal business profile, receipt header, and default GST rates.</p>
              </div>
            </div>

            <div className="pos-settings-layout">
              {/* Store Details Card */}
              <div className="pos-data-card pos-settings-card">
                <div className="pos-data-heading">
                  <div>
                    <h2>Business Profile</h2>
                    <span>Your customers see this on every receipt, GST invoice and KOT</span>
                  </div>
                  <Building2 size={21} />
                </div>
                <div className="pos-logo-row">
                  <div className="pos-logo-preview">
                    {shop.logo ? <img src={shop.logo} alt={`${shop.name} logo`} /> : <LogoUploadIllustration className="w-14 h-14" />}
                  </div>
                  <div className="pos-logo-copy">
                    <b>Company logo</b>
                    <span>Shows in the app, on A4 invoices and (in black &amp; white) on thermal bills. PNG or JPG with a clear background works best.</span>
                    <div className="pos-logo-actions">
                      <label className="pos-secondary-action pos-import-button cursor-pointer">
                        <Upload size={14} /> {shop.logo ? 'Change logo' : 'Upload logo'}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/svg+xml"
                          onChange={async e => {
                            const file = e.target.files?.[0];
                            e.target.value = '';
                            if (!file) return;
                            try {
                              const logo = await resizeLogo(file);
                              setShop(prev => ({ ...prev, logo }));
                              recordAudit('logo.updated', `Logo uploaded (${file.name})`);
                              notify('success', 'Logo looks great', 'It’s saved on this device and will appear on all your bills — even offline.');
                            } catch (error) {
                              notify('error', 'Logo not added', error instanceof Error ? error.message : 'Try a different image.');
                            }
                          }}
                        />
                      </label>
                      {shop.logo && (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 flex-none"
                          onClick={() => { setShop(prev => ({ ...prev, logo: undefined })); recordAudit('logo.updated', 'Logo removed'); notify('info', 'Logo removed', 'Bills will show your store initial instead.'); }}
                        >
                          <Trash2 size={13} /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <label>
                  Legal Business / Store Name
                  <input
                    value={shop.name}
                    onChange={e => setShop({ ...shop, name: e.target.value })}
                  />
                </label>
                <label>
                  Business type & offline template
                  <input list="billdesk-industry-types" value={shop.businessType} onChange={e => setShop({ ...shop, businessType: e.target.value })} placeholder="Type your business type" />
                  <datalist id="billdesk-industry-types">
                    <option value="Bakery & Confectionery" />
                    <option value="Salon & Spa" />
                    <option value="Restaurant" />
                    <option value="Café & Restaurant" />
                    <option value="Retail & E-Commerce" />
                    <option value="Supermarket & Grocery" />
                    <option value="Electronics & Tech Store" />
                    <option value="Professional Services" />
                    <option value="Healthcare & Pharmacy" />
                  </datalist>
                  <span className="pos-label-muted">This workspace’s template is saved offline. Current template: {industry.title}.</span>
                </label>
                <label>
                  Phone Number
                  <input
                    value={shop.phone}
                    onChange={e => setShop({ ...shop, phone: e.target.value })}
                  />
                </label>
                <label>
                  Store Address
                  <input
                    value={shop.address}
                    onChange={e => setShop({ ...shop, address: e.target.value })}
                  />
                </label>
                <label>
                  <span>GSTIN <span className="pos-label-muted">(15 chars · auto-detects state)</span></span>
                  <input
                    value={shop.gstin}
                    onChange={e => {
                      const nextGstin = e.target.value.toUpperCase();
                      const detected = detectGstState(nextGstin);
                      setShop({
                        ...shop,
                        gstin: nextGstin,
                        ...(detected ? { state: detected.name } : {}),
                      } as typeof shop);
                    }}
                    placeholder="29ABCDE1234F1Z5"
                    maxLength={15}
                  />
                </label>
                <label>
                  <span>Business State <span className="pos-label-muted">(CGST+SGST vs IGST)</span></span>
                  <select
                    value={(shop as { state?: string }).state || resolvedShopState?.name || ''}
                    onChange={e => setShop({ ...shop, state: e.target.value } as typeof shop)}
                  >
                    <option value="">Auto-detect from GSTIN / Address</option>
                    {INDIAN_GST_STATES.map(st => (
                      <option key={st.code} value={st.name}>{st.name} ({st.code})</option>
                    ))}
                  </select>
                </label>
                {shop.gstin && !GSTIN_PATTERN.test(shop.gstin) && (
                  <small className="pos-hint-error">This GSTIN doesn’t look complete yet. It should be 15 characters, e.g. 33ABCDE1234F1Z5.</small>
                )}
                <label>
                  <span>GST registration <span className="pos-label-muted">(decides the invoice title)</span></span>
                  <select
                    value={shop.gstRegistration || (shop.gstin ? 'regular' : 'unregistered')}
                    onChange={e => setShop({ ...shop, gstRegistration: e.target.value as GstRegistrationType })}
                  >
                    <option value="regular">Regular taxpayer · prints “TAX INVOICE”</option>
                    <option value="composition">Composition scheme · prints “BILL OF SUPPLY”</option>
                    <option value="unregistered">Not registered · prints “CASH MEMO”</option>
                  </select>
                </label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label>
                    Email
                    <input type="email" value={shop.email || ''} onChange={e => setShop({ ...shop, email: e.target.value })} placeholder="billing@yourstore.in" />
                  </label>
                  <label>
                    FSSAI licence <span className="pos-label-muted">(food business)</span>
                    <input value={shop.fssai || ''} onChange={e => setShop({ ...shop, fssai: e.target.value.replace(/\D/g, '').slice(0, 14) })} placeholder="14-digit number" inputMode="numeric" />
                  </label>
                </div>

                <div className="pos-subheading">Invoice &amp; payment details</div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
                  <label>
                    UPI ID <span className="pos-label-muted">(printed so customers can pay)</span>
                    <input value={shop.upiId || ''} onChange={e => setShop({ ...shop, upiId: e.target.value.trim() })} placeholder="yourstore@okaxis" />
                  </label>
                  <label>
                    Primary colour
                    <input type="color" className="pos-color-input" value={shop.brandColor || '#2563eb'} onChange={e => setShop({ ...shop, brandColor: e.target.value })} />
                  </label>
                  <label>
                    Secondary colour
                    <input type="color" className="pos-color-input" value={shop.secondaryColor || '#64748b'} onChange={e => setShop({ ...shop, secondaryColor: e.target.value })} />
                  </label>
                </div>
                <label>
                  Bank details <span className="pos-label-muted">(A4 invoices)</span>
                  <textarea rows={2} value={shop.bankDetails || ''} onChange={e => setShop({ ...shop, bankDetails: e.target.value })} placeholder={'Bank: State Bank of India · A/c 1234567890\nIFSC: SBIN0001234 · Branch: Anna Nagar'} />
                </label>
                <label>
                  Terms &amp; conditions
                  <textarea rows={2} value={shop.terms || ''} onChange={e => setShop({ ...shop, terms: e.target.value })} placeholder={'1. Goods once sold will not be taken back.\n2. Subject to local jurisdiction.'} />
                </label>
                <label>
                  Thank-you line on bills
                  <input value={shop.footerNote || ''} onChange={e => setShop({ ...shop, footerNote: e.target.value })} placeholder="Thank you! Please visit again." maxLength={90} />
                </label>
              </div>

              {/* Right Column: Tax & Backup + Machine Printing stacked evenly */}
              <div className="flex flex-col gap-4 min-w-0">
                {/* Tax & Backup Card */}
                <div className="pos-data-card pos-settings-card">
                  <div className="pos-data-heading">
                    <div>
                      <h2>Tax Rates & Excel Sync</h2>
                      <span>GST rates applied during billing calculation</span>
                    </div>
                    <BadgeIndianRupee size={21} />
                  </div>
                  <div className="pos-setting-toggle">
                    <span>
                      <b>Enable GST Calculation</b>
                      <small>Calculate CGST + SGST (or IGST) automatically on sales.</small>
                    </span>
                    <button
                      className={`pos-switch ${taxEnabled ? 'on' : ''}`}
                      onClick={() => setTaxEnabled(!taxEnabled)}
                      aria-label="Toggle GST"
                    >
                      <i />
                    </button>
                  </div>
                  <label>
                    Default GST Rate (%)
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={taxRate}
                      onChange={e => setTaxRate(Math.max(0, Math.min(100, Number(e.target.value))))}
                    />
                  </label>

                  <div className="pos-backup-block">
                    <FileSpreadsheet size={21} />
                    <div>
                      <b>Connect Spreadsheets</b>
                      <span>Export sales and products directly to Excel or Google Sheets.</span>
                    </div>
                    <button onClick={downloadSampleTemplate}>
                      <Download size={14} /> Sample CSV
                    </button>
                  </div>

                  <button className="pos-secondary-action pos-sheet-export" onClick={exportSales}>
                    <FileSpreadsheet size={16} /> Export All Sales to Excel CSV
                  </button>

                  <div className="grid grid-cols-2 gap-2.5">
                    <button type="button" className="pos-secondary-action w-full justify-center" onClick={() => void exportBackup()}>
                      <ArrowDownToLine size={15} /> Device Backup
                    </button>
                    <label className="pos-secondary-action pos-import-button w-full justify-center cursor-pointer">
                      <ArrowUpFromLine size={15} /> Restore Backup
                      <input type="file" accept="application/json,.json" onChange={e => importBackup(e.target.files?.[0])} />
                    </label>
                  </div>
                </div>

                {/* Machine Printing & Invoice Templates Card */}
                <div className="pos-data-card pos-settings-card">
                  <div className="pos-data-heading">
                    <div>
                      <h2>Machine Printing &amp; Invoice Templates</h2>
                      <span>Configure thermal machine width, extra GST invoice template, and auto-print</span>
                    </div>
                    <Printer size={21} />
                  </div>
                  <label>
                    Default Bill / Invoice Template
                    <select
                      value={invoiceTemplate}
                      onChange={e => setInvoiceTemplate(e.target.value as InvoiceTemplateId)}
                    >
                      <option value="thermal">Thermal POS Receipt (80mm / 58mm Machine)</option>
                      <option value="classic-gst">Classic GST Tax Invoice (A4 Bordered)</option>
                      <option value="modern-gst">Modern Branded GST Invoice (Extra A4 Template)</option>
                    </select>
                  </label>
                  <label>
                    Thermal Machine Paper Width
                    <select
                      value={paperWidth}
                      onChange={e => setPaperWidth(e.target.value as ThermalPaperWidth)}
                    >
                      <option value="80mm">80mm Standard POS Thermal Roll</option>
                      <option value="58mm">58mm Compact / Handheld Machine Roll</option>
                    </select>
                  </label>
                  <label>
                    After Completing Sale (Auto-Print)
                    <select
                      value={autoPrintOnComplete}
                      onChange={e => setAutoPrintOnComplete(e.target.value as 'none' | 'bill' | 'kot-and-bill')}
                    >
                      <option value="none">Show Print &amp; KOT Popup (Recommended)</option>
                      <option value="bill">Auto-Print Customer Bill Immediately</option>
                      <option value="kot-and-bill">Auto-Print KOT + Customer Bill Together</option>
                    </select>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" className="pos-secondary-action" onClick={() => setShowTemplatePreview(v => !v)}>
                      <FileText size={14} /> {showTemplatePreview ? 'Hide preview' : 'Preview this template'}
                    </button>
                    <button
                      type="button"
                      className="pos-secondary-action"
                      onClick={() => {
                        try {
                          printInvoiceDocument(buildSampleSale(taxEnabled ? taxRate : 0, false), shop, { template: invoiceTemplate, paperWidth });
                        } catch (error) {
                          notify('error', 'Print window blocked', error instanceof Error ? error.message : 'Allow pop-ups and try again.');
                        }
                      }}
                    >
                      <Printer size={14} /> Test print
                    </button>
                    <button
                      type="button"
                      className="pos-secondary-action"
                      onClick={() => {
                        try {
                          printKitchenOrderTicket(buildSampleSale(taxRate), { paperWidth, shopName: shop.name });
                        } catch (error) {
                          notify('error', 'Print window blocked', error instanceof Error ? error.message : 'Allow pop-ups and try again.');
                        }
                      }}
                    >
                      <Receipt size={14} /> Test KOT
                    </button>
                  </div>
                  {showTemplatePreview && (
                    <div className={`pos-template-preview ${invoiceTemplate === 'thermal' ? 'thermal' : 'a4'}`}>
                      <iframe
                        title="Invoice template preview"
                        sandbox=""
                        srcDoc={buildInvoiceHtml(buildSampleSale(taxEnabled ? taxRate : 0, false), shop, { template: invoiceTemplate, paperWidth, autoPrint: false })}
                      />
                      <small>Sample bill with your logo, GSTIN and settings. Real bills use the customer’s details.</small>
                    </div>
                  )}
                </div>

                {/* App Theme & Colours Card */}
                <div className="pos-data-card pos-settings-card">
                  <div className="pos-data-heading">
                    <div>
                      <h2>App Theme &amp; Colours</h2>
                      <span>Try new colour themes or customize the billing app</span>
                    </div>
                    <Palette size={20} />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {APP_THEME_PRESETS.map((preset) => {
                      const active =
                        (shop.appAccentColor || '#2563eb').toLowerCase() === preset.accent &&
                        (shop.appSurfaceColor || '#f1f5f9').toLowerCase() === preset.surface;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => setShop({ ...shop, appAccentColor: preset.accent, appSurfaceColor: preset.surface, appSidebarColor: preset.sidebar })}
                          className={`inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                            active ? 'border-[var(--brand-blue)] bg-[var(--brand-blue-soft)] text-[var(--brand-blue-hover)]' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="inline-flex items-center gap-1">
                            <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: preset.accent }} />
                            <span className="h-3 w-3 rounded-full border border-slate-300" style={{ background: preset.surface }} />
                          </span>
                          {preset.name}
                        </button>
                      );
                    })}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-1">
                    <label>
                      App accent
                      <input type="color" className="pos-color-input" value={safeHex(shop.appAccentColor, '#2563eb')} onChange={e => setShop({ ...shop, appAccentColor: e.target.value })} />
                    </label>
                    <label>
                      Background tint
                      <input type="color" className="pos-color-input" value={safeHex(shop.appSurfaceColor, '#f1f5f9')} onChange={e => setShop({ ...shop, appSurfaceColor: e.target.value })} />
                    </label>
                    <label>
                      Sidebar colour
                      <input type="color" className="pos-color-input" value={safeHex(shop.appSidebarColor, '#ffffff')} onChange={e => setShop({ ...shop, appSidebarColor: e.target.value })} />
                    </label>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="pos-secondary-action"
                      onClick={() => setShop({ ...shop, appAccentColor: '#2563eb', appSurfaceColor: '#f1f5f9', appSidebarColor: '#ffffff' })}
                    >
                      Reset to Blue &amp; Silver
                    </button>
                  </div>
                </div>

                {/* Offline Security & Counter PIN Lock Card */}
                <div className="pos-data-card pos-settings-card">
                  <div className="pos-data-heading">
                    <div>
                      <h2>Offline Vault &amp; Counter PIN Lock</h2>
                      <span>Protect local bills, customer records &amp; counter terminal</span>
                    </div>
                    <ShieldCheck size={21} className="text-emerald-600" />
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-900 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5"><Lock size={13} /> Local Vault Encryption</span>
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-800">
                        {vaultEncrypted ? 'AES-GCM-256 + SHA-256' : 'Standard Storage'}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800">
                      All offline bills, stock, and customer records for this workspace are encrypted at rest on this device.
                    </p>
                  </div>
                  <label>
                    <span>Counter Lock PIN <span className="pos-label-muted">(4–6 digits)</span></span>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={newPinInput}
                        onChange={e => setNewPinInput(e.target.value.replace(/\D/g, ''))}
                        placeholder={hasCounterPin ? 'Enter new 4–6 digit PIN' : 'Set 4–6 digit PIN'}
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          if (newPinInput.length < 4) {
                            setToast('Enter at least 4 digits for the Counter PIN.');
                            return;
                          }
                          await setOfflineCounterPin(activeTenantId, newPinInput);
                          setHasCounterPin(true);
                          setNewPinInput('');
                          setToast('✓ Counter PIN saved securely on this device.');
                          recordAudit('security.pin_set', 'Counter PIN lock set or changed');
                        }}
                        className="pos-primary-action"
                      >
                        <KeyRound size={14} /> {hasCounterPin ? 'Update PIN' : 'Enable PIN'}
                      </button>
                    </div>
                  </label>
                  {hasCounterPin && (
                    <div className="flex items-center justify-between pt-1">
                      <button
                        type="button"
                        onClick={() => { setPinInput(''); setPinError(''); setCounterLocked(true); }}
                        className="pos-secondary-action"
                      >
                        <Lock size={14} /> Lock Counter Now
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await setOfflineCounterPin(activeTenantId, null);
                          setHasCounterPin(false);
                          setToast('Counter PIN lock disabled for this workspace.');
                          recordAudit('security.pin_removed', 'Counter PIN lock turned off');
                        }}
                        className="text-xs font-semibold text-rose-600 hover:underline"
                      >
                        Remove PIN
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sync status + audit trail */}
            <div className="pos-data-card pos-audit-card">
              <div className="pos-data-heading">
                <div>
                  <h2>Sync status &amp; audit trail</h2>
                  <span>Every bill, sync, stock change and setting is recorded in a tamper-evident log, stored encrypted on this device</span>
                </div>
                <AuditShieldIllustration className="w-16 h-auto" />
              </div>

              <div className="pos-sync-states">
                <div className={`pos-sync-state ${online ? 'ok' : 'warn'}`}>
                  {online ? <Wifi size={18} /> : <WifiOff size={18} />}
                  <div><b>{online ? 'Online' : 'Offline'}</b><span>{online ? 'Connected to the internet' : 'Billing continues on this device'}</span></div>
                </div>
                <div className={`pos-sync-state ${pendingCount ? 'warn' : 'ok'}`}>
                  <CloudOff size={18} />
                  <div><b>{pendingCount} waiting</b><span>{pendingCount ? 'Saved on device, not yet in cloud' : 'Nothing waiting to sync'}</span></div>
                </div>
                <div className="pos-sync-state ok">
                  <Cloud size={18} />
                  <div><b>{sales.filter(s => s.sync === 'synced').length} synced</b><span>{lastSyncedAt ? `Last sync ${new Date(lastSyncedAt).toLocaleString('en-IN')}` : 'No sync yet on this device'}</span></div>
                </div>
                {(() => {
                  const chain = verifyAuditChain(auditLog);
                  return (
                    <div className={`pos-sync-state ${chain.ok ? 'ok' : 'bad'}`}>
                      <ShieldCheck size={18} />
                      <div><b>{chain.ok ? 'Log verified' : 'Log altered'}</b><span>{chain.ok ? `${chain.checked} entries, chain intact` : `Mismatch at entry ${(chain.brokenAt ?? 0) + 1}`}</span></div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-3">
                <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Audit filter">
                  {([['all', 'All'], ['sale', 'Bills'], ['sync', 'Sync & network'], ['stock', 'Stock & products'], ['settings', 'Settings & security']] as const).map(([id, label]) => (
                    <button key={id} type="button" role="tab" aria-selected={auditFilter === id} onClick={() => setAuditFilter(id)} className={`pos-audit-filter ${auditFilter === id ? 'active' : ''}`}>{label}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button type="button" className="pos-secondary-action" onClick={requestSync}><RefreshCw size={14} /> Sync now</button>
                  <button
                    type="button"
                    className="pos-secondary-action"
                    onClick={() => {
                      const rows = [['Time', 'Action', 'Details', 'Reference', 'Amount (INR)', 'By', 'Hash'], ...auditLog.map(a => [new Date(a.at).toLocaleString('en-IN'), AUDIT_LABELS[a.action] || a.action, a.summary, a.ref || '', a.amount ?? '', a.actor, a.hash])];
                      download(`ollaibooks-audit-${activeTenantId}-${new Date().toISOString().slice(0, 10)}.csv`, `﻿${rows.map(r => r.map(csvCell).join(',')).join('\n')}`, 'text/csv;charset=utf-8');
                      notify('success', 'Audit log exported', 'Open it in Excel or share it with your accountant.');
                    }}
                    disabled={!auditLog.length}
                  >
                    <Download size={14} /> Export
                  </button>
                </div>
              </div>

              <ol className="pos-audit-list">
                {(() => {
                  const prefixes: Record<typeof auditFilter, string[]> = {
                    all: [], sale: ['sale.'], sync: ['sync.', 'network.'], stock: ['stock.', 'product.'], settings: ['settings.', 'logo.', 'backup.', 'security.'],
                  };
                  const list = auditLog
                    .filter(a => auditFilter === 'all' || prefixes[auditFilter].some(p => a.action.startsWith(p)))
                    .slice(-60)
                    .reverse();
                  if (!list.length) {
                    return <li className="pos-audit-empty">Nothing recorded here yet. Your next bill or change will show up instantly.</li>;
                  }
                  return list.map(a => (
                    <li key={a.id} className={`pos-audit-item sev-${auditSeverity(a.action)}`}>
                      <span className="pos-audit-dot" />
                      <div className="pos-audit-main">
                        <b>{AUDIT_LABELS[a.action] || a.action}</b>
                        <span>{a.summary}</span>
                      </div>
                      <div className="pos-audit-meta">
                        {typeof a.amount === 'number' && <b>{money(a.amount)}</b>}
                        <span>{new Date(a.at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        <code title="Chain hash">#{a.hash}</code>
                      </div>
                    </li>
                  ));
                })()}
              </ol>
            </div>
          </section>
        )}

        {/* Global Footer */}
        <footer className="pos-footer">
          <span>
            ollaiBooks POS · {shop.name}
          </span>
          <span>
            <span className={`pos-dot ${online ? '' : 'offline'}`} /> {online ? 'Online' : 'Offline'} · {storageMode === 'indexeddb' ? (vaultEncrypted ? 'Encrypted device vault' : 'Device database') : 'Browser storage'} · {pendingCount ? `${pendingCount} to sync` : 'All synced'}
          </span>
        </footer>
      </section>

      {/* Counter PIN Lock Overlay */}
      {counterLocked && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-md">
          <form
            onSubmit={async e => {
              e.preventDefault();
              const ok = await verifyOfflineCounterPin(activeTenantId, pinInput);
              if (ok) {
                setCounterLocked(false);
                setPinInput('');
                setPinError('');
              } else {
                setPinError('Incorrect PIN. Please try again.');
              }
            }}
            className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-blue-soft)] text-[var(--brand-blue)] border border-[var(--brand-blue-border)]">
              <Lock size={22} />
            </div>
            <h2 className="text-center text-lg font-extrabold">Counter Terminal Locked</h2>
            <p className="mt-1 text-center text-xs text-slate-400">
              Enter your 4–6 digit PIN to unlock <strong>{shop.name}</strong>
            </p>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              maxLength={6}
              value={pinInput}
              onChange={e => { setPinInput(e.target.value.replace(/\D/g, '')); setPinError(''); }}
              placeholder="••••"
              className="mt-5 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-center text-2xl font-bold tracking-[0.5em] text-white focus:border-[var(--brand-blue)] focus:outline-none"
            />
            {pinError && <p className="mt-2 text-center text-xs font-semibold text-rose-400">{pinError}</p>}
            <button
              type="submit"
              className="mt-4 w-full rounded-xl bg-[var(--brand-blue)] py-3 text-sm font-bold text-white hover:bg-[var(--brand-blue-hover)] transition"
            >
              Unlock Workspace
            </button>
            <button
              type="button"
              onClick={() => { clearPosSession(); router.replace('/login'); }}
              className="mt-3 w-full py-1.5 text-center text-xs text-slate-400 hover:text-white"
            >
              Sign out workspace
            </button>
          </form>
        </div>
      )}

      {/* 2.0 Post-Sale Modal: KOT & Machine Bill Generation */}
      {completedSale && (
        <div
          className="pos-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={event => { if (event.target === event.currentTarget) setCompletedSale(null); }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="pos-completed-sale-title"
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h2 id="pos-completed-sale-title" className="text-base font-extrabold text-slate-900">
                    Bill Completed · {completedSale.number}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {completedSale.customer} · {completedSale.method} · <strong className="text-slate-900">{money(completedSale.total)}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCompletedSale(null)}
                aria-label="Close completed bill modal"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Machine Print Actions */}
              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Print on POS Machine ({paperWidth})
                </p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => {
                      try {
                        printKitchenOrderTicket(completedSale, { paperWidth, shopName: shop.name });
                      } catch (err) {
                        setToast(err instanceof Error ? err.message : 'Allow pop-ups to print KOT.');
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-900 hover:bg-amber-100 transition"
                  >
                    <Printer size={16} /> Print KOT Ticket
                  </button>
                  <button
                    type="button"
                    onClick={() => printReceipt(completedSale)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand-blue)] px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-[var(--brand-blue-hover)] transition"
                  >
                    <Receipt size={16} /> Generate Bill ({invoiceTemplate === 'thermal' ? paperWidth : invoiceTemplate === 'classic-gst' ? 'Classic A4' : 'Modern A4'})
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      printKotAndBill(completedSale, shop, { paperWidth });
                    } catch (err) {
                      setToast(err instanceof Error ? err.message : 'Allow pop-ups to print KOT & Bill.');
                    }
                  }}
                  className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-900 bg-slate-900 px-4 py-3 text-xs font-bold text-white hover:bg-slate-800 transition"
                >
                  <Printer size={16} /> Print KOT + Customer Bill Together (1-Click Machine Job)
                </button>
              </div>

              {/* Invoice Template Picker (includes Extra Template) */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
                    Choose Invoice Template
                  </span>
                  <span className="text-[11px] text-slate-500">Paper: {paperWidth}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {([
                    { id: 'thermal', label: 'Thermal POS', sub: `${paperWidth} Roll` },
                    { id: 'classic-gst', label: 'Classic GST', sub: 'A4 Tax Sheet' },
                    { id: 'modern-gst', label: 'Modern GST', sub: 'Extra Template' },
                  ] as const).map(tpl => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setInvoiceTemplate(tpl.id)}
                      className={`rounded-lg border p-2 text-left transition ${
                        invoiceTemplate === tpl.id
                          ? 'border-[var(--brand-blue)] bg-[var(--brand-blue-soft)] text-[var(--ink)] ring-1 ring-[var(--brand-blue)]'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="font-bold">{tpl.label}</div>
                      <div className="text-[10px] text-slate-500">{tpl.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                onClick={() => setCompletedSale(null)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                <Plus size={15} /> Start Next Bill
              </button>
            </div>
          </section>
        </div>
      )}

      {calculatorOpen && (
        <div className="pos-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setCalculatorOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="pos-calculator-title" className="w-full max-w-[340px] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-3.5 flex items-center justify-between">
              <h2 id="pos-calculator-title" className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--brand-blue-soft)] text-[var(--brand-blue)]">
                  <Calculator size={15} />
                </span>
                Quick Calculator
              </h2>
              <button type="button" onClick={() => setCalculatorOpen(false)} aria-label="Close calculator" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition"><X size={17} /></button>
            </div>
            <div className="mb-3.5 rounded-xl border border-slate-200 bg-[var(--silver-soft)] px-4 py-3">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => { void navigator.clipboard?.writeText(calculatorDisplay); notify('info', 'Copied', `${calculatorDisplay} copied to clipboard.`); }}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 hover:border-[var(--brand-blue-border)] hover:text-[var(--brand-blue-hover)] transition flex-none"
                  title="Copy result"
                >
                  <Copy size={11} /> Copy
                </button>
                <span className="truncate text-right text-sm font-semibold text-slate-700 tabular-nums">
                  {calculatorAccumulator !== null && calculatorOperator
                    ? (calculatorReplaceDisplay ? `${calculatorAccumulator} ${calculatorOperator}` : `${calculatorAccumulator} ${calculatorOperator} ${calculatorDisplay}`)
                    : calculatorHistory || 'Ready'}
                </span>
              </div>
              <output aria-live="polite" className="block overflow-hidden text-ellipsis whitespace-nowrap text-right text-3xl font-bold tracking-tight text-slate-900 tabular-nums">{calculatorDisplay}</output>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {['C', '⌫', '%', '÷', '7', '8', '9', '×', '4', '5', '6', '−', '1', '2', '3', '+', '00', '0', '.', '='].map((key, index) => {
                const operator = ['%', '÷', '×', '−', '+'].includes(key);
                return (
                  <button
                    key={`${key}-${index}`}
                    type="button"
                    onClick={() => calculatorPress(key)}
                    className={`min-h-11 rounded-xl border text-sm font-bold transition active:scale-95 ${
                      key === '='
                        ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white shadow-sm hover:bg-[var(--brand-blue-hover)]'
                        : operator
                          ? 'border-[var(--brand-blue-border)] bg-[var(--brand-blue-soft)] text-[var(--brand-blue-hover)] hover:bg-[var(--brand-blue-border)]'
                          : key === 'C'
                            ? 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'border-slate-200 bg-white text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-center text-[11px] text-slate-500">Quick calculations stay separate from your bill totals.</p>
          </section>
        </div>
      )}

      {/* 2.5 In-App Modal: Convert & Install Native App */}
      {nativeModalOpen && (
        <div
          className="pos-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          role="presentation"
          onMouseDown={e => { if (e.target === e.currentTarget) setNativeModalOpen(false); }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="pos-native-modal-title"
            className="w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-blue)] text-white shadow-md shadow-slate-900/10">
                  <Download size={20} />
                </div>
                <div>
                  <h2 id="pos-native-modal-title" className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    ollaiBooks App Downloads
                    <span className="rounded-full bg-[var(--brand-blue-soft)] text-[var(--brand-blue-hover)] text-[10px] font-bold px-2 py-0.5">OFFLINE POS</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Download the installer for your device. Available files are linked directly from the latest release.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNativeModalOpen(false)}
                aria-label="Close modal"
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick 1-Click Banner */}
            <div className="px-6 pt-4">
              {installEnvironment === 'installed' ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
                  <p className="text-sm font-bold">ollaiBooks is installed</p>
                  <p className="mt-1 text-xs">This app is running in its installed window.</p>
                </div>
              ) : installPrompt ? (
                <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white shadow-md">
                  <div>
                    <p className="text-sm font-bold flex items-center gap-1.5"><Sparkles size={16} /> Install ollaiBooks</p>
                    <p className="text-xs text-blue-100 mt-0.5">Your browser will ask you to confirm installation.</p>
                  </div>
                  <button
                    onClick={triggerDirectInstall}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-bold text-[var(--brand-blue-hover)] shadow hover:bg-[var(--brand-blue-soft)] active:scale-95 transition-all whitespace-nowrap"
                  >
                    <Sparkles size={14} /> Install App Now
                  </button>
                </div>
              ) : installEnvironment === 'ios-browser' ? (
                <div className="rounded-xl border border-[var(--brand-blue-border)] bg-[var(--brand-blue-soft)] p-4 text-blue-950">
                  <p className="text-sm font-bold">Add ollaiBooks to your Home Screen</p>
                  <p className="mt-1 text-xs">In Safari, tap Share, choose Add to Home Screen, then tap Add. iOS does not provide a website-triggered install prompt.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-[var(--brand-blue-border)] bg-[var(--brand-blue-soft)] p-4 text-blue-950">
                  <p className="text-sm font-bold">Install from your browser</p>
                  <p className="mt-1 text-xs">Choose Install app from your browser menu or address bar. Installation options vary by browser and device.</p>
                </div>
              )}
            </div>

            <div className="px-6 pt-3">
              <div className={`flex items-center justify-between rounded-xl border p-3 text-xs ${storagePersistence === 'persistent' ? 'border-emerald-200 bg-emerald-50/80 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-950'}`} role="status" aria-live="polite">
                <div>
                  <p className="font-semibold">{storagePersistence === 'checking' ? 'Checking device storage protection…' : storagePersistence === 'persistent' ? 'Persistent storage was granted for this site.' : 'Browser storage is best-effort on this device.'}</p>
                  <p className="mt-1">{storagePersistence === 'persistent' ? `Local bills use ${storageMode === 'indexeddb' ? 'IndexedDB' : 'local storage'}. Keep regular backups; browser settings can still erase site data.` : 'Export a device backup regularly. Storage permission cannot be guaranteed by the app.'}</p>
                </div>
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${storagePersistence === 'persistent' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>{storagePersistence === 'persistent' ? 'PROTECTED' : storagePersistence === 'checking' ? 'CHECKING' : 'BACKUP ADVISED'}</span>
              </div>
            </div>

            {/* Platform Selector Tabs */}
            <div className="flex border-b border-slate-200 px-6 pt-3 gap-2 overflow-x-auto text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActivePlatformTab('android')}
                className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${activePlatformTab === 'android' ? 'border-[var(--brand-blue)] text-[var(--brand-blue)]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                <Smartphone size={15} /> Android (APK)
              </button>
              <button
                type="button"
                onClick={() => setActivePlatformTab('windows')}
                className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${activePlatformTab === 'windows' ? 'border-[var(--brand-blue)] text-[var(--brand-blue)]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                <Monitor size={15} /> Windows (.EXE)
              </button>
              <button
                type="button"
                onClick={() => setActivePlatformTab('mac')}
                className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${activePlatformTab === 'mac' ? 'border-[var(--brand-blue)] text-[var(--brand-blue)]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                <Laptop size={15} /> macOS (.DMG)
              </button>
              <button
                type="button"
                onClick={() => setActivePlatformTab('ios')}
                className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${activePlatformTab === 'ios' ? 'border-[var(--brand-blue)] text-[var(--brand-blue)]' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                <Store size={15} /> iPad &amp; iPhone
              </button>
            </div>

            {/* Modal Body / Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
              <div className={`flex items-center justify-between rounded-xl border p-3 ${nativeDownloads?.release ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                <div>
                  <p className="font-semibold text-slate-800">{nativeDownloads?.release ? `Latest release: ${nativeDownloads.release.name}` : nativeDownloads?.unavailable ? 'Download status is temporarily unavailable' : 'Checking published downloads…'}</p>
                  <p className="mt-0.5 text-slate-600">Download buttons appear only for installers that have actually been published.</p>
                </div>
                {nativeDownloads?.release && <a href={nativeDownloads.release.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-[var(--brand-blue-hover)] hover:underline">Release notes</a>}
              </div>

              {activePlatformTab === 'android' && (
                <div className="space-y-4">
                  {nativeDownloads?.downloads.android ? (
                    <a href={nativeDownloads.downloads.android.url} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[var(--brand-blue-border)] hover:shadow-md">
                      <span><strong className="block text-sm text-slate-900">ollaiBooks for Android</strong><span className="mt-1 block text-slate-500">APK installer · {nativeDownloads.downloads.android.name}</span></span><span className="rounded-lg bg-[var(--brand-blue)] px-4 py-2.5 font-bold text-white">Download APK</span>
                    </a>
                  ) : <div className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="text-sm font-bold text-slate-900">Android app installer</h3><p className="mt-2 text-slate-600">An APK download will show here after it is included in a published release. For now, open ollaiBooks in Chrome and choose <strong>Install app</strong> from the browser menu.</p></div>}
                </div>
              )}

              {activePlatformTab === 'windows' && (
                <div className="space-y-4">
                  {nativeDownloads?.downloads.windows ? (
                    <a href={nativeDownloads.downloads.windows.url} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[var(--brand-blue-border)] hover:shadow-md">
                      <span><strong className="block text-sm text-slate-900">ollaiBooks for Windows</strong><span className="mt-1 block text-slate-500">Windows installer · {nativeDownloads.downloads.windows.name}</span></span><span className="rounded-lg bg-[var(--brand-blue)] px-4 py-2.5 font-bold text-white">Download EXE</span>
                    </a>
                  ) : <div className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="text-sm font-bold text-slate-900">Windows installer</h3><p className="mt-2 text-slate-600">The Windows installer will be available here after the first native release is published.</p></div>}
                </div>
              )}

              {activePlatformTab === 'mac' && (
                <div className="space-y-4">
                  {nativeDownloads?.downloads.mac ? (
                    <a href={nativeDownloads.downloads.mac.url} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-[var(--brand-blue-border)] hover:shadow-md">
                      <span><strong className="block text-sm text-slate-900">ollaiBooks for macOS</strong><span className="mt-1 block text-slate-500">Disk image · {nativeDownloads.downloads.mac.name}</span></span><span className="rounded-lg bg-[var(--brand-blue)] px-4 py-2.5 font-bold text-white">Download DMG</span>
                    </a>
                  ) : <div className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="text-sm font-bold text-slate-900">macOS installer</h3><p className="mt-2 text-slate-600">The macOS disk image will be available after a release is built on macOS. Safari users can also add the web app to the Dock.</p></div>}
                </div>
              )}

              {activePlatformTab === 'ios' && (
                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
                  <h3 className="text-sm font-bold text-slate-900">Install on iPhone or iPad</h3>
                  {(process.env.NEXT_PUBLIC_IOS_APPSTORE_URL || process.env.NEXT_PUBLIC_IOS_TESTFLIGHT_URL) ? (
                    <div className="space-y-2.5">
                      {process.env.NEXT_PUBLIC_IOS_APPSTORE_URL && (
                        <a
                          href={process.env.NEXT_PUBLIC_IOS_APPSTORE_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-[var(--brand-blue-border)] hover:shadow-md transition"
                        >
                          <span>
                            <strong className="block text-sm text-slate-900">ollaiBooks for iPhone &amp; iPad</strong>
                            <span className="mt-0.5 block text-slate-500">Official Apple App Store release</span>
                          </span>
                          <span className="rounded-lg bg-[var(--brand-blue)] px-4 py-2 font-bold text-white">App Store</span>
                        </a>
                      )}
                      {process.env.NEXT_PUBLIC_IOS_TESTFLIGHT_URL && (
                        <a
                          href={process.env.NEXT_PUBLIC_IOS_TESTFLIGHT_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-[var(--brand-blue-border)] hover:shadow-md transition"
                        >
                          <span>
                            <strong className="block text-sm text-slate-900">TestFlight Beta (iOS / iPadOS)</strong>
                            <span className="mt-0.5 block text-slate-500">Early-access native build via Apple TestFlight</span>
                          </span>
                          <span className="rounded-lg border border-[var(--brand-blue-border)] bg-[var(--brand-blue-soft)] px-4 py-2 font-bold text-[var(--brand-blue-hover)]">Join TestFlight</span>
                        </a>
                      )}
                    </div>
                  ) : (
                    <>
                      <p className="text-slate-600">iOS does not allow a website to install a standalone app from a direct .ipa download. Install through the App Store or TestFlight when published, or add ollaiBooks to your Home Screen from Safari.</p>
                      <ol className="list-decimal list-inside space-y-1 text-slate-600"><li>Open the ollaiBooks website in Safari.</li><li>Tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</li><li>Tap <strong>Add</strong> to launch ollaiBooks from your Home Screen.</li></ol>
                      <p className="rounded-lg bg-[var(--brand-blue-soft)] p-3 text-[var(--brand-blue-hover)]">Set <code>NEXT_PUBLIC_IOS_APPSTORE_URL</code> or <code>NEXT_PUBLIC_IOS_TESTFLIGHT_URL</code> after your Xcode / Capacitor build is uploaded to App Store Connect.</p>
                    </>
                  )}
                </div>
              )}

            </div>
            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3.5">
              <span className="text-[11px] text-slate-500">
                Guide: <span className="font-semibold text-[var(--brand-blue)]">docs/NATIVE_APP_CONVERSION_GUIDE.md</span>
              </span>
              <button
                type="button"
                onClick={() => setNativeModalOpen(false)}
                className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition"
              >
                Close Hub
              </button>
            </div>
          </section>
        </div>
      )}

      {/* 3. In-App Modal: Add or Edit Product (Offline) */}
      {addProductModalOpen && (
        <div className="pos-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="pos-modal-card w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-blue-soft)] text-[var(--brand-blue-hover)]">
                  <Plus size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900">{editingProductId ? 'Edit Product (Offline)' : 'Add Product (Offline)'}</h3>
              </div>
              <button
                onClick={() => { setAddProductModalOpen(false); resetProductForm(); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="mt-4 space-y-3.5 text-xs">
              <label className="block font-semibold text-slate-700">
                {industry.key === 'salon' ? 'Service or product name *' : industry.key === 'restaurant' ? 'Menu item name *' : industry.key === 'bakery' ? 'Bakery item name *' : 'Product or service name *'}
                <input
                  required
                  value={newProdName}
                  onChange={e => setNewProdName(e.target.value)}
                  placeholder={industry.key === 'salon' ? 'e.g. Haircut, facial, shampoo' : industry.key === 'restaurant' ? 'e.g. Masala dosa, filter coffee' : industry.key === 'bakery' ? 'e.g. Custom birthday cake, croissant' : 'Enter item name'}
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm font-normal text-slate-900 focus:border-[var(--brand-blue)] focus:outline-none"
                />
              </label>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <label className="flex items-center gap-2 font-semibold text-slate-800">
                  <input type="checkbox" checked={newProdTracksStock} onChange={e => setNewProdTracksStock(e.target.checked)} />
                  Track inventory for this item
                </label>
                <p className="ml-6 mt-1 text-[11px] text-slate-500">Turn this off for salon services or other non-stock services. Bills for services won’t reduce inventory.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block font-semibold text-slate-700">
                  Category *
                  <input
                    required
                    value={newProdCategory}
                    onChange={e => setNewProdCategory(e.target.value)}
                    placeholder="e.g. Electronics, Retail, Grocery"
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-[var(--brand-blue)] focus:outline-none"
                  />
                </label>

                <label className="block font-semibold text-slate-700">
                  {industry.key === 'salon' && !newProdTracksStock ? 'Service price (₹) *' : industry.key === 'restaurant' ? 'Menu price (₹) *' : 'Selling price (₹) *'}
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    value={newProdPrice}
                    onChange={e => setNewProdPrice(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="250.00"
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-[var(--brand-blue)] focus:outline-none"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block font-semibold text-slate-700">
                  Selling unit
                  <select value={newProdUnit} onChange={e => setNewProdUnit(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-[var(--brand-blue)] focus:outline-none">
                    <option value="pcs">Pieces / quantity</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="g">Grams (g)</option>
                    <option value="L">Litres (L)</option>
                    <option value="box">Boxes</option>
                    <option value="pack">Packs</option>
                  </select>
                </label>
                <label className="block font-semibold text-slate-700">
                  Purchase date
                  <input type="date" value={newProdPurchaseDate} onChange={e => setNewProdPurchaseDate(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-[var(--brand-blue)] focus:outline-none" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block font-semibold text-slate-700">
                  Purchase cost (₹)
                  <input type="number" min="0" step="0.01" value={newProdPurchasePrice} onChange={e => setNewProdPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Cost per selling unit" className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-[var(--brand-blue)] focus:outline-none" />
                </label>
                <label className="block font-semibold text-slate-700">
                  Weight / pack size
                  <input value={newProdWeight} onChange={e => setNewProdWeight(e.target.value)} placeholder="e.g. 500 g, 1 kg cake" className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-[var(--brand-blue)] focus:outline-none" />
                </label>
              </div>

              <label className="block font-semibold text-slate-700">
                Extra details
                <textarea rows={2} maxLength={1000} value={newProdExtra} onChange={e => setNewProdExtra(e.target.value)} placeholder="Supplier, batch, expiry, flavor, or other notes" className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-[var(--brand-blue)] focus:outline-none" />
              </label>

              <label className="block font-semibold text-slate-700">
                Upload purchase bill <span className="font-normal text-slate-400">(PDF, image; up to 8 MB; stored on this device)</span>
                <input type="file" accept="application/pdf,image/*" onChange={e => { void handlePurchaseBillUpload(e.target.files?.[0]).catch(error => setToast(error.message || 'Could not read purchase bill.')); }} className="mt-1 block w-full text-xs text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-[var(--brand-blue-soft)] file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[var(--brand-blue-hover)] hover:file:bg-[var(--brand-blue-border)]" />
                {newProdBill && <span className="mt-1 flex items-center gap-2 text-xs text-emerald-700">Attached: {newProdBill.name}<button type="button" onClick={() => setNewProdBill(undefined)} className="font-semibold text-rose-700 underline">Remove</button></span>}
              </label>

              <div className="grid grid-cols-2 gap-3">
                {newProdTracksStock && <label className="block font-semibold text-slate-700">
                  {editingProductId ? 'Stock quantity' : 'Opening stock quantity'}
                  <input
                    type="number"
                    min="0"
                    value={newProdStock}
                    onChange={e => setNewProdStock(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="50"
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-[var(--brand-blue)] focus:outline-none"
                  />
                </label>}

                <label className="block font-semibold text-slate-700">
                  HSN / Barcode <span className="font-normal text-slate-400">(Optional)</span>
                  <input
                    value={newProdHsn}
                    onChange={e => setNewProdHsn(e.target.value)}
                    placeholder="180690"
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-[var(--brand-blue)] focus:outline-none"
                  />
                </label>
              </div>

              {/* Quick SVG Icon Selector */}
              <div>
                <span className="block font-semibold text-slate-700 mb-1.5">Item Icon</span>
                <div className="flex flex-wrap gap-2">
                  {([
                    { key: 'icon:package', label: 'Package', Icon: Package },
                    { key: 'icon:tag', label: 'Tag', Icon: Tag },
                    { key: 'icon:laptop', label: 'Electronics', Icon: Laptop },
                    { key: 'icon:phone', label: 'Mobile', Icon: Smartphone },
                    { key: 'icon:shirt', label: 'Apparel', Icon: Shirt },
                    { key: 'icon:bag', label: 'Retail', Icon: ShoppingBag },
                    { key: 'icon:coffee', label: 'Cafe', Icon: Coffee },
                    { key: 'icon:layers', label: 'Services', Icon: Layers },
                  ] as const).map(({ key, label, Icon }) => (
                    <button
                      type="button"
                      key={key}
                      title={label}
                      aria-label={label}
                      onClick={() => setNewProdEmoji(key)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${
                        newProdEmoji === key
                          ? 'border-[var(--brand-blue)] bg-[var(--brand-blue-soft)] text-[var(--brand-blue-hover)]'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={18} />
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setAddProductModalOpen(false); resetProductForm(); }}
                  className="rounded-lg px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--brand-blue)] px-5 py-2 font-bold text-white shadow-md shadow-slate-900/10 hover:bg-[var(--brand-blue-hover)]"
                >
                  {editingProductId ? 'Save Changes Offline' : 'Save Product Offline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {stockModalProduct && (
        <div className="pos-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="pos-modal-card w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Stock movement</h3>
                <p className="mt-1 text-xs text-slate-500">{stockModalProduct.name} · Available: {stockModalProduct.stock} {stockModalProduct.stockUnit || 'pcs'}</p>
              </div>
              <button onClick={() => setStockModalProduct(null)} aria-label="Close stock movement" className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <form onSubmit={saveStockMovement} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <label className="font-semibold text-slate-700">Movement
                  <select value={stockDirection} onChange={e => { const direction = e.target.value as 'IN' | 'OUT'; setStockDirection(direction); setStockReason(direction === 'IN' ? 'Purchase / restock' : 'Manual stock adjustment'); }} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm font-normal text-slate-900">
                    <option value="IN">Stock in</option><option value="OUT">Stock out</option>
                  </select>
                </label>
                <label className="font-semibold text-slate-700">Quantity ({stockModalProduct.stockUnit || 'pcs'})
                  <input required type="number" min={stockModalProduct.stockUnit?.toLowerCase() === 'kg' ? '0.001' : '1'} step={stockModalProduct.stockUnit?.toLowerCase() === 'kg' ? '0.001' : '1'} max={stockDirection === 'OUT' ? stockModalProduct.stock : undefined} value={stockChange} onChange={e => setStockChange(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm font-normal text-slate-900" />
                </label>
              </div>
              <label className="block font-semibold text-slate-700">Reason / reference
                <input value={stockReason} onChange={e => setStockReason(e.target.value)} placeholder="Purchase, wastage, correction…" className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm font-normal text-slate-900" />
              </label>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                <button type="button" onClick={() => setStockModalProduct(null)} className="rounded-lg px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100">Cancel</button>
                <button type="submit" className="rounded-lg bg-[var(--brand-blue)] px-4 py-2 font-bold text-white hover:bg-[var(--brand-blue-hover)]">Save movement offline</button>
              </div>
            </form>
            <div className="mt-5">
              <h4 className="mb-2 text-xs font-bold text-slate-800">Recent stock history</h4>
              {stockModalProduct.stockMovements?.length ? (
                <ul className="space-y-2">
                  {[...stockModalProduct.stockMovements].reverse().slice(0, 8).map(movement => (
                    <li key={movement.id} className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 p-2.5 text-xs">
                      <span><b className={movement.direction === 'IN' ? 'text-emerald-700' : 'text-rose-700'}>{movement.direction === 'IN' ? 'IN' : 'OUT'} · {movement.quantity} {stockModalProduct.stockUnit || 'pcs'}</b><small className="mt-0.5 block text-slate-500">{movement.reason}</small></span>
                      <time className="shrink-0 text-slate-500">{new Date(movement.date).toLocaleDateString('en-IN')}</time>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-slate-500">No stock movements recorded yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* 4. In-App Modal: Import Excel / CSV */}
      {importExcelModalOpen && (
        <div className="pos-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="pos-modal-card w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <FileSpreadsheet size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Connect & Import Excel / CSV</h3>
              </div>
              <button
                onClick={() => setImportExcelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Import your product catalog from any spreadsheet (Excel, Google Sheets, or CSV). All imported items are saved directly into your device's offline IndexedDB.
              </p>

              {/* Sample Template Download */}
              <div className="flex items-center justify-between rounded-xl border border-[var(--brand-blue-border)] bg-[var(--brand-blue-soft)] p-3.5">
                <div>
                  <b className="text-[var(--ink)] text-xs">Need a starting template?</b>
                  <p className="text-[11px] text-[var(--brand-blue-hover)] mt-0.5">
                  Columns: Name, Category, Price, Stock, Unit, Purchase Date, Purchase Price, Weight, Extra, HSN
                  </p>
                </div>
                <button
                  onClick={downloadSampleTemplate}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-blue)] px-3 py-1.5 font-bold text-white shadow-xs hover:bg-[var(--brand-blue-hover)]"
                >
                  <Download size={13} />
                  <span>Sample CSV</span>
                </button>
              </div>

              {/* File Upload Box */}
              <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-8 text-center cursor-pointer hover:border-[var(--brand-blue)] hover:bg-[var(--brand-blue-soft)] transition">
                <Upload size={32} className="text-slate-400 mb-2" />
                <span className="font-bold text-sm text-slate-800">
                  Select CSV / Excel file
                </span>
                <span className="text-[11px] text-slate-500 mt-1">
                  Supports .csv, .xlsx, .txt
                </span>
                <input
                  type="file"
                  accept=".csv,.txt,text/csv"
                  className="hidden"
                  onChange={e => handleImportExcel(e.target.files?.[0])}
                />
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setImportExcelModalOpen(false)}
                  className="rounded-lg px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Backdrop */}
      {mobileMenu && (
        <button
          className="pos-mobile-scrim"
          onClick={() => setMobileMenu(false)}
          aria-label="Close menu"
        />
      )}

      {/* Toast Notification */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </main>
  );
}

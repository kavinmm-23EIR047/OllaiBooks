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
  ExternalLink, Copy, Monitor, Share2
} from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import { clearPosSession, getPosSessionMode } from '@/lib/offline-auth';
import { loadOfflinePosData, requestPersistentStorage, saveOfflinePosData, type OfflineStorageMode, type StoragePersistence } from '@/lib/offline-pos-storage';
import { getOfflineCache, setOfflineCache } from '@/lib/offline-invoices';
import { buildOrderBook, filterOrderBook, type OrderBookTab } from '@/lib/order-book';
import {
  printKitchenOrderTicket,
  printInvoiceDocument,
  printKotAndBill,
  type InvoiceTemplateId,
  type ThermalPaperWidth,
} from '@/lib/print-documents';

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
  sync: 'pending' | 'synced';
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
  [key: string]: unknown;
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
  if (c === 'all items') return <Layers size={13} className="text-blue-600" />;
  if (c.includes('electron') || c.includes('tech') || c.includes('hardware') || c.includes('mobile')) return <Laptop size={13} className="text-sky-600" />;
  if (c.includes('apparel') || c.includes('cloth') || c.includes('fashion') || c.includes('shirt')) return <Shirt size={13} className="text-indigo-600" />;
  if (c.includes('beverage') || c.includes('coffee') || c.includes('drink') || c.includes('tea')) return <Coffee size={13} className="text-amber-600" />;
  if (c.includes('food') || c.includes('grocer') || c.includes('supermarket')) return <ShoppingCart size={13} className="text-emerald-600" />;
  if (c.includes('service') || c.includes('consult')) return <Building2 size={13} className="text-purple-600" />;
  if (c.includes('retail') || c.includes('confectionery')) return <ShoppingBag size={13} className="text-blue-600" />;
  return <Tag size={13} className="text-slate-500" />;
}

// Product Art Renderer with Multi-Tenant Lucide Icons
function renderProductCardArt(p: Product) {
  const name = (p.name || '').toLowerCase();
  const cat = (p.category || '').toLowerCase();

  if (name.includes('mouse') || name.includes('cable') || name.includes('phone') || name.includes('laptop') || name.includes('keyboard') || cat.includes('electron')) {
    return <Laptop size={32} className="text-blue-600" />;
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
    return <Building2 size={32} className="text-purple-600" />;
  }
  if (cat.includes('confectionery') || cat.includes('gourmet')) {
    return <ShoppingBag size={32} className="text-purple-600" />;
  }
  if (p.emoji && p.emoji !== '📦' && p.emoji !== '🏷️' && !p.emoji.startsWith('🧁') && !p.emoji.startsWith('🍰') && !p.emoji.startsWith('🥐') && !p.emoji.startsWith('🍫')) {
    return <span className="text-2xl">{p.emoji}</span>;
  }
  return <Package size={32} className="text-slate-600" />;
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

export default function OfflinePosPage() {
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
  const [tab, setTab] = React.useState<'dashboard' | 'billing' | 'sales' | 'products' | 'settings'>('dashboard');

  // Fast Checkout form fields
  const [customer, setCustomer] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [note, setNote] = React.useState('');
  const [pickup, setPickup] = React.useState('');
  const [orderType, setOrderType] = React.useState('Counter sale');
  const [tableNumber, setTableNumber] = React.useState('');
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
  const [toast, setToast] = React.useState('');
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
  const saleInProgress = React.useRef(false);
  const tenantLoadGeneration = React.useRef(0);
  const [savingSale, setSavingSale] = React.useState(false);
  const [syncingSales, setSyncingSales] = React.useState(false);
  const [syncMessage, setSyncMessage] = React.useState('Sales sync automatically when you are online.');
  const [syncAttempt, setSyncAttempt] = React.useState(0);

  // Modals state
  const [addProductModalOpen, setAddProductModalOpen] = React.useState(false);
  const [importExcelModalOpen, setImportExcelModalOpen] = React.useState(false);
  const [completedSale, setCompletedSale] = React.useState<Sale | null>(null);
  const [invoiceTemplate, setInvoiceTemplate] = React.useState<InvoiceTemplateId>('thermal');
  const [paperWidth, setPaperWidth] = React.useState<ThermalPaperWidth>('80mm');
  const [autoPrintOnComplete, setAutoPrintOnComplete] = React.useState<'none' | 'bill' | 'kot-and-bill'>('none');

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
  const [newProdEmoji, setNewProdEmoji] = React.useState('🏷️');
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

    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
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

      setStorageMode(mode);
      setLoadedTenantId(tenantId);
      setReady(true);
    } catch {
      if (generation !== tenantLoadGeneration.current) return;
      setStorageMode('localStorage');
      setReady(false);
      setToast('Running in local storage fallback mode.');
    }
  }, [workspaces]);

  React.useEffect(() => {
    if (activeTenantId) {
      loadTenantData(activeTenantId);
    }
  }, [activeTenantId, loadTenantData]);

  // 3. Auto-save State to IndexedDB on Changes
  React.useEffect(() => {
    if (!ready || !activeTenantId || loadedTenantId !== activeTenantId) return;
    saveOfflinePosData({ products, sales, shop, taxEnabled, taxRate }, activeTenantId)
      .then(mode => setStorageMode(mode))
      .catch(error => setToast(error instanceof Error ? error.message : 'Storage quota exceeded.'));
    setOfflineCache('shop-orders', sales);
  }, [products, sales, shop, taxEnabled, taxRate, ready, loadedTenantId, activeTenantId]);

  const refreshWebsiteOrders = React.useCallback(async () => {
    try {
      const data = await ApiClient.get<any>('/orders?limit=100');
      const items = Array.isArray(data?.items) ? data.items : [];
      setWebsiteOrders(items);
      setOfflineCache('orders', items);
    } catch {
      setWebsiteOrders(getOfflineCache<any[]>('orders', []));
    }
  }, []);

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

  // Toast timer auto-dismiss
  React.useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Switch Active Workspace
  const handleSwitchWorkspace = (targetTenantId: string) => {
    setWorkspaceMenuOpen(false);
    if (targetTenantId === activeTenantId) return;

    setActiveTenantId(targetTenantId);
    sessionStorage.setItem('billpilot_active_tenant_id', targetTenantId);
    const targetWp = workspaces.find(w => w.tenantId === targetTenantId);
    setCart([]);
    setReady(false);
    setToast(`Switched workspace to: ${targetWp?.tenantName || 'New Store'}`);
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

  // Mathematical Totals
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
  const syncPendingSales = React.useCallback(async () => {
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
        setSales(current => current.map(sale => syncedIds.has(sale.id) ? { ...sale, sync: 'synced' } : sale));
        setSyncMessage(`${syncedIds.size} sale${syncedIds.size === 1 ? '' : 's'} saved to your online workspace.`);
      }
      setSyncAttempt(0);
    } catch {
      setSyncMessage('Online sync failed. Your local bills are still saved; retry when connected.');
      setSyncAttempt(current => current + 1);
    } finally {
      setSyncingSales(false);
    }
  }, [syncingSales, online, authReady, ready, loadedTenantId, activeTenantId, posSessionMode, pendingSales]);

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
    if (/^\d$/.test(key) || key === '.') {
      setCalculatorDisplay(current => {
        const value = calculatorReplaceDisplay ? '' : current;
        if (key === '.' && value.includes('.')) return value || '0';
        if (key === '.' && (!value || value === '0')) return '0.';
        return `${value === '0' ? '' : value}${key}` || '0';
      });
      setCalculatorReplaceDisplay(false);
      return;
    }
    if (key === 'C') {
      setCalculatorDisplay('0');
      setCalculatorAccumulator(null);
      setCalculatorOperator(null);
      setCalculatorReplaceDisplay(false);
      return;
    }
    if (key === '⌫') {
      if (calculatorReplaceDisplay) return;
      setCalculatorDisplay(current => current.length > 1 ? current.slice(0, -1) : '0');
      return;
    }
    const current = Number(calculatorDisplay);
    if (!Number.isFinite(current)) return;
    if (key === '=') {
      if (calculatorAccumulator === null || !calculatorOperator) return;
      const result = calculate(calculatorAccumulator, current, calculatorOperator);
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
      return [...prev, { productId: p.id, name: p.name, quantity: tracksStock ? Math.min(step, p.stock) : step, price: p.price, hsn: p.hsn }];
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
    saleInProgress.current = true;
    setSavingSale(true);
    const date = new Date().toISOString();
    const number = `INV-${date.slice(2, 10).replaceAll('-', '')}-${String(sales.length + 1).padStart(3, '0')}`;
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
      sync: 'pending',
    };

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
      const mode = await saveOfflinePosData({ products: nextProducts, sales: nextSales, shop, taxEnabled, taxRate }, activeTenantId);
      setStorageMode(mode);
    } catch (error) {
      setToast(error instanceof Error ? error.message : 'Could not save bill offline.');
      saleInProgress.current = false;
      setSavingSale(false);
      return;
    }

    setSales(nextSales);
    setProducts(nextProducts);
    setCart([]);
    setCustomer('');
    setPhone('');
    setNote('');
    setPickup('');
    setOrderType(industry.orderTypes[0] || 'Counter sale');
    setTableNumber('');
    setDiscount(0);
    setMobileCartOpen(false);
    setCompletedSale(sale);
    setToast(`✓ Bill saved offline · ${number}`);
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
    download(`billpilot-sales-${activeTenantId}-${new Date().toISOString().slice(0, 10)}.csv`, `\uFEFF${csv}`, 'text/csv;charset=utf-8');
    setToast('Sales CSV exported for Excel / Google Sheets');
  };

  // Export Product Catalog to CSV
  const exportProductsCatalog = () => {
    const header = ['Name', 'Category', 'Selling Price (INR)', 'In Stock', 'Unit', 'Purchase Date', 'Purchase Cost (INR)', 'Weight / Pack Size', 'Extra Details', 'HSN / SAC Code', 'Purchase Bill'];
    const rows = products.map(p => [p.name, p.category, p.price, p.stock, p.stockUnit || 'pcs', p.purchaseDate || '', p.purchasePrice || 0, p.weight || '', p.extra || '', p.hsn || '', p.purchaseBill?.name || '']);
    const csv = [header, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
    download(`billpilot-catalog-${activeTenantId}-${new Date().toISOString().slice(0, 10)}.csv`, `\uFEFF${csv}`, 'text/csv;charset=utf-8');
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
          emoji: '📦',
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
    } catch (err: any) {
      setToast(err.message || 'Could not parse spreadsheet file. Please upload a standard CSV.');
    }
  };

  // Full Device Backup & Restore (JSON)
  const exportBackup = () => {
    download(
      `billpilot-backup-${activeTenantId}-${new Date().toISOString().slice(0, 10)}.json`,
      JSON.stringify({ version: 3, tenantId: activeTenantId, exportedAt: new Date().toISOString(), shop, products, sales, reminders, taxEnabled, taxRate }, null, 2),
      'application/json'
    );
    setToast('Full device backup downloaded');
  };

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
  ] as const;

  return !authReady || !ready || loadedTenantId !== activeTenantId ? (
    <main className="pos-auth-loading">
      <div className="flex flex-col items-center gap-3">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
        <span>{authReady ? 'Loading this workspace’s offline records…' : 'Authenticating your subscribed workspace…'}</span>
      </div>
    </main>
  ) : (
    <main className="pos-app">
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
            className="pos-store-select w-full text-left cursor-pointer hover:border-blue-400 transition"
            title="Switch Tenant Workspace"
          >
            <div className="pos-store-avatar">{shop.name.slice(0, 1).toUpperCase()}</div>
            <span>
              <b>{shop.name}</b>
              <small>Workspace: {activeTenantId.slice(0, 10)}</small>
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
                    wp.tenantId === activeTenantId ? 'bg-blue-50 font-bold text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{wp.tenantName}</span>
                  {wp.tenantId === activeTenantId && <Check size={14} className="text-blue-600" />}
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
              <span className="font-bold text-slate-800 text-[11px]">Multi-Tenant Engine</span>
              <span className="text-[9px] text-slate-500 font-normal">Retail · Marts · Boutiques · Services</span>
            </div>
          </div>
          <div className="pos-sidebar-note">
            <span className="pos-dot" />
            {storageMode === 'indexeddb' ? 'IndexedDB Engine · Instant Offline' : 'LocalStorage Engine'}
          </div>
          <div className="pos-support-links">
            <span>ollaiBooks Enterprise Support</span>
            <a href="tel:+919600732162">Call: +91 96007 32162</a>
            <a href="https://wa.me/919600732162" target="_blank" rel="noreferrer">WhatsApp Instant Support</a>
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
            className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 text-xs font-semibold text-blue-700 shadow-sm hover:bg-blue-50 hover:border-blue-300 active:scale-95 transition-all"
            title="Convert and install native app for Android APK, Windows, Mac, or iOS"
          >
            <Download size={15} /> Get App (APK / Desktop)
          </button>

          <button type="button" onClick={() => setCalculatorOpen(true)} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50" aria-label="Open calculator">
            <Calculator size={15} /> Calculator
          </button>

          {/* Quick Mobile Cart Pill Button */}
          {cart.length > 0 && (
            <button
              onClick={() => setMobileCartOpen(!mobileCartOpen)}
              className="pos-mobile-cart-toggle md:hidden flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm"
            >
              <ShoppingCart size={14} />
              <span>{cart.reduce((a, b) => a + b.quantity, 0)}</span>
              <span>· {money(total)}</span>
            </button>
          )}

          <div className={`pos-connection ${online ? 'connected' : 'disconnected'}`}>
            {online ? <Wifi size={15} /> : <WifiOff size={15} />}
            <span>{online ? 'Online · Offline Ready' : 'Working 100% Offline'}</span>
          </div>

          <div className="pos-date">
            {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
          </div>

          <button
            className="pos-help"
            onClick={() => setToast('All bills, products, and customer records save automatically to your device.')}
            title="Help & Info"
          >
            <CircleHelp size={17} />
          </button>
        </header>

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
              <div className="pos-metric-card"><span>Orders today</span><b>{todaySales.length + todayWebsiteOrders.length}</b><small>{todaySales.length} shop · {todayWebsiteOrders.length} website</small></div>
              <div className="pos-metric-card"><span>Shop revenue today</span><b>{money(todayRevenue)}</b><small>{todaySales.length} local bills</small></div>
              <div className="pos-metric-card"><span>Average bill today</span><b>{money(averageBill)}</b><small>Across {todaySales.length} local bills</small></div>
              <div className="pos-metric-card"><span>Low stock</span><b>{lowStockProducts.length}</b><small>Items need attention</small></div>
              <div className="pos-metric-card"><span>Upcoming reminders</span><b>{upcomingReminders.length}</b><small>Saved on this device</small></div>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="pos-data-card">
                <div className="pos-data-heading"><div><h2>Today’s payments</h2><span>Payment totals from bills saved on this device</span></div><Banknote size={19} className="text-emerald-600" /></div>
                {Object.keys(todayPaymentTotals).length ? <div className="divide-y divide-slate-100">{Object.entries(todayPaymentTotals).map(([label, amount]) => <div key={label} className="flex items-center justify-between gap-3 py-3 text-xs"><span className="font-semibold text-slate-700">{label}</span><b>{money(amount)}</b></div>)}</div> : <p className="py-6 text-center text-xs text-slate-500">Payment totals will appear here after your first bill.</p>}
              </div>
              <div className="pos-data-card">
                <div className="pos-data-heading"><div><h2>Top-selling today</h2><span>Ranked by units sold in local bills</span></div><Activity size={19} className="text-blue-600" /></div>
                {topSellingItems.length ? <div className="divide-y divide-slate-100">{topSellingItems.map((item, index) => <div key={`${item.name}:${index}`} className="flex items-center justify-between gap-3 py-3 text-xs"><span><b className="text-slate-900">{index + 1}. {item.name}</b><small className="mt-1 block text-slate-500">{item.quantity} sold</small></span><b>{money(item.revenue)}</b></div>)}</div> : <p className="py-6 text-center text-xs text-slate-500">Top products appear after you complete a bill.</p>}
              </div>
              <div className="pos-data-card">
                <div className="pos-data-heading"><div><h2>Current order book</h2><span>Combined view · shop and website orders stay labelled by source</span></div><button className="pos-secondary-action" onClick={() => setTab('sales')}>View all <span>→</span></button></div>
                {orderBook.slice(0, 6).length ? <div className="divide-y divide-slate-100">{orderBook.slice(0, 6).map(order => <div key={`${order.source}:${order.id}`} className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"><div className="min-w-0"><b className="text-slate-900">{order.orderNumber}</b><span className={`ml-2 rounded-full px-2 py-0.5 font-bold ${order.source === 'shop' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'}`}>{order.source === 'shop' ? 'SHOP' : 'WEBSITE'}</span><small className="mt-1 block truncate text-slate-500">{order.customerName} · {new Date(order.date).toLocaleString('en-IN')}</small>{order.source === 'shop' && (order.raw as Sale).orderType && <small className="mt-0.5 block text-blue-700">{(order.raw as Sale).orderType}{(order.raw as Sale).tableNumber ? ` · Table ${(order.raw as Sale).tableNumber}` : ''}</small>}</div><b>{money(order.total)}</b></div>)}</div> : <p className="py-6 text-center text-xs text-slate-500">No orders saved yet.</p>}
              </div>

              <div className="pos-data-card">
                <div className="pos-data-heading"><div><h2>Stock alerts</h2><span>Low quantities from this offline catalog</span></div><button className="pos-secondary-action" onClick={() => setTab('products')}>Manage stock <span>→</span></button></div>
                {lowStockProducts.slice(0, 6).length ? <div className="divide-y divide-slate-100">{lowStockProducts.slice(0, 6).map(product => <div key={product.id} className="flex items-center justify-between gap-3 py-3 text-xs"><span><b className="text-slate-900">{product.name}</b><small className="mt-1 block text-slate-500">{product.category}</small></span><b className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800">{product.stock} {product.stockUnit || 'pcs'}</b></div>)}</div> : <p className="py-6 text-center text-xs text-slate-500">No low-stock items. Stock levels look healthy.</p>}
              </div>

              <div className="pos-data-card xl:col-span-2">
                <div className="pos-data-heading"><div><h2>Offline calendar & reminders</h2><span>Private to this device and available without internet</span></div><span className="pos-method-pill">{upcomingReminders.length} upcoming</span></div>
                <form onSubmit={addReminder} className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-4">
                  <input required maxLength={100} value={reminderTitle} onChange={e => setReminderTitle(e.target.value)} placeholder="Reminder title" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs" />
                  <input required type="datetime-local" value={reminderDate} onChange={e => setReminderDate(e.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs" />
                  <input maxLength={240} value={reminderNote} onChange={e => setReminderNote(e.target.value)} placeholder="Note (optional)" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs" />
                  <button type="submit" className="pos-primary-action justify-center"><Plus size={14} /> Add reminder</button>
                </form>
                <div className="mt-3 divide-y divide-slate-100">
                  {upcomingReminders.map(reminder => <div key={reminder.id} className="flex items-center justify-between gap-3 py-2.5 text-xs"><div><b className="text-slate-900">{reminder.title}</b><small className="mt-0.5 block text-slate-500">{new Date(reminder.startsAt).toLocaleString('en-IN')}{reminder.note ? ` · ${reminder.note}` : ''}</small></div><button aria-label={`Delete ${reminder.title}`} className="pos-row-action" onClick={() => setReminders(current => current.filter(item => item.id !== reminder.id))}><X size={14} /></button></div>)}
                  {!upcomingReminders.length && <p className="py-3 text-xs text-slate-500">No upcoming reminders. Add a delivery, supplier call or follow-up above.</p>}
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
                      onClick={() => { resetProductForm(); setAddProductModalOpen(true); }}
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-blue-700 shadow-xs transition"
                      title={`Add a new ${industry.itemSingular} offline`}
                    >
                      <Plus size={14} />
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
                      <span className="pos-product-art" style={{ background: p.color || '#f8fafc' }}>
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
                  <div className="flex items-center gap-3">
                    <button onClick={() => setImportExcelModalOpen(true)} className="flex items-center gap-1 font-semibold">
                      <FileSpreadsheet size={13} />
                      <span>Import Excel</span>
                    </button>
                    <button onClick={() => setTab('products')}>
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
                      <span className="pos-empty-illustration">🛒</span>
                      <b>Your bill is currently empty</b>
                      <span>Click on any product to add it to the bill.</span>
                    </div>
                  )}
                </div>

                {/* Customer Info Form with Icons */}
                <div className="pos-cart-details">
                  <div className={industry.key === 'restaurant' && orderType === 'Dine-in' ? 'pos-input-row' : 'pos-field'}>
                    <label className="pos-field-label">
                      <span>{industry.key === 'salon' ? 'Visit type' : industry.key === 'restaurant' ? 'Order type' : 'Sale type'}</span>
                      <select value={orderType} onChange={e => setOrderType(e.target.value)}>
                        {industry.orderTypes.map(value => <option key={value} value={value}>{value}</option>)}
                      </select>
                    </label>
                    {industry.key === 'restaurant' && orderType === 'Dine-in' && (
                      <label className="pos-field-label">
                        <span>Table number</span>
                        <input value={tableNumber} onChange={e => setTableNumber(e.target.value)} placeholder="e.g. 4" />
                      </label>
                    )}
                  </div>

                  <label className="pos-field-label">
                    <span className="flex items-center gap-1.5">
                      <User size={13} className="text-blue-600" />
                      <span>{industry.customerLabel} name</span>
                      <span className="font-normal text-slate-400">(optional)</span>
                    </span>
                    <input
                      value={customer}
                      onChange={e => setCustomer(e.target.value)}
                      placeholder={`${industry.customerLabel} name (optional)`}
                    />
                  </label>

                  <label className="pos-field-label">
                    <span className="flex items-center gap-1.5">
                      <Smartphone size={13} className="text-blue-600" />
                      <span>Phone (WhatsApp)</span>
                    </span>
                    <input
                      inputMode="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                    />
                  </label>

                  <label className="pos-field-label">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-blue-600" />
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
                    <span className="flex items-center gap-1.5">
                      <FileText size={13} className="text-blue-600" />
                      <span>{industry.notesLabel}</span>
                    </span>
                    <input
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      placeholder={industry.notesPlaceholder}
                    />
                  </label>
                </div>

                {/* Calculations & Totals */}
                <div className="pos-cart-summary">
                  <div>
                    <span>Subtotal</span>
                    <b>{money(subtotal)}</b>
                  </div>
                  <div className="pos-discount-row">
                    <span>GST <small>{taxRate}%</small></span>
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
                  <CloudOff size={14} /> Saved securely on this device (Works 100% Offline)
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
                {pendingCount > 0 && <button type="button" className="mt-2 text-xs font-bold text-blue-700 disabled:text-slate-400" onClick={() => void syncPendingSales()} disabled={syncingSales || !online || !ready || posSessionMode !== 'online'}>{syncingSales ? 'Syncing…' : posSessionMode === 'offline' ? 'Sign in online to sync' : 'Sync now'}</button>}
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
                  <span>Shop bills are stored offline; website orders use the latest saved online copy</span>
                </div>
                <button className="pos-secondary-action" onClick={exportBackup}>
                  <Download size={16} /> Full Backup
                </button>
              </div>

              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Order source">
                  {([{ id: 'all', label: `All orders (${orderBook.length})` }, { id: 'shop', label: `Shop (${sales.length})` }, { id: 'website', label: `Website (${websiteOrders.length})` }] as const).map(item => <button key={item.id} role="tab" aria-selected={orderBookTab === item.id} onClick={() => setOrderBookTab(item.id)} className={`rounded-lg border px-3 py-2 text-xs font-bold ${orderBookTab === item.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}>{item.label}</button>)}
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
                            <span className={`pos-method-pill ${order.source === 'website' ? 'bg-violet-50 text-violet-700' : 'bg-blue-50 text-blue-700'}`}>{order.source === 'website' ? 'Website' : 'Shop / POS'}</span>
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
                  <span className="pos-empty-illustration">🧾</span>
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
                  <span className="pos-product-art" style={{ background: p.color }}>
                    {p.emoji}
                  </span>
                  <div className="pos-stock-info">
                    <span>{p.category} {p.hsn ? `· HSN: ${p.hsn}` : ''}</span>
                    <b>{p.name} {p.isArchived && <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">Archived</span>}</b>
                  <strong>{money(p.price)}{p.tracksStock === false ? ' / service' : ` / ${p.stockUnit || 'pcs'}`}</strong>
                    <small>Purchased: {p.purchaseDate || '—'} · Cost: {money(p.purchasePrice || 0)}</small>
                    {p.weight && <small>Weight: {p.weight}</small>}
                    {p.extra && <small>{p.extra}</small>}
                  {p.purchaseBill && (
                    <a href={p.purchaseBill.dataUrl} download={p.purchaseBill.name} target="_blank" rel="noreferrer" className="text-xs font-semibold text-blue-700 underline">
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
                    }}
                  >
                    {p.isArchived ? <ArchiveRestore size={15} /> : <Archive size={15} />}
                  </button>
                </div>
              ))}
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
                    <span>These details print on thermal receipts and offline invoices</span>
                  </div>
                  <Building2 size={21} />
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
                  GSTIN <span className="pos-label-muted">(15 characters)</span>
                  <input
                    value={shop.gstin}
                    onChange={e => setShop({ ...shop, gstin: e.target.value.toUpperCase() })}
                    placeholder="29ABCDE1234F1Z5"
                    maxLength={15}
                  />
                </label>
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
              </div>

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
                    <small>Calculate CGST + SGST tax automatically on sales.</small>
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

                <div className="flex gap-2">
                  <button className="pos-secondary-action flex-1" onClick={exportBackup}>
                    <ArrowDownToLine size={15} /> Device Backup
                  </button>
                  <label className="pos-import-button flex-1 cursor-pointer">
                    <ArrowUpFromLine size={15} /> Restore Backup
                    <input type="file" accept="application/json,.json" onChange={e => importBackup(e.target.files?.[0])} />
                  </label>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Global Footer */}
        <footer className="pos-footer">
          <span>
            ollaiBooks Autonomous POS · {shop.name}
          </span>
          <span>
            <span className="pos-dot" /> Multi-Tenant Storage Active ({storageMode})
          </span>
        </footer>
      </section>

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
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
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
                          ? 'border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-600'
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
        <div className="pos-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget) setCalculatorOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="pos-calculator-title" className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 id="pos-calculator-title" className="flex items-center gap-2 text-base font-bold text-slate-900"><Calculator size={18} className="text-blue-600" /> Calculator</h2>
              <button type="button" onClick={() => setCalculatorOpen(false)} aria-label="Close calculator" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <output aria-live="polite" className="mb-3 block min-h-16 overflow-hidden rounded-xl bg-slate-950 px-4 py-3 text-right text-3xl font-semibold text-white">{calculatorDisplay}</output>
            <div className="grid grid-cols-4 gap-2">
              {['C', '⌫', '÷', '×', '7', '8', '9', '−', '4', '5', '6', '+', '1', '2', '3', '0', '.', '='].map((key, index) => {
                const operator = ['÷', '×', '−', '+', '='].includes(key);
                return <button key={`${key}-${index}`} type="button" onClick={() => calculatorPress(key)} className={`min-h-12 rounded-xl text-base font-bold transition active:scale-95 ${key === '=' ? 'bg-blue-600 text-white hover:bg-blue-700' : operator ? 'bg-blue-50 text-blue-700 hover:bg-blue-100' : key === 'C' ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-slate-100 text-slate-800 hover:bg-slate-200'} ${key === '0' ? 'col-span-2' : ''}`}>{key}</button>;
              })}
            </div>
            <p className="mt-3 text-center text-xs text-slate-500">Quick calculations stay separate from your bill totals.</p>
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
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                  <Download size={20} />
                </div>
                <div>
                  <h2 id="pos-native-modal-title" className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    ollaiBooks App Downloads
                    <span className="rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5">OFFLINE POS</span>
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
                    className="rounded-lg bg-white px-4 py-2 text-xs font-bold text-blue-700 shadow hover:bg-blue-50 active:scale-95 transition-all whitespace-nowrap"
                  >
                    ⚡ Install App Now
                  </button>
                </div>
              ) : installEnvironment === 'ios-browser' ? (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-950">
                  <p className="text-sm font-bold">Add ollaiBooks to your Home Screen</p>
                  <p className="mt-1 text-xs">In Safari, tap Share, choose Add to Home Screen, then tap Add. iOS does not provide a website-triggered install prompt.</p>
                </div>
              ) : (
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-950">
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
                className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${activePlatformTab === 'android' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                <Smartphone size={15} /> Android (APK)
              </button>
              <button
                type="button"
                onClick={() => setActivePlatformTab('windows')}
                className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${activePlatformTab === 'windows' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                <Monitor size={15} /> Windows (.EXE)
              </button>
              <button
                type="button"
                onClick={() => setActivePlatformTab('mac')}
                className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${activePlatformTab === 'mac' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                <Laptop size={15} /> macOS (.DMG)
              </button>
              <button
                type="button"
                onClick={() => setActivePlatformTab('ios')}
                className={`pb-3 px-3 border-b-2 flex items-center gap-1.5 whitespace-nowrap transition ${activePlatformTab === 'ios' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
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
                {nativeDownloads?.release && <a href={nativeDownloads.release.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-700 hover:underline">Release notes</a>}
              </div>

              {activePlatformTab === 'android' && (
                <div className="space-y-4">
                  {nativeDownloads?.downloads.android ? (
                    <a href={nativeDownloads.downloads.android.url} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300 hover:shadow-md">
                      <span><strong className="block text-sm text-slate-900">ollaiBooks for Android</strong><span className="mt-1 block text-slate-500">APK installer · {nativeDownloads.downloads.android.name}</span></span><span className="rounded-lg bg-blue-600 px-4 py-2.5 font-bold text-white">Download APK</span>
                    </a>
                  ) : <div className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="text-sm font-bold text-slate-900">Android app installer</h3><p className="mt-2 text-slate-600">An APK download will show here after it is included in a published release. For now, open ollaiBooks in Chrome and choose <strong>Install app</strong> from the browser menu.</p></div>}
                </div>
              )}

              {activePlatformTab === 'windows' && (
                <div className="space-y-4">
                  {nativeDownloads?.downloads.windows ? (
                    <a href={nativeDownloads.downloads.windows.url} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300 hover:shadow-md">
                      <span><strong className="block text-sm text-slate-900">ollaiBooks for Windows</strong><span className="mt-1 block text-slate-500">Windows installer · {nativeDownloads.downloads.windows.name}</span></span><span className="rounded-lg bg-blue-600 px-4 py-2.5 font-bold text-white">Download EXE</span>
                    </a>
                  ) : <div className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="text-sm font-bold text-slate-900">Windows installer</h3><p className="mt-2 text-slate-600">The Windows installer will be available here after the first native release is published.</p></div>}
                </div>
              )}

              {activePlatformTab === 'mac' && (
                <div className="space-y-4">
                  {nativeDownloads?.downloads.mac ? (
                    <a href={nativeDownloads.downloads.mac.url} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-blue-300 hover:shadow-md">
                      <span><strong className="block text-sm text-slate-900">ollaiBooks for macOS</strong><span className="mt-1 block text-slate-500">Disk image · {nativeDownloads.downloads.mac.name}</span></span><span className="rounded-lg bg-blue-600 px-4 py-2.5 font-bold text-white">Download DMG</span>
                    </a>
                  ) : <div className="rounded-xl border border-slate-200 bg-white p-5"><h3 className="text-sm font-bold text-slate-900">macOS installer</h3><p className="mt-2 text-slate-600">The macOS disk image will be available after a release is built on macOS. Safari users can also add the web app to the Dock.</p></div>}
                </div>
              )}

              {activePlatformTab === 'ios' && (
                <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
                  <h3 className="text-sm font-bold text-slate-900">Install on iPhone or iPad</h3>
                  <p className="text-slate-600">iOS does not allow a website to install a standalone app from a direct .ipa download. Install through the App Store or TestFlight when published, or add ollaiBooks to your Home Screen from Safari.</p>
                  <ol className="list-decimal list-inside space-y-1 text-slate-600"><li>Open the ollaiBooks website in Safari.</li><li>Tap <strong>Share</strong>, then <strong>Add to Home Screen</strong>.</li><li>Tap <strong>Add</strong> to launch ollaiBooks from your Home Screen.</li></ol>
                  <p className="rounded-lg bg-blue-50 p-3 text-blue-800">App Store and TestFlight links will appear here once Apple distribution is configured.</p>
                </div>
              )}

            </div>
            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-6 py-3.5">
              <span className="text-[11px] text-slate-500">
                Guide: <span className="font-semibold text-blue-600">docs/NATIVE_APP_CONVERSION_GUIDE.md</span>
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
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
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
                  className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-sm font-normal text-slate-900 focus:border-blue-600 focus:outline-none"
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
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
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
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block font-semibold text-slate-700">
                  Selling unit
                  <select value={newProdUnit} onChange={e => setNewProdUnit(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none">
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
                  <input type="date" value={newProdPurchaseDate} onChange={e => setNewProdPurchaseDate(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block font-semibold text-slate-700">
                  Purchase cost (₹)
                  <input type="number" min="0" step="0.01" value={newProdPurchasePrice} onChange={e => setNewProdPurchasePrice(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Cost per selling unit" className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none" />
                </label>
                <label className="block font-semibold text-slate-700">
                  Weight / pack size
                  <input value={newProdWeight} onChange={e => setNewProdWeight(e.target.value)} placeholder="e.g. 500 g, 1 kg cake" className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none" />
                </label>
              </div>

              <label className="block font-semibold text-slate-700">
                Extra details
                <textarea rows={2} maxLength={1000} value={newProdExtra} onChange={e => setNewProdExtra(e.target.value)} placeholder="Supplier, batch, expiry, flavor, or other notes" className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none" />
              </label>

              <label className="block font-semibold text-slate-700">
                Upload purchase bill <span className="font-normal text-slate-400">(PDF, image; up to 8 MB; stored on this device)</span>
                <input type="file" accept="application/pdf,image/*" onChange={e => { void handlePurchaseBillUpload(e.target.files?.[0]).catch(error => setToast(error.message || 'Could not read purchase bill.')); }} className="mt-1 block w-full text-xs text-slate-500 file:mr-3 file:rounded-md file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-blue-700 hover:file:bg-blue-100" />
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
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </label>}

                <label className="block font-semibold text-slate-700">
                  HSN / Barcode <span className="font-normal text-slate-400">(Optional)</span>
                  <input
                    value={newProdHsn}
                    onChange={e => setNewProdHsn(e.target.value)}
                    placeholder="180690"
                    className="mt-1 w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-none"
                  />
                </label>
              </div>

              {/* Quick Icon Selector */}
              <div>
                <span className="block font-semibold text-slate-700 mb-1.5">Item Symbol</span>
                <div className="flex gap-2">
                  {['📦', '🏷️', '💻', '📱', '👕', '🛒', '⚡', '💼'].map(emoji => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => setNewProdEmoji(emoji)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition ${
                        newProdEmoji === emoji ? 'border-blue-600 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {emoji}
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
                  className="rounded-lg bg-blue-600 px-5 py-2 font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700"
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
                <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-700">Save movement offline</button>
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
              <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/70 p-3.5">
                <div>
                  <b className="text-blue-900 text-xs">Need a starting template?</b>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                  Columns: Name, Category, Price, Stock, Unit, Purchase Date, Purchase Price, Weight, Extra, HSN
                  </p>
                </div>
                <button
                  onClick={downloadSampleTemplate}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 font-bold text-white shadow-xs hover:bg-blue-700"
                >
                  <Download size={13} />
                  <span>Sample CSV</span>
                </button>
              </div>

              {/* File Upload Box */}
              <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition">
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
      {toast && (
        <div className="pos-toast">
          <Check size={16} />
          {toast}
          <button onClick={() => setToast('')}>
            <X size={15} />
          </button>
        </div>
      )}
    </main>
  );
}

export type OrderBookSource = 'shop' | 'website';
export type OrderBookTab = 'all' | OrderBookSource;

export type OrderBookEntry = {
  id: string;
  source: OrderBookSource;
  sourceLabel: string;
  orderNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  total: number;
  paymentStatus: string;
  paymentMethod: string;
  items: Array<{ name: string; quantity: number; price?: number; sku?: string }>;
  raw: any;
};

function toDateNumber(value: unknown) {
  const timestamp = new Date(String(value || '')).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

/** Normalize both order sources and deduplicate them by stable, source-scoped IDs. */
export function buildOrderBook(shopOrders: any[], websiteOrders: any[]): OrderBookEntry[] {
  const entries = new Map<string, OrderBookEntry>();

  for (const order of shopOrders) {
    if (!order?.id) continue;
    const id = String(order.id);
    entries.set(`shop:${id}`, {
      id,
      source: 'shop',
      sourceLabel: 'Shop / POS',
      orderNumber: String(order.number || id),
      date: String(order.date || ''),
      customerName: String(order.customer || 'Walk-in customer'),
      customerPhone: String(order.phone || ''),
      total: Number(order.total) || 0,
      paymentStatus: order.sync === 'synced' ? 'SYNCED' : 'SAVED ON DEVICE',
      paymentMethod: String(order.method || '—'),
      items: Array.isArray(order.items) ? order.items : [],
      raw: { ...order, orderNumber: order.number, orderDate: order.date, customer: { name: order.customer, phone: order.phone }, source: 'Shop / POS' },
    });
  }

  for (const order of websiteOrders) {
    if (!order?.id) continue;
    const id = String(order.id);
    entries.set(`website:${id}`, {
      id,
      source: 'website',
      sourceLabel: String(order.website?.name || order.source || 'Website'),
      orderNumber: String(order.orderNumber || id),
      date: String(order.orderDate || order.createdAt || ''),
      customerName: String(order.customer?.name || 'Website customer'),
      customerPhone: String(order.customer?.phone || order.customer?.mobile || ''),
      total: Number(order.total) || 0,
      paymentStatus: String(order.paymentStatus || 'PENDING').toUpperCase(),
      paymentMethod: String(order.paymentMethod || order.payment?.method || 'Online'),
      items: Array.isArray(order.items) ? order.items : [],
      raw: order,
    });
  }

  return Array.from(entries.values()).sort((a, b) => toDateNumber(b.date) - toDateNumber(a.date));
}

export function filterOrderBook(
  entries: OrderBookEntry[],
  options: { tab: OrderBookTab; query: string; status?: string },
) {
  const query = options.query.trim().toLocaleLowerCase();
  return entries.filter((entry) => {
    if (options.tab !== 'all' && entry.source !== options.tab) return false;
    if (options.status && options.status !== 'ALL' && entry.paymentStatus !== options.status) return false;
    if (!query) return true;
    const haystack = `${entry.orderNumber} ${entry.customerName} ${entry.customerPhone} ${entry.sourceLabel} ${entry.items.map(item => item.name).join(' ')}`.toLocaleLowerCase();
    return haystack.includes(query);
  });
}

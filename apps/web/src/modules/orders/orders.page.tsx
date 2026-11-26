'use client';

import * as React from 'react';
import { WorkspaceHeader } from '@/components/workspace/header';
import { WorkspaceTablePanel } from '@/components/workspace/table';
import { WorkspaceStatusBadge } from '@/components/workspace/status';
import { formatMoney, formatDate } from '@/lib/utils';
import { Zap, CheckCircle, ShieldCheck, Search, ChevronDown, ChevronLeft, ChevronRight, SlidersHorizontal, Printer, WifiOff } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import { AiPageAgentBanner } from '@/components/ai/ai-page-agent-banner';
import { AiSymbol } from '@/components/ui/ai-symbol';
import { getOfflineCache, setOfflineCache } from '@/lib/offline-invoices';
import { printKitchenOrderTicket } from '@/lib/print-documents';
import { buildOrderBook, filterOrderBook, type OrderBookTab } from '@/lib/order-book';

export function OrdersPage() {
  const [orders, setOrders] = React.useState<any[]>([]);
  const [shopOrders, setShopOrders] = React.useState<any[]>([]);
  const [sourceTab, setSourceTab] = React.useState<OrderBookTab | 'all'>('all');
  const [error, setError] = React.useState('');
  const [simulating, setSimulating] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('ALL');
  const [page, setPage] = React.useState(1);
  const [isOnline, setIsOnline] = React.useState(true);
  const orderBook = React.useMemo(() => buildOrderBook(shopOrders, orders), [shopOrders, orders]);
  const filteredOrders = React.useMemo(() => filterOrderBook(orderBook, {
    tab: sourceTab,
    query: search,
    status: sourceTab === 'website' ? statusFilter : 'ALL',
  }), [orderBook, sourceTab, search, statusFilter]);
  const pageSize = 25;
  const pageCount = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const pageOrders = filteredOrders.slice((Math.min(page, pageCount) - 1) * pageSize, Math.min(page, pageCount) * pageSize);

  React.useEffect(() => {
    const refreshShopOrders = () => setShopOrders(getOfflineCache<any[]>('shop-orders', []));
    refreshShopOrders();
    window.addEventListener('storage', refreshShopOrders);
    window.addEventListener('focus', refreshShopOrders);
    return () => { window.removeEventListener('storage', refreshShopOrders); window.removeEventListener('focus', refreshShopOrders); };
  }, []);

  const load = React.useCallback(() => {
    ApiClient.get<any>('/orders?limit=100')
      .then((data) => {
        setOrders(data.items || []);
        setOfflineCache('orders', data.items || []);
        setIsOnline(true);
      })
      .catch((reason) => {
        const cached = getOfflineCache<any[]>('orders', []);
        setOrders(cached);
        if (!navigator.onLine || reason instanceof TypeError) setIsOnline(false);
        else setError(reason.message || 'Could not load orders.');
      });
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    const onOnline = () => { setIsOnline(true); load(); };
    const onOffline = () => setIsOnline(false);
    setIsOnline(navigator.onLine);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, [load]);

  // Autonomous Agent Listeners for Orders
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOrderEvent = async () => {
      await simulateOrder();
    };

    window.addEventListener('billpilot:simulate-order', handleOrderEvent);
    window.addEventListener('billpilot:create-order', handleOrderEvent);

    const params = new URLSearchParams(window.location.search);
    if (params.get('autoSimulate') === 'true') {
      simulateOrder();
    }

    return () => {
      window.removeEventListener('billpilot:simulate-order', handleOrderEvent);
      window.removeEventListener('billpilot:create-order', handleOrderEvent);
    };
  }, []);

  async function generate(orderId: string) {
    setError('');
    try {
      await ApiClient.post(`/orders/${orderId}/generate-invoice`);
      await load();
    } catch (reason: any) {
      setError(reason.message);
    }
  }

  async function simulateOrder() {
    setError('');
    setSimulating(true);
    try {
      await ApiClient.post('/ai/simulate-order');
      await load();
    } catch (reason: any) {
      setError(reason.message);
    } finally {
      setSimulating(false);
    }
  }

  React.useEffect(() => { setPage(1); }, [sourceTab, search, statusFilter]);

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title="Order book"
        description="Shop orders saved on this device and online orders from your connected website, kept in separate views."
        badge="Shop + Website"
        primaryAction={sourceTab === 'shop' ? undefined : {
          label: simulating ? 'Simulating…' : 'Simulate Inbound Order',
          onClick: simulateOrder,
          icon: <Zap className="h-3.5 w-3.5" />,
        }}
      />

      {/* Autonomous AI Guidance Agent Banner */}
      {sourceTab !== 'shop' && <AiPageAgentBanner module="orders" onActionComplete={load} />}

      {!isOnline && (
        <div role="status" className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-900">
          <WifiOff className="h-4 w-4" /> Offline orders view · cached orders and kitchen tickets are available on this device.
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 border border-rose-200">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Order source">
        {([{ id: 'all', label: `All orders · ${orderBook.length}` }, { id: 'shop', label: `Shop orders · ${shopOrders.length}` }, { id: 'website', label: `Online orders · ${orders.length}` }] as const).map(tab => <button key={tab.id} role="tab" aria-selected={sourceTab === tab.id} onClick={() => setSourceTab(tab.id)} className={`rounded-xl border px-4 py-2 text-xs font-bold transition ${sourceTab === tab.id ? 'border-blue-600 bg-blue-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'}`}>{tab.label}</button>)}
      </div>

      {/* Search & filter toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-[4px] border border-[#CBD5E1] bg-white shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search orders, customers, or SKUs..."
            className="w-full h-[36px] rounded-[4px] border border-[#CBD5E1] bg-white pl-9 pr-4 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <div className="relative">
            <select
              aria-label="Filter status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              disabled={sourceTab === 'shop'}
              className="appearance-none h-[36px] rounded-[4px] border border-[#CBD5E1] bg-white pl-3 pr-8 text-[13px] font-medium text-[#334155] hover:border-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors cursor-pointer"
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748B] pointer-events-none" />
          </div>

          {/* Date range filter */}
          <div className="relative">
            <select
              aria-label="Filter date"
              className="appearance-none h-[36px] rounded-[4px] border border-[#CBD5E1] bg-white pl-3 pr-8 text-[13px] font-medium text-[#334155] hover:border-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors cursor-pointer"
            >
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Month</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748B] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Data Table */}
      <WorkspaceTablePanel>
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3.5">Order #</th>
              <th className="px-4 py-3.5">Customer</th>
              <th className="px-4 py-3.5">Source</th>
              <th className="px-4 py-3.5">AI Fraud Risk</th>
              <th className="px-4 py-3.5">Date</th>
              <th className="px-4 py-3.5">Payment</th>
              <th className="px-4 py-3.5">Total</th>
              <th className="px-6 py-3.5 text-right">Print & Billing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {pageOrders.map((entry) => (
              <tr key={`${entry.source}:${entry.id}`} className="hover:bg-blue-50/30 transition">
                <td className="px-6 py-4 font-mono font-bold text-blue-600">
                  {entry.orderNumber}
                </td>
                <td className="px-4 py-4">
                  <span className="font-bold text-slate-900">{entry.customerName}</span>
                  {entry.customerPhone && (
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{entry.customerPhone}</p>
                  )}
                </td>
                <td className="px-4 py-4">
                  <span className={`inline-flex rounded-lg px-2 py-0.5 text-[11px] font-bold ${entry.source === 'shop' ? 'bg-blue-50 text-blue-700' : 'bg-violet-50 text-violet-700'}`}>
                    {entry.source === 'shop' ? 'Shop / POS' : entry.sourceLabel}
                  </span>
                </td>
                <td className="px-4 py-4">
                  {entry.source === 'website' ? <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700"><ShieldCheck className="h-3 w-3" /> Verified</span> : <span className="text-[10px] text-slate-400">Local sale</span>}
                </td>
                <td className="px-4 py-4 text-slate-500">{entry.date ? formatDate(entry.date) : '—'}</td>
                <td className="px-4 py-4">
                  <WorkspaceStatusBadge status={entry.paymentStatus} />
                </td>
                <td className="px-4 py-4 font-bold text-slate-900">
                  {formatMoney(entry.total)}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      try { printKitchenOrderTicket(entry.raw); }
                      catch (reason: any) { setError(reason.message || 'Could not open the kitchen ticket for printing.'); }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100"
                    title="Print Kitchen Order Ticket (KOT)"
                  >
                    <Printer className="h-3.5 w-3.5" /> Print KOT
                  </button>
                  {entry.source === 'shop' ? (
                    <a href="/offline-pos" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">Open offline POS</a>
                  ) : entry.raw.invoiceId ? (
                    <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                      <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
                      Invoice Linked
                    </span>
                  ) : (
                    <button
                      onClick={() => generate(entry.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition active:scale-95"
                    >
                      <Zap className="h-3 w-3" />
                      1-Click Bill
                    </button>
                  )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!filteredOrders.length && (
          <div className="p-12 text-center">
            <p className="text-sm font-semibold text-slate-500">{sourceTab === 'shop' ? 'Shop bills saved on this device will appear here.' : sourceTab === 'website' ? 'No website orders match this view.' : 'No orders match this search.'}</p>
            {sourceTab !== 'shop' && <button onClick={simulateOrder} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"><Zap className="h-3.5 w-3.5" /> Simulate Live Inbound Order</button>}
          </div>
        )}

        {/* Zoho-Style Pagination Bar */}
        {filteredOrders.length > 0 && (
          <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 text-xs font-bold text-slate-600 bg-slate-50/50">
            <span>Showing {Math.min(filteredOrders.length, (Math.min(page, pageCount) - 1) * pageSize + 1)}–{Math.min(page * pageSize, filteredOrders.length)} of {filteredOrders.length} orders</span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span className="px-2">Page {Math.min(page, pageCount)} / {pageCount}</span>
              <button
                disabled={page >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </WorkspaceTablePanel>
    </div>
  );
}

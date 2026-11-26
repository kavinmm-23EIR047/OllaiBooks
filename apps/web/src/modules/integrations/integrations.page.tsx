'use client';

import * as React from 'react';
import { WorkspaceHeader } from '@/components/workspace/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Plus, Key, CheckCircle2, ShoppingBag, Store, Check, RefreshCw } from 'lucide-react';
import { ApiClient } from '@/lib/api-client';
import { AiPageAgentBanner } from '@/components/ai/ai-page-agent-banner';
import { Modal, FormField } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

export function IntegrationsPage() {
  const [websites, setWebsites] = React.useState<any[]>([]);
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState('');
  const [oneTime, setOneTime] = React.useState<any>(null);
  const [activeTab, setActiveTab] = React.useState('ALL');
  const [form, setForm] = React.useState({ name: '', domain: '', platform: 'SHOPIFY' });

  const load = React.useCallback(() => {
    ApiClient.get<any>('/integrations/websites')
      .then((data) => setWebsites(Array.isArray(data) ? data : data?.items || []))
      .catch((reason) => setError(reason.message));
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function connect(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const result = await ApiClient.post<any>('/integrations/websites', form);
      setOneTime(result.credentials);
      setOpen(false);
      await load();
    } catch (reason: any) {
      setError(reason.message);
    }
  }

  async function rotate(id: string) {
    setError('');
    try {
      const result = await ApiClient.post<any>(`/integrations/websites/${id}/rotate-secret`);
      setOneTime({ webhookSecret: result.webhookSecret });
    } catch (reason: any) {
      setError(reason.message);
    }
  }

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title="Website Integrations"
        description="Connect your e-commerce stores to receive orders."
        primaryAction={{
          label: 'Connect Website',
          onClick: () => setOpen((value) => !value),
          icon: <Plus className="h-3.5 w-3.5" />,
        }}
      />

      {/* Autonomous AI Guidance Agent Banner */}
      <AiPageAgentBanner module="orders" onActionComplete={load} />

      {/* Connect Website Form Modal (Popup Style) */}
      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Connect E-Commerce Website"
        subtitle="Generate HMAC API credentials and webhooks for live store order sync"
        icon={<Globe className="h-4 w-4 text-[#0066FF]" />}
        maxWidth="md"
      >
        <form onSubmit={connect} className="space-y-4">
          <FormField label="Store Name" required>
            <input
              required
              placeholder="e.g. Acme Lifestyle Store"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
            />
          </FormField>

          <FormField label="Store Domain / URL" required>
            <input
              required
              placeholder="store.myshopify.com or api.store.com"
              value={form.domain}
              onChange={(e) => setForm({ ...form, domain: e.target.value })}
              className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors font-mono"
            />
          </FormField>

          <FormField label="E-Commerce Platform" required>
            <select
              value={form.platform}
              onChange={(e) => setForm({ ...form, platform: e.target.value })}
              className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#0F172A] focus:border-[#0066FF] focus:outline-none transition-colors font-medium"
            >
              {['SHOPIFY', 'WOOCOMMERCE', 'CUSTOM', 'WORDPRESS', 'MAGENTO', 'API'].map((platform) => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
            </select>
          </FormField>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
            >
              Create Credentials
            </Button>
          </div>
        </form>
      </Modal>

      {oneTime && (
        <div className="space-y-2 rounded-2xl border border-amber-300 bg-amber-50/90 p-5 text-xs text-amber-950 shadow-xs">
          <p className="font-bold text-amber-900">
            ⚠️ Save this webhook secret now. It is encrypted and will not be displayed again:
          </p>
          <pre className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-white p-3.5 text-xs font-mono border border-amber-200">
            {JSON.stringify(oneTime, null, 2)}
          </pre>
          <button
            onClick={() => setOneTime(null)}
            className="rounded-lg bg-amber-200 px-3 py-1 font-bold text-amber-900 hover:bg-amber-300"
          >
            Dismiss credentials
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 border border-rose-200">
          {error}
        </p>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-2xl border border-slate-200/90 bg-white w-fit shadow-xs">
        {['ALL', 'SHOPIFY', 'WOOCOMMERCE'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-4 py-1.5 text-xs font-bold transition-all ${
              activeTab === tab ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Integration Store Cards (matching Image 1) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Shopify Platform Card */}
        <Card className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-emerald-300 transition">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-xs">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Shopify</h4>
                <p className="text-xs text-slate-400">
                  {websites.some((w) => w.platform === 'SHOPIFY') ? 'Connected' : 'Not Connected'}
                </p>
              </div>
            </div>
            <Badge variant={websites.some((w) => w.platform === 'SHOPIFY') ? 'success' : 'secondary'}>
              {websites.some((w) => w.platform === 'SHOPIFY') ? 'ACTIVE' : 'READY'}
            </Badge>
          </div>

          <div className="mt-5 space-y-2 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-2 text-emerald-700">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Import orders automatically via webhooks</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Real-time webhook sync</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-700">
              <Check className="h-4 w-4 text-emerald-600" />
              <span>Auto-invoice generation with GST compliance</span>
            </div>
          </div>

          <button
            onClick={() => {
              setForm({ name: 'Acme Shopify Store', domain: 'acme.myshopify.com', platform: 'SHOPIFY' });
              setOpen(true);
            }}
            className="mt-6 w-full rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            Connect Shopify
          </button>
        </Card>

        {/* WooCommerce Platform Card */}
        <Card className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-purple-300 transition">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 shadow-xs">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">WooCommerce</h4>
                <p className="text-xs text-slate-400">
                  {websites.some((w) => w.platform === 'WOOCOMMERCE') ? 'Connected' : 'Not Connected'}
                </p>
              </div>
            </div>
            <Badge variant={websites.some((w) => w.platform === 'WOOCOMMERCE') ? 'success' : 'secondary'}>
              {websites.some((w) => w.platform === 'WOOCOMMERCE') ? 'ACTIVE' : 'READY'}
            </Badge>
          </div>

          <div className="mt-5 space-y-2 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-2 text-purple-700">
              <Check className="h-4 w-4 text-purple-600" />
              <span>Import orders automatically via webhooks</span>
            </div>
            <div className="flex items-center gap-2 text-purple-700">
              <Check className="h-4 w-4 text-purple-600" />
              <span>Real-time webhook sync</span>
            </div>
            <div className="flex items-center gap-2 text-purple-700">
              <Check className="h-4 w-4 text-purple-600" />
              <span>Auto-invoice generation with GST compliance</span>
            </div>
          </div>

          <button
            onClick={() => {
              setForm({ name: 'Acme WooCommerce Store', domain: 'store.acmewebsite.com', platform: 'WOOCOMMERCE' });
              setOpen(true);
            }}
            className="mt-6 w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-purple-700 transition"
          >
            Connect WooCommerce
          </button>
        </Card>
      </div>

      {/* Connected Websites List */}
      {websites.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Active Connected Webhooks ({websites.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {websites.map((site) => (
              <Card key={site.id} className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs">
                <div className="flex items-start justify-between">
                  <div>
                    <h5 className="font-bold text-slate-900">{site.name}</h5>
                    <p className="text-xs font-mono text-slate-400">{site.domain}</p>
                  </div>
                  <Badge variant="success">ACTIVE</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                  <span>Orders synced: <b>{site.totalOrdersSynced || 7}</b></span>
                  <button
                    onClick={() => rotate(site.id)}
                    className="flex items-center gap-1 text-blue-600 font-bold hover:underline"
                  >
                    <Key className="h-3 w-3" /> Rotate Secret
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

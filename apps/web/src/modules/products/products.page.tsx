'use client';

import * as React from 'react';
import { ApiClient } from '@/lib/api-client';
import { WorkspaceHeader } from '@/components/workspace/header';
import { WorkspaceTablePanel } from '@/components/workspace/table';
import { formatMoney } from '@/lib/utils';
import {
  Plus,
  Search,
  ChevronDown,
  Boxes,
  Package,
  Tag,
  ShieldCheck,
  Bot,
  CheckCircle2,
  Sparkles,
  Upload,
  FileSpreadsheet,
  Download,
} from 'lucide-react';
import { AiPageAgentBanner } from '@/components/ai/ai-page-agent-banner';
import { AiSymbol } from '@/components/ui/ai-symbol';
import { Modal, FormField } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';

interface ProductAgentAutoFillStatus {
  active: boolean;
  step: number;
  currentField: 'name' | 'price' | 'tax' | 'hsn' | 'done';
  statusText: string;
  data: {
    name: string;
    unitPrice: string;
    taxRate: string;
    hsnCode: string;
  };
}

export function ProductsPage() {
  const [products, setProducts] = React.useState<any[]>([]);
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [viewNotice, setViewNotice] = React.useState<string | null>(null);

  // Bulk CSV Import States
  const [csvOpen, setCsvOpen] = React.useState(false);
  const [csvText, setCsvText] = React.useState('');
  const [csvPreview, setCsvPreview] = React.useState<any[]>([]);
  const [csvImporting, setCsvImporting] = React.useState(false);
  const [csvSuccess, setCsvSuccess] = React.useState<string | null>(null);

  const sampleCsvContent = `name,sku,unitPrice,taxRate,hsnCode,stockQuantity
Dark Chocolate Truffle Box,CHOC-001,450,18,1806,150
Roasted Almond Cocoa Bar,CHOC-002,220,18,1806,280
Sugar-Free Belgian Dark Bites,CHOC-003,380,18,1806,95
Sea Salt Caramel Praline Box,CHOC-004,520,18,1806,60`;

  const parseCsvData = React.useCallback((text: string) => {
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''));
    const items: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
      if (values.length < 2) continue;
      const row: any = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || '';
      });
      const name = row.name || row.title || row.product || row.item || values[0];
      const sku = row.sku || row.code || `SKU-${Date.now().toString().slice(-4)}-${i}`;
      const unitPrice = parseFloat(row.unitprice || row.price || row.rate || values[2] || '0') || 0;
      const taxRate = parseFloat(row.taxrate || row.tax || row.gst || values[3] || '18') || 18;
      const hsnCode = row.hsncode || row.hsn || values[4] || '1806';
      const stockQuantity = parseInt(row.stockquantity || row.stock || row.quantity || values[5] || '0', 10) || 0;

      items.push({ name, sku, unitPrice, taxRate, hsnCode, stockQuantity });
    }
    return items;
  }, []);

  const handleCsvTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCsvText(val);
    setCsvPreview(parseCsvData(val));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      setCsvText(content);
      setCsvPreview(parseCsvData(content));
    };
    reader.readAsText(file);
  };

  const handleImportCsv = async () => {
    if (!csvPreview.length) return;
    setCsvImporting(true);
    setError('');
    try {
      const res = await ApiClient.post<any>('/products/bulk', { items: csvPreview });
      setCsvSuccess(`Successfully imported ${res.count || csvPreview.length} products with GST tax rates into catalog!`);
      setCsvOpen(false);
      setCsvText('');
      setCsvPreview([]);
      await load();
      setTimeout(() => setCsvSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCsvImporting(false);
    }
  };

  const [form, setForm] = React.useState({
    name: '',
    sku: '',
    description: '',
    unit: 'unit',
    unitPrice: '',
    currency: 'INR',
    taxRate: '18',
    taxCategory: 'IT_SERVICES',
    hsnCode: '998314',
  });

  const formRef = React.useRef(form);
  React.useEffect(() => {
    formRef.current = form;
  }, [form]);

  // Autonomous AI Agent Live Typing & Visual Auto-Fill State
  const [agentAutoFill, setAgentAutoFill] = React.useState<ProductAgentAutoFillStatus | null>(null);

  const lastAutoFillTimestampRef = React.useRef(0);
  const sequenceTimersRef = React.useRef<NodeJS.Timeout[]>([]);

  const clearAllSequenceTimers = React.useCallback(() => {
    sequenceTimersRef.current.forEach((t) => clearTimeout(t));
    sequenceTimersRef.current = [];
  }, []);

  const load = React.useCallback(() => {
    ApiClient.get<any>('/products')
      .then((data) => setProducts(Array.isArray(data) ? data : data?.items || []))
      .catch((reason) => setError(reason.message));
  }, []);

  // Visual, paced auto-filling sequence (550ms intervals: readable, natural, and responsive)
  const runProductAutoFill = React.useCallback(
    (detail: any) => {
      const now = Date.now();
      if (now - lastAutoFillTimestampRef.current < 1500) {
        return; // Debounce rapid double calls
      }
      lastAutoFillTimestampRef.current = now;

      clearAllSequenceTimers();

      const prodName = detail.name || detail.itemName || 'Dedicated Cloud Server Maintenance';
      const prodPrice = String(detail.unitPrice || detail.price || detail.baseAmount || '25000');
      const prodTax = String(detail.taxRate || detail.tax || '18');
      const prodHsn = detail.hsnCode || detail.hsn || '998314';

      // 1. Immediately open the popup modal and pre-fill all fields
      setOpen(true);
      const newSku = `SKU-${Date.now().toString().slice(-5)}`;
      setForm({
        name: prodName,
        sku: newSku,
        description: `${prodName} with ${prodTax}% GST statutory classification.`,
        unit: 'unit',
        unitPrice: prodPrice,
        currency: 'INR',
        taxRate: prodTax,
        taxCategory: 'IT_SERVICES',
        hsnCode: prodHsn,
      });

      // Step 1: Product / Service Name (550ms)
      setAgentAutoFill({
        active: true,
        step: 1,
        currentField: 'name',
        statusText: `🤖 Autonomous Agent: Typing Item Name "${prodName}"...`,
        data: {
          name: prodName,
          unitPrice: prodPrice,
          taxRate: prodTax,
          hsnCode: prodHsn,
        },
      });

      const t1 = setTimeout(() => {
        // Step 2: Unit Price (550ms)
        setAgentAutoFill((prev) =>
          prev
            ? {
                ...prev,
                step: 2,
                currentField: 'price',
                statusText: `🤖 Autonomous Agent: Entering Price ₹${Number(prodPrice).toLocaleString('en-IN')}...`,
              }
            : null
        );
        setForm((prev) => ({ ...prev, unitPrice: prodPrice }));

        const t2 = setTimeout(() => {
          // Step 3: GST Tax Rate (550ms)
          setAgentAutoFill((prev) =>
            prev
              ? {
                  ...prev,
                  step: 3,
                  currentField: 'tax',
                  statusText: `🤖 Autonomous Agent: Applying GST Tax Rate ${prodTax}%...`,
                }
              : null
          );
          setForm((prev) => ({ ...prev, taxRate: prodTax }));

          const t3 = setTimeout(() => {
            // Step 4: HSN / SAC Code (550ms)
            setAgentAutoFill((prev) =>
              prev
                ? {
                    ...prev,
                    step: 4,
                    currentField: 'hsn',
                    statusText: `🤖 Autonomous Agent: Assigning HSN/SAC Code "${prodHsn}"...`,
                  }
                : null
            );
            setForm((prev) => ({ ...prev, hsnCode: prodHsn }));

            const t4 = setTimeout(() => {
              // Step 5: Completed & Requesting Confirmation
              setAgentAutoFill((prev) =>
                prev
                  ? {
                      ...prev,
                      step: 5,
                      currentField: 'done',
                      statusText: `✓ Product details ready for "${prodName}" (₹${Number(prodPrice).toLocaleString('en-IN')} + ${prodTax}% GST). Should I proceed: yes or no?`,
                    }
                  : null
              );
            }, 550);
            sequenceTimersRef.current.push(t4);
          }, 550);
          sequenceTimersRef.current.push(t3);
        }, 550);
        sequenceTimersRef.current.push(t2);
      }, 550);
      sequenceTimersRef.current.push(t1);
    },
    [clearAllSequenceTimers]
  );

  const handleAgentProceedSave = React.useCallback(async () => {
    const curForm = formRef.current;
    setSaving(true);
    try {
      await ApiClient.post('/products', {
        name: curForm.name || 'Dedicated Cloud Server Maintenance',
        sku: curForm.sku || `SKU-${Date.now().toString().slice(-5)}`,
        description: curForm.description || 'Catalog item created via ollaiBooks AI Agent',
        unit: curForm.unit || 'unit',
        unitPrice: Number(curForm.unitPrice || 25000),
        currency: 'INR',
        taxRate: Number(curForm.taxRate || 18),
        taxCategory: 'IT_SERVICES',
        hsnCode: curForm.hsnCode || '998314',
      });
      await load();
      setAgentAutoFill(null);
      setOpen(false);
    } catch {
      await load();
      setAgentAutoFill(null);
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }, [load]);

  React.useEffect(() => {
    load();

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('autoCreate') === 'true' || params.get('create') === 'true') {
        runProductAutoFill({
          name: params.get('name') || 'Dedicated Cloud Server Maintenance',
          unitPrice: params.get('price') || '25000',
          taxRate: params.get('tax') || '18',
          hsnCode: params.get('hsn') || '998314',
        });
        window.history.replaceState(null, '', window.location.pathname);
      } else if (params.get('view') === 'true') {
        setViewNotice('Displaying all registered products, services, and statutory GST classifications.');
        window.history.replaceState(null, '', window.location.pathname);
      }

      const handleCreateProductEvent = (e: any) => {
        runProductAutoFill(e.detail || {});
      };

      const handleConfirmProduct = async () => {
        await handleAgentProceedSave();
      };

      const handleCancelProduct = () => {
        clearAllSequenceTimers();
        setAgentAutoFill(null);
        setOpen(false);
      };

      window.addEventListener('billpilot:create-product' as any, handleCreateProductEvent);
      window.addEventListener('billpilot:product-created' as any, handleConfirmProduct);
      window.addEventListener('billpilot:cancel-product' as any, handleCancelProduct);

      return () => {
        window.removeEventListener('billpilot:create-product' as any, handleCreateProductEvent);
        window.removeEventListener('billpilot:product-created' as any, handleConfirmProduct);
        window.removeEventListener('billpilot:cancel-product' as any, handleCancelProduct);
      };
    }
  }, [load, runProductAutoFill, handleAgentProceedSave]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await ApiClient.post('/products', {
        ...form,
        unitPrice: Number(form.unitPrice),
        taxRate: Number(form.taxRate),
      });
      setOpen(false);
      setAgentAutoFill(null);
      setForm({
        name: '',
        sku: '',
        description: '',
        unit: 'unit',
        unitPrice: '',
        currency: 'INR',
        taxRate: '18',
        taxCategory: 'IT_SERVICES',
        hsnCode: '998314',
      });
      await load();
    } catch (reason: any) {
      setError(reason.message);
    } finally {
      setSaving(false);
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title="Product Catalog"
        description="Manage products, prices, HSN and GST tax rates."
        primaryAction={{
          label: 'Add Product',
          onClick: () => {
            setAgentAutoFill(null);
            setOpen((value) => !value);
          },
          icon: <Plus className="h-3.5 w-3.5" />,
        }}
      >
        <Button
          variant="outline"
          onClick={() => setCsvOpen(true)}
          className="h-[34px] px-3.5 rounded-[4px] text-[13px] font-semibold border border-[#CBD5E1] text-[#0066FF] hover:bg-[#F0F7FF] flex items-center gap-1.5 transition-colors"
        >
          <Upload className="h-3.5 w-3.5" />
          Import CSV / Excel
        </Button>
      </WorkspaceHeader>

      {/* CSV Bulk Import Success Banner */}
      {csvSuccess && (
        <div className="rounded-[4px] border border-emerald-300 bg-emerald-50/90 p-4 flex items-center gap-3 animate-in fade-in shadow-xs text-emerald-900 font-semibold text-xs">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          <span>{csvSuccess}</span>
        </div>
      )}

      {/* Autonomous AI Guidance Agent Banner */}
      <AiPageAgentBanner module="products" onActionComplete={load} />

      {/* AI View Products Notice Banner */}
      {viewNotice && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/90 p-4 flex items-center justify-between animate-in fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <Bot className="h-5 w-5 text-blue-600 animate-pulse flex-shrink-0" />
            <div>
              <h4 className="text-xs font-bold text-blue-950">
                Autonomous Agent Query: Products & Services Catalog
              </h4>
              <p className="text-[12px] text-blue-800 font-medium mt-0.5">
                {viewNotice}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewNotice(null)}
            className="text-xs h-7 border-blue-300 text-blue-700 hover:bg-blue-100 font-bold"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Add Product Popup Modal */}
      <Modal
        open={open}
        onClose={() => {
          clearAllSequenceTimers();
          setAgentAutoFill(null);
          setOpen(false);
        }}
        title="Add Product or Service"
        subtitle="Register a billable catalog item with GST tax classification and unit pricing"
        size="lg"
      >
        <form onSubmit={save} className="space-y-4">
          {/* Autonomous AI Agent Live Auto-fill Indicator Banner */}
          {agentAutoFill?.active && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/90 p-3.5 flex items-center justify-between text-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-blue-600 animate-pulse flex-shrink-0" />
                <span className="font-bold text-blue-950">
                  {agentAutoFill.statusText}
                </span>
              </div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full flex-shrink-0">
                Autonomous Typing
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <FormField label="Product or Service Name" required>
              <div className="relative">
                <input
                  required
                  placeholder="e.g. Cloud Hosting Annual Plan"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`w-full h-[38px] rounded-[4px] border bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none transition-all ${
                    agentAutoFill?.currentField === 'name'
                      ? 'border-blue-500 ring-2 ring-blue-500 shadow-md bg-blue-50/30'
                      : 'border-[#CBD5E1] focus:border-[#0066FF]'
                  }`}
                />
                {agentAutoFill?.currentField === 'name' && (
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded animate-pulse">
                    🤖 Auto-typing...
                  </span>
                )}
              </div>
            </FormField>

            <FormField label="SKU / Item Code" required>
              <input
                required
                placeholder="e.g. SKU-PRO-001"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] font-mono text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
              />
            </FormField>

            <FormField label="Unit Price (₹)" required>
              <div className="relative">
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 2499.00"
                  value={form.unitPrice}
                  onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                  className={`w-full h-[38px] rounded-[4px] border bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none transition-all ${
                    agentAutoFill?.currentField === 'price'
                      ? 'border-blue-500 ring-2 ring-blue-500 shadow-md bg-blue-50/30'
                      : 'border-[#CBD5E1] focus:border-[#0066FF]'
                  }`}
                />
                {agentAutoFill?.currentField === 'price' && (
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded animate-pulse">
                    🤖 Entering price...
                  </span>
                )}
              </div>
            </FormField>

            <FormField label="GST Tax Rate (%)" required>
              <div className="relative">
                <input
                  required
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="e.g. 18"
                  value={form.taxRate}
                  onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                  className={`w-full h-[38px] rounded-[4px] border bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none transition-all ${
                    agentAutoFill?.currentField === 'tax'
                      ? 'border-blue-500 ring-2 ring-blue-500 shadow-md bg-blue-50/30'
                      : 'border-[#CBD5E1] focus:border-[#0066FF]'
                  }`}
                />
                {agentAutoFill?.currentField === 'tax' && (
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded animate-pulse">
                    🤖 Setting tax...
                  </span>
                )}
              </div>
            </FormField>

            <FormField label="HSN / SAC Code">
              <div className="relative">
                <input
                  placeholder="e.g. 998314"
                  value={form.hsnCode}
                  onChange={(e) => setForm({ ...form, hsnCode: e.target.value })}
                  className={`w-full h-[38px] rounded-[4px] border bg-white px-3 text-[14px] font-mono text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none transition-all ${
                    agentAutoFill?.currentField === 'hsn'
                      ? 'border-blue-500 ring-2 ring-blue-500 shadow-md bg-blue-50/30'
                      : 'border-[#CBD5E1] focus:border-[#0066FF]'
                  }`}
                />
                {agentAutoFill?.currentField === 'hsn' && (
                  <span className="absolute right-2.5 top-2.5 text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded animate-pulse">
                    🤖 Auto-assigning...
                  </span>
                )}
              </div>
            </FormField>

            <FormField label="Unit of Measurement">
              <input
                placeholder="e.g. unit, month, license, user"
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full h-[38px] rounded-[4px] border border-[#CBD5E1] bg-white px-3 text-[14px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
              />
            </FormField>
          </div>

          {/* Interactive Agent Confirmation Box */}
          {agentAutoFill?.currentField === 'done' && (
            <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/90 p-4 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-emerald-700 animate-pulse flex-shrink-0" />
                  <span className="text-xs font-bold text-emerald-950">
                    Agent Directive: &quot;I have prepared product details for &apos;{form.name}&apos; (₹{Number(form.unitPrice || 25000).toLocaleString('en-IN')} + {form.taxRate}% GST). Should I proceed: yes or no?&quot;
                  </span>
                </div>
                <span className="rounded-full bg-emerald-200/80 px-2 py-0.5 text-[10px] font-bold text-emerald-800 flex-shrink-0">
                  Ready to Add
                </span>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAgentAutoFill(null)}
                >
                  Cancel / No
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleAgentProceedSave}
                  disabled={saving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {saving ? 'Adding...' : 'Yes, Add to Catalog'}
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                clearAllSequenceTimers();
                setAgentAutoFill(null);
                setOpen(false);
              }}
              className="h-[36px] px-4 rounded-[4px] border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="h-[36px] px-5 rounded-[4px] bg-[#0066FF] hover:bg-[#0052CC] text-white font-medium shadow-none"
            >
              {saving ? 'Saving...' : 'Save Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Bulk CSV Import Modal */}
      <Modal
        open={csvOpen}
        onClose={() => setCsvOpen(false)}
        title="Bulk Import Products via CSV / Excel"
        subtitle="Batch upload catalog items with HSN codes, Indian GST tax rates, and inventory stock"
        size="lg"
      >
        <div className="space-y-4">
          <div className="rounded-[4px] bg-[#F8FAFC] p-3.5 border border-[#CBD5E1] text-[12px] text-[#475569] space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                <FileSpreadsheet className="h-4 w-4 text-[#0066FF]" />
                Supported CSV Columns:
              </span>
              <button
                type="button"
                onClick={() => {
                  setCsvText(sampleCsvContent);
                  setCsvPreview(parseCsvData(sampleCsvContent));
                }}
                className="text-[11px] font-bold text-[#0066FF] hover:underline cursor-pointer bg-white px-2 py-0.5 rounded border border-[#CBD5E1]"
              >
                + Load Chocolate Mine Sample CSV
              </button>
            </div>
            <p className="font-mono text-[11px] text-[#334155] bg-white p-2 rounded border border-[#E2E8F0]">
              name, sku, unitPrice, taxRate, hsnCode, stockQuantity
            </p>
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">
              Select CSV File from Computer
            </label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[13px] font-semibold text-[#334155] mb-1.5">
              Or Paste CSV Data Below
            </label>
            <textarea
              rows={4}
              value={csvText}
              onChange={handleCsvTextChange}
              placeholder="Paste comma-separated rows here..."
              className="w-full rounded-[4px] border border-[#CBD5E1] bg-white p-2.5 text-[12px] font-mono text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
            />
          </div>

          {/* Parsed Preview Table */}
          {csvPreview.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-[#0F172A]">
                  Detected Products ({csvPreview.length})
                </span>
                <span className="text-[11px] text-[#16A34A] font-semibold">
                  Ready to Import with Indian GST
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto border border-[#CBD5E1] rounded-[4px]">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] font-bold text-[#475569]">
                    <tr>
                      <th className="px-3 py-2">Product Name</th>
                      <th className="px-3 py-2">SKU</th>
                      <th className="px-3 py-2">Price (₹)</th>
                      <th className="px-3 py-2">GST %</th>
                      <th className="px-3 py-2">HSN</th>
                      <th className="px-3 py-2">Stock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {csvPreview.map((item, idx) => (
                      <tr key={idx} className="hover:bg-blue-50/20">
                        <td className="px-3 py-1.5 font-medium text-[#0F172A]">{item.name}</td>
                        <td className="px-3 py-1.5 font-mono text-[#64748B]">{item.sku}</td>
                        <td className="px-3 py-1.5 font-semibold text-[#0F172A]">₹{item.unitPrice}</td>
                        <td className="px-3 py-1.5 font-bold text-[#16A34A]">{item.taxRate}%</td>
                        <td className="px-3 py-1.5 font-mono text-[#475569]">{item.hsnCode}</td>
                        <td className="px-3 py-1.5 text-[#334155]">{item.stockQuantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E2E8F0]">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setCsvOpen(false);
                setCsvText('');
                setCsvPreview([]);
              }}
              className="h-[36px] px-4 rounded-[4px] border border-[#CBD5E1] text-[#334155] hover:bg-[#F8FAFC]"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={csvPreview.length === 0 || csvImporting}
              onClick={handleImportCsv}
              className="h-[36px] px-5 rounded-[4px] bg-[#16A34A] hover:bg-[#15803D] text-white font-medium shadow-none cursor-pointer disabled:opacity-50"
            >
              <Upload className="h-3.5 w-3.5 mr-1.5" />
              {csvImporting ? 'Importing…' : `Import ${csvPreview.length} Products`}
            </Button>
          </div>
        </div>
      </Modal>

      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 border border-rose-200">
          {error}
        </p>
      )}

      {/* Zoho-Style Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-[4px] border border-[#CBD5E1] bg-white shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name or SKU..."
            className="w-full h-[36px] rounded-[4px] border border-[#CBD5E1] bg-white pl-9 pr-4 text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:border-[#0066FF] focus:outline-none transition-colors"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              aria-label="Filter category"
              className="appearance-none h-[36px] rounded-[4px] border border-[#CBD5E1] bg-white pl-3 pr-8 text-[13px] font-medium text-[#334155] hover:border-[#94A3B8] focus:border-[#0066FF] focus:outline-none cursor-pointer"
            >
              <option>All Categories</option>
              <option>Software & Licenses</option>
              <option>Hardware</option>
              <option>Services</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748B] pointer-events-none" />
          </div>

          <div className="relative">
            <select
              aria-label="Filter status"
              className="appearance-none h-[36px] rounded-[4px] border border-[#CBD5E1] bg-white pl-3 pr-8 text-[13px] font-medium text-[#334155] hover:border-[#94A3B8] focus:border-[#0066FF] focus:outline-none cursor-pointer"
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Low Stock</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#64748B] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Table / Empty State matching Image 1 */}
      {products.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-16 text-center shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 mb-4 shadow-xs">
            <Package className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No products or services saved yet.</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
            Add your first product to start generating invoices with automatic GST rates.
          </p>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Product
          </button>
        </div>
      ) : (
        <WorkspaceTablePanel>
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-200 bg-slate-50/80 font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Product</th>
                <th className="px-4 py-3.5">SKU</th>
                <th className="px-4 py-3.5">HSN Code</th>
                <th className="px-4 py-3.5">Unit</th>
                <th className="px-4 py-3.5">Price</th>
                <th className="px-4 py-3.5">GST Tax</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-blue-50/30 transition">
                  <td className="px-6 py-4 font-bold text-slate-900">{p.name}</td>
                  <td className="px-4 py-4 font-mono font-bold text-blue-600">{p.sku}</td>
                  <td className="px-4 py-4 font-mono text-slate-600">{p.hsnCode || '998314'}</td>
                  <td className="px-4 py-4 text-slate-600">{p.unit}</td>
                  <td className="px-4 py-4 font-bold text-slate-900">{formatMoney(Number(p.unitPrice))}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-lg bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 border border-emerald-200">
                      {p.taxRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </WorkspaceTablePanel>
      )}
    </div>
  );
}

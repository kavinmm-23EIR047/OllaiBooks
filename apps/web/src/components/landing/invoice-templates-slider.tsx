'use client';

import * as React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Copy,
} from 'lucide-react';
import { FakeUpiQr } from './fake-upi-qr';

export interface InvoiceTemplateConfig {
  id: string;
  name: string;
  category: string;
  badge: string;
  description: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  seller: {
    name: string;
    gstin: string;
    pan: string;
    address: string;
    phone: string;
    email: string;
  };
  buyer: {
    name: string;
    gstin: string;
    state: string;
    stateCode: string;
    address: string;
  };
  items: Array<{
    name: string;
    hsn: string;
    qty: number;
    rate: number;
    amount: number;
  }>;
}

const TEMPLATES: InvoiceTemplateConfig[] = [
  {
    id: 'b2b-corporate',
    name: 'Corporate B2B Tax Invoice',
    category: 'Rule 46 Compliant',
    badge: 'ENTERPRISE GST',
    description: 'Comprehensive statutory GST Rule 46 format with HSN summary, reverse charge declaration, and bank reconciliation.',
    invoiceNo: 'INV-2026-1082',
    date: '22 Nov 2026',
    dueDate: '07 Dec 2026',
    seller: {
      name: 'Acme Corporation Pvt Ltd',
      gstin: '29ABCDE1234F1Z5',
      pan: 'ABCDE1234F',
      address: '100 Innovation Boulevard, Bengaluru, Karnataka 560001',
      phone: '+91 93632 65477',
      email: 'billing@acmestore.in',
    },
    buyer: {
      name: 'Tata Consultancy & Retail Hub',
      gstin: '29AAACT2727Q1ZW',
      state: 'Karnataka',
      stateCode: '29',
      address: 'Plot 44, Electronic City Phase 1, Bengaluru 560100',
    },
    items: [
      { name: 'Enterprise Cloud Billing Software (Annual)', hsn: '998314', qty: 1, rate: 45000, amount: 45000 },
      { name: 'Autonomous Voice Telephony Addon (10k Min)', hsn: '998413', qty: 1, rate: 12500, amount: 12500 },
      { name: 'WhatsApp Business API Onboarding & Webhooks', hsn: '998313', qty: 1, rate: 7500, amount: 7500 },
    ],
  },
  {
    id: 'modern-saas',
    name: 'Modern Tech & SaaS Invoice',
    category: 'OneBill Aesthetic',
    badge: 'POPULAR & SLEEK',
    description: 'Minimalist electric blue layout with integrated dynamic UPI QR, item discounts, and instant payment links.',
    invoiceNo: 'BP-SaaS-4920',
    date: '22 Nov 2026',
    dueDate: '25 Nov 2026',
    seller: {
      name: 'ollaiBooks Technologies Pvt Ltd',
      gstin: '33AAAAA0000A1Z5',
      pan: 'AAAAA0000A',
      address: '104 Tech Hub, Anna Salai, Chennai, Tamil Nadu 600002',
      phone: '+91 98765 43210',
      email: 'finance@billpilot.ai',
    },
    buyer: {
      name: 'TechNova Solutions Ltd',
      gstin: '33AABCT9982M1ZX',
      state: 'Tamil Nadu',
      stateCode: '33',
      address: 'Tower B, Cyber Park, Coimbatore, Tamil Nadu 641014',
    },
    items: [
      { name: 'ollaiBooks Pro Workspace (5 Seats / 1 Year)', hsn: '998315', qty: 1, rate: 24000, amount: 24000 },
      { name: 'High-Speed Multi-Store Sync Gateway', hsn: '998316', qty: 1, rate: 6000, amount: 6000 },
      { name: 'Automated GST Rule 46 E-Invoicing Bridge', hsn: '998314', qty: 1, rate: 5000, amount: 5000 },
    ],
  },
  {
    id: 'retail-pos',
    name: 'Retail POS & Store Slip',
    category: 'E-Commerce Ready',
    badge: 'FAST RETAIL',
    description: 'Ideal for physical stores and chocolate/food brands with product HSNs, bar code, and rapid UPI settlement.',
    invoiceNo: 'POS-CM-8821',
    date: '22 Nov 2026',
    dueDate: 'Immediate',
    seller: {
      name: 'Chocolate Mine Gourmet Store',
      gstin: '29XYZAB5678C1Z9',
      pan: 'XYZAB5678C',
      address: 'Shop 12, Indiranagar 100ft Road, Bengaluru 560038',
      phone: '+91 96007 32162',
      email: 'orders@chocolatemine.com',
    },
    buyer: {
      name: 'Walk-in Retail Customer',
      gstin: 'URP (Unregistered)',
      state: 'Karnataka',
      stateCode: '29',
      address: 'Indiranagar, Bengaluru 560038',
    },
    items: [
      { name: 'Dark Chocolate Truffle Box (500g)', hsn: '180690', qty: 3, rate: 450, amount: 1350 },
      { name: 'Roasted Almond Belgian Cocoa Bar', hsn: '180632', qty: 4, rate: 220, amount: 880 },
      { name: 'Sugar-Free Hazelnut Praline Gift Box', hsn: '180690', qty: 2, rate: 550, amount: 1100 },
    ],
  },
  {
    id: 'consulting-service',
    name: 'Professional Services Voucher',
    category: 'Freelancer & Agency',
    badge: 'AGENCY & TDS',
    description: 'Tailored for agencies and consultants with SAC codes, milestone breakdowns, and TDS guidance notes.',
    invoiceNo: 'AKW-SRV-2026',
    date: '22 Nov 2026',
    dueDate: '06 Dec 2026',
    seller: {
      name: 'Ak Webflair Technologies',
      gstin: '33AABFA1234D1Z2',
      pan: 'AABFA1234D',
      address: 'Tech Innovation Park, Coimbatore, Tamil Nadu 641001',
      phone: '+91 93632 65477',
      email: 'akwebflairtechnologies@gmail.com',
    },
    buyer: {
      name: 'Global Retail Logistics Ltd',
      gstin: '33AABCG5544K1ZR',
      state: 'Tamil Nadu',
      stateCode: '33',
      address: 'Industrial Corridor, Chennai 600032',
    },
    items: [
      { name: 'Online Store Setup & Automatic Stock Sync', hsn: '998314', qty: 1, rate: 38000, amount: 38000 },
      { name: 'GST Tax Setup & WhatsApp Payment Link', hsn: '998313', qty: 1, rate: 16000, amount: 16000 },
    ],
  },
];

export function InvoiceTemplatesSlider() {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [isInterstate, setIsInterstate] = React.useState(false);
  const [isAutoPlay, setIsAutoPlay] = React.useState(true);
  const [copiedInvoice, setCopiedInvoice] = React.useState(false);

  const current = TEMPLATES[activeIdx];

  // Mathematical Calculation of GST Breakdown
  const subtotal = current.items.reduce((sum, item) => sum + item.amount, 0);
  const taxRate = 18; // Standard 18% GST
  const totalTax = Math.round((subtotal * taxRate) / 100);
  const cgstAmount = isInterstate ? 0 : Math.round(totalTax / 2);
  const sgstAmount = isInterstate ? 0 : totalTax - cgstAmount;
  const igstAmount = isInterstate ? totalTax : 0;
  const grandTotal = subtotal + totalTax;

  // Auto-play interval with pause on interaction
  React.useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % TEMPLATES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlay]);

  const handlePrev = () => {
    setIsAutoPlay(false);
    setActiveIdx((prev) => (prev === 0 ? TEMPLATES.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setIsAutoPlay(false);
    setActiveIdx((prev) => (prev + 1) % TEMPLATES.length);
  };

  const handleCopyNo = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(current.invoiceNo);
      setCopiedInvoice(true);
      setTimeout(() => setCopiedInvoice(false), 2000);
    }
  };

  return (
    <section
      id="invoice-templates"
      className="py-16 sm:py-24 bg-gradient-to-b from-white via-slate-50/70 to-blue-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden"
      onMouseEnter={() => setIsAutoPlay(false)}
      onMouseLeave={() => setIsAutoPlay(true)}
    >
      {/* Background Decorative Rings */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-blue-500/5 blur-3xl rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-sky-500/5 blur-3xl rounded-full pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/90 px-3.5 py-1 text-xs font-bold text-blue-700 shadow-xs dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-300">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
            <span>REALISTIC INVOICE TEMPLATES & QR ENGINE</span>
          </div>

          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
            Designed for Every Indian Business{' '}
            <span className="bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
              With 100% GST Compliance
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Slide through real-world invoice templates. Every invoice includes statutory GSTIN, HSN summaries, and a live fake UPI QR code that settles payment instantly.
          </p>
        </div>

        {/* Carousel Tabs & Slider Navigation Bar */}
        <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
          {/* Template Selection Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
            {TEMPLATES.map((tmpl, idx) => {
              const isActive = activeIdx === idx;
              return (
                <button
                  key={tmpl.id}
                  onClick={() => {
                    setIsAutoPlay(false);
                    setActiveIdx(idx);
                  }}
                  className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-[1.02]'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span>{tmpl.name}</span>
                  <span
                    className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-blue-700 text-blue-100'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tmpl.badge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Interactive Live GST Tax Mode Switcher & Slider Arrows */}
          <div className="flex items-center gap-3">
            {/* Tax Mode Toggle */}
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200 shadow-xs text-xs">
              <span className="text-[10px] font-bold text-slate-400 px-1">GST Tax:</span>
              <button
                type="button"
                onClick={() => setIsInterstate(false)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  !isInterstate
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Intrastate (CGST+SGST)
              </button>
              <button
                type="button"
                onClick={() => setIsInterstate(true)}
                className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all cursor-pointer ${
                  isInterstate
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Interstate (IGST)
              </button>
            </div>

            {/* Slider Arrow Controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrev}
                title="Previous Template"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300 active:scale-95 transition cursor-pointer shadow-xs"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleNext}
                title="Next Template"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300 active:scale-95 transition cursor-pointer shadow-xs"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Master Invoice Document Showcase Canvas */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Authentic Full Invoice Sheet */}
          <div className="lg:col-span-8">
            <div className="relative rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900/95 overflow-hidden transition-all duration-300">
              {/* Watermark / Digital Seal */}
              <div className="absolute right-8 top-28 opacity-[0.03] pointer-events-none select-none text-9xl font-black text-slate-900">
                GST
              </div>

              {/* 1. Invoice Top Header & Branding */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-lg shadow-sm">
                      B
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                        {current.seller.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-mono">GSTIN: {current.seller.gstin}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm pt-1">
                    {current.seller.address}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    {current.seller.phone} · {current.seller.email}
                  </p>
                </div>

                {/* Right: Invoice Label & Document Meta */}
                <div className="text-left sm:text-right space-y-1">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200">
                    <ShieldCheck className="h-3 w-3 text-blue-600" />
                    TAX INVOICE (RULE 46)
                  </span>

                  <div className="pt-1">
                    <button
                      onClick={handleCopyNo}
                      className="inline-flex items-center gap-1.5 font-mono font-bold text-base text-slate-900 dark:text-white hover:text-blue-600 transition cursor-pointer"
                    >
                      <span>{current.invoiceNo}</span>
                      <Copy className="h-3 w-3 text-slate-400" />
                    </button>
                    {copiedInvoice && (
                      <span className="block text-[10px] text-emerald-600 font-bold">✓ Copied</span>
                    )}
                  </div>

                  <div className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                    <p>
                      Invoice Date: <strong className="text-slate-800 dark:text-slate-200">{current.date}</strong>
                    </p>
                    <p>
                      Due Date: <strong className="text-slate-800 dark:text-slate-200">{current.dueDate}</strong>
                    </p>
                    <p>
                      Place of Supply:{' '}
                      <strong className="text-blue-600">
                        {current.buyer.stateCode} - {current.buyer.state}
                      </strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Bill To & Ship To Details */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-slate-50/80 p-4 border border-slate-200/70 dark:bg-slate-800/40 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    BILLED TO (BUYER)
                  </span>
                  <p className="font-bold text-slate-900 dark:text-white mt-1 text-sm">
                    {current.buyer.name}
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5">{current.buyer.address}</p>
                  <p className="text-slate-500 font-mono mt-1">GSTIN / UIN: {current.buyer.gstin}</p>
                </div>

                <div className="sm:border-l sm:border-slate-200 sm:pl-4 dark:border-slate-700">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    TAX AUDIT CLASSIFICATION
                  </span>
                  <div className="mt-1 space-y-1 text-slate-600 dark:text-slate-300">
                    <p className="flex justify-between">
                      <span>Supply Type:</span>
                      <strong className="text-blue-600">{isInterstate ? 'Interstate (IGST)' : 'Intrastate (CGST+SGST)'}</strong>
                    </p>
                    <p className="flex justify-between">
                      <span>Reverse Charge:</span>
                      <strong className="text-slate-800 dark:text-slate-200">No (Standard Taxable)</strong>
                    </p>
                    <p className="flex justify-between">
                      <span>Govt E-Invoice:</span>
                      <strong className="text-emerald-600">Verified &amp; Approved</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. Itemized Products & Services Table */}
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b-2 border-slate-200 bg-slate-100/70 font-bold uppercase tracking-wider text-slate-600 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Item Description</th>
                      <th className="py-2.5 px-3">HSN / SAC</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Rate</th>
                      <th className="py-2.5 px-3 text-right">Taxable (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {current.items.map((it, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-3 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                          {it.name}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-500">{it.hsn}</td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                          {it.qty}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                          ₹{it.rate.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          ₹{it.amount.toLocaleString('en-IN')}.00
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 4. Tax Calculations & Grand Total Breakdown */}
              <div className="mt-6 pt-4 border-t-2 border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                {/* Left: Amount in Words & Terms */}
                <div className="space-y-2 text-xs">
                  <div className="rounded-lg bg-blue-50/60 p-3 border border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/40">
                    <span className="text-[10px] font-bold text-blue-700 uppercase">Total Amount in Words:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 capitalize mt-0.5">
                      Rupees {grandTotal.toLocaleString('en-IN')} Only
                    </p>
                  </div>
                  <div className="text-[11px] text-slate-500 space-y-0.5">
                    <p>• Bank: HDFC Bank · A/C: 5020008492019 · IFSC: HDFC0001042</p>
                    <p>• Certified that the particulars given above are true and correct.</p>
                  </div>
                </div>

                {/* Right: Tax Breakdown Box */}
                <div className="space-y-2 text-xs font-semibold">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Taxable Subtotal</span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      ₹{subtotal.toLocaleString('en-IN')}.00
                    </span>
                  </div>

                  {!isInterstate ? (
                    <>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>Central GST (CGST 9%)</span>
                        <span className="font-mono text-slate-900 dark:text-white">
                          ₹{cgstAmount.toLocaleString('en-IN')}.00
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-400">
                        <span>State GST (SGST 9%)</span>
                        <span className="font-mono text-slate-900 dark:text-white">
                          ₹{sgstAmount.toLocaleString('en-IN')}.00
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-blue-600">
                      <span>Integrated GST (IGST 18%)</span>
                      <span className="font-mono font-bold">
                        ₹{igstAmount.toLocaleString('en-IN')}.00
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between pt-2 border-t-2 border-slate-900 dark:border-slate-100 text-base font-extrabold text-blue-600 dark:text-blue-400">
                    <span>Grand Total Due</span>
                    <span className="font-mono">₹{grandTotal.toLocaleString('en-IN')}.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Fake UPI QR Code, Settlement Cockpit & Template Details */}
          <div className="lg:col-span-4 space-y-5">
            {/* 1. Dynamic Fake UPI QR Box */}
            <FakeUpiQr
              amount={grandTotal.toLocaleString('en-IN')}
              invoiceNumber={current.invoiceNo}
              payeeName={current.seller.name}
              upiId="billpilot.settle@icici"
              size="lg"
            />

            {/* 2. Template Metadata Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">TEMPLATE SPECS</span>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Ready to Print & Export
                </span>
              </div>

              <h4 className="text-base font-bold text-slate-900 dark:text-white">{current.name}</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {current.description}
              </p>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500">Supported Formats:</span>
                <span className="text-slate-900 dark:text-white font-mono">PDF · WhatsApp · HTML</span>
              </div>

              <div className="pt-1 flex gap-2">
                <a
                  href="/invoices"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-95 transition"
                >
                  <span>Use This Template</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>

            {/* 3. Slider Step Indicators */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {TEMPLATES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setIsAutoPlay(false);
                    setActiveIdx(i);
                  }}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    activeIdx === i ? 'w-8 bg-blue-600' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

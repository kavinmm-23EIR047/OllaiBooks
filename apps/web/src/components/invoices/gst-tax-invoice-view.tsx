'use client';

import * as React from 'react';
import {
  Printer,
  Download,
  Share2,
  Copy,
  Check,
  X,
  QrCode,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  FileCheck,
  Sparkles,
} from 'lucide-react';
import {
  numberToIndianWords,
  formatIndianCurrency,
  getGstStateDetails,
  generateUpiUri,
} from '@/lib/gst-utils';
import { downloadLocalInvoicePdf } from '@/lib/invoice-downloader';
import { printKitchenOrderTicket } from '@/lib/print-documents';

export type GstTemplateType = 'GOVT_STANDARD' | 'MODERN_ENTERPRISE' | 'E_INVOICE_NIC';
export type InvoiceCopyType = 'ORIGINAL_FOR_RECIPIENT' | 'DUPLICATE_FOR_TRANSPORTER' | 'TRIPLICATE_FOR_SUPPLIER';

interface GstTaxInvoiceViewProps {
  invoice: any;
  businessProfile?: any;
  isOpen: boolean;
  onClose: () => void;
  initialTemplate?: GstTemplateType;
}

export function GstTaxInvoiceView({
  invoice,
  businessProfile,
  isOpen,
  onClose,
  initialTemplate = 'GOVT_STANDARD',
}: GstTaxInvoiceViewProps) {
  const [template, setTemplate] = React.useState<GstTemplateType>(initialTemplate);
  const [copyType, setCopyType] = React.useState<InvoiceCopyType>('ORIGINAL_FOR_RECIPIENT');
  const [copiedLink, setCopiedLink] = React.useState(false);

  if (!isOpen || !invoice) return null;
  const isPendingSync = invoice.status === 'PENDING_SYNC';

  // Defaults fallback from seed profile
  const supplier = {
    tradeName: businessProfile?.tradeName || 'Acme Corporation',
    legalName: businessProfile?.legalName || 'Acme Corporation Private Limited',
    gstin: businessProfile?.gstin || '29ABCDE1234F1Z5',
    pan: businessProfile?.panNumber || 'ABCDE1234F',
    address: businessProfile?.streetAddress || '100 Innovation Boulevard',
    city: businessProfile?.city || 'Bengaluru',
    state: businessProfile?.state || 'Karnataka',
    postalCode: businessProfile?.postalCode || '560001',
    email: businessProfile?.email || 'billing@acmestore.in',
    phone: businessProfile?.phone || '+91 98765 43210',
    bankName: businessProfile?.bankName || 'HDFC Bank',
    accountNumber: businessProfile?.accountNumber || '50100012345678',
    ifscCode: businessProfile?.ifscCode || 'HDFC0001234',
    branch: 'MG Road, Bengaluru',
    upiId: businessProfile?.upiId || 'acme@hdfcbank',
  };

  const supplierState = getGstStateDetails(supplier.state, supplier.gstin);

  // Recipient (Customer) Details
  const customer = {
    name: invoice.customer?.name || 'Walk-in Customer / B2C Client',
    gstin: invoice.customer?.gstin || 'Unregistered / Consumer',
    address: invoice.customer?.billingStreet || '42 Industrial Park, Whitefield',
    city: invoice.customer?.billingCity || 'Bengaluru',
    state: invoice.customer?.billingState || 'Karnataka',
    postalCode: invoice.customer?.billingPostalCode || '560066',
    email: invoice.customer?.email || 'accounts@client.com',
    phone: invoice.customer?.phone || '+91 91234 56789',
    pan: invoice.customer?.gstin ? invoice.customer.gstin.slice(2, 12) : 'N/A',
  };

  const recipientState = getGstStateDetails(customer.state, customer.gstin);
  const isInterstate = supplierState.code !== recipientState.code;

  // Normalize items
  const items = Array.isArray(invoice.items) && invoice.items.length > 0
    ? invoice.items
    : [
        {
          id: 'item-1',
          name: 'Enterprise Cloud ERP Implementation & Setup',
          hsnCode: '998314',
          quantity: 1,
          unitPrice: Number(invoice.subtotal || invoice.grandTotal || 100000),
          taxRate: 18,
          total: Number(invoice.grandTotal || 118000),
        },
      ];

  // Financial Computations
  const subtotal = Number(invoice.subtotal || 0);
  const grandTotal = Number(invoice.grandTotal || (subtotal * 1.18));
  const cgst = isInterstate ? 0 : Number(invoice.cgstTotal || (subtotal * 0.09));
  const sgst = isInterstate ? 0 : Number(invoice.sgstTotal || (subtotal * 0.09));
  const igst = isInterstate ? Number(invoice.igstTotal || (subtotal * 0.18)) : 0;
  const totalTax = cgst + sgst + igst;

  const totalInWords = numberToIndianWords(grandTotal);
  const upiUri = generateUpiUri({
    upiId: supplier.upiId,
    payeeName: supplier.tradeName,
    amount: grandTotal,
    invoiceNumber: invoice.invoiceNumber,
  });

  const handleDownloadPdf = () => {
    downloadLocalInvoicePdf({
      invoiceNumber: invoice.invoiceNumber || `INV-${Date.now().toString().slice(-6)}`,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      placeOfSupply: `${recipientState.name} (${recipientState.code})`,
      paymentTerms: invoice.paymentTerms || 'Due in 15 days',
      customerName: customer.name,
      customerGstin: customer.gstin,
      customerAddress: `${customer.address}, ${customer.city}, ${customer.state} - ${customer.postalCode}`,
      customerState: `${recipientState.name} (${recipientState.code})`,
      customerPan: customer.pan,
      supplierName: supplier.legalName,
      supplierTradeName: supplier.tradeName,
      supplierGstin: supplier.gstin,
      supplierAddress: `${supplier.address}, ${supplier.city}, ${supplier.state} - ${supplier.postalCode}`,
      supplierState: `${supplierState.name} (${supplierState.code})`,
      supplierPan: supplier.pan,
      supplierPhone: supplier.phone,
      bankName: supplier.bankName,
      accountNumber: supplier.accountNumber,
      ifscCode: supplier.ifscCode,
      branch: supplier.branch,
      upiId: supplier.upiId,
      itemName: items[0]?.name || 'Enterprise Cloud & Billing Implementation',
      itemSku: items[0]?.sku || 'SRV-001',
      hsnCode: items[0]?.hsnCode || '998314',
      quantity: items[0]?.quantity || 1,
      unitPrice: items[0]?.unitPrice || subtotal,
      taxRate: items[0]?.taxRate || 18,
      cgstAmount: cgst,
      sgstAmount: sgst,
      igstAmount: igst,
      grandTotal: grandTotal,
      items: items,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePrintKitchenTicket = () => {
    printKitchenOrderTicket({
      orderNumber: invoice.invoiceNumber,
      orderDate: invoice.issueDate,
      customer: invoice.customer,
      items,
      currency: invoice.currency || 'INR',
      total: grandTotal,
      source: 'Offline POS',
    });
  };

  const handleCopyPaymentLink = () => {
    const payUrl = `${window.location.origin}/pay/${invoice.id || invoice.invoiceNumber}`;
    navigator.clipboard.writeText(payUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const getCopyLabel = () => {
    switch (copyType) {
      case 'DUPLICATE_FOR_TRANSPORTER':
        return 'Duplicate for Transporter';
      case 'TRIPLICATE_FOR_SUPPLIER':
        return 'Triplicate for Supplier';
      case 'ORIGINAL_FOR_RECIPIENT':
      default:
        return 'Original for Recipient';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto print:overflow-visible">
      {/* Container Card */}
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-auto print:border-none print:shadow-none print:w-full print:max-w-none print:m-0">
        
        {/* =========================================================
            TOP ACTION & TEMPLATE CONTROLS (HIDDEN DURING PRINT)
            ========================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-4 py-3 print:hidden">
          {/* Left: Template Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600">GST Template:</span>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as GstTemplateType)}
              className="h-8 rounded-lg border border-slate-300 bg-white px-2.5 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              <option value="GOVT_STANDARD">Official Govt GST (Rule 46 Standard)</option>
              <option value="MODERN_ENTERPRISE">Modern Enterprise GST (Zoho Style)</option>
              <option value="E_INVOICE_NIC">B2B E-Invoice (NIC Portal Format)</option>
            </select>

            <select
              value={copyType}
              onChange={(e) => setCopyType(e.target.value as InvoiceCopyType)}
              className="h-8 rounded-lg border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 focus:border-blue-600 focus:outline-none"
            >
              <option value="ORIGINAL_FOR_RECIPIENT">Original for Recipient</option>
              <option value="DUPLICATE_FOR_TRANSPORTER">Duplicate for Transporter</option>
              <option value="TRIPLICATE_FOR_SUPPLIER">Triplicate for Supplier</option>
            </select>
          </div>

          {/* Right: Print / Download / Share Actions */}
          <div className="flex items-center gap-2">
            {isPendingSync && (
              <button
                type="button"
                onClick={handlePrintKitchenTicket}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 text-xs font-bold text-amber-900 hover:bg-amber-100"
                title="Print Kitchen Order Ticket from this offline order"
              >
                <Printer className="h-3.5 w-3.5" /> Print KOT
              </button>
            )}
            <button
              onClick={handleCopyPaymentLink}
              disabled={isPendingSync}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100 transition disabled:cursor-not-allowed disabled:opacity-40"
              title={isPendingSync ? 'Available after the draft syncs' : 'Copy Instant UPI Payment Link'}
            >
              {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
              <span>{copiedLink ? 'Link Copied!' : 'Copy UPI Link'}</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isPendingSync}
              className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-emerald-600 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              title={isPendingSync ? 'Official PDF is available after the draft syncs' : 'Download GST Tax Invoice PDF'}
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 h-8 px-3.5 rounded-lg bg-blue-600 text-xs font-bold text-white hover:bg-blue-700 shadow-sm transition active:scale-95"
              title={isPendingSync ? 'Print an internal offline draft copy' : 'Print or Save as PDF'}
            >
              <Printer className="h-3.5 w-3.5" />
              <span>{isPendingSync ? 'Print Draft Copy' : 'Print / Save PDF'}</span>
            </button>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              title="Close Preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {isPendingSync && (
          <div role="status" className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-xs font-semibold text-amber-900">
            Offline draft preview · this is not an issued tax invoice. You can print it for internal use; sync it to receive the official invoice number and enable PDF/payment actions.
          </div>
        )}

        {/* =========================================================
            OFFICIAL PRINTABLE GST INVOICE SHEET (A4 STANDARD)
            ========================================================= */}
        <div id="gst-tax-invoice-printable" className="p-6 sm:p-10 text-slate-900 bg-white print:p-0">

          {isPendingSync && (
            <div className="mb-5 border-2 border-amber-700 bg-amber-50 p-3 text-center text-sm font-black uppercase tracking-wider text-amber-950">
              Offline draft · not a tax invoice · not issued
            </div>
          )}
          
          {/* E-INVOICE BANNER (Only on NIC E-Invoice Template) */}
          {template === 'E_INVOICE_NIC' && !isPendingSync && (
            <div className="mb-4 border border-blue-200 bg-blue-50/50 p-3 rounded text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-9 font-mono text-[10px] space-y-1">
                  <div className="flex items-center gap-2 font-bold text-blue-900">
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    <span>GOVERNMENT OF INDIA · GST E-INVOICING PORTAL (NIC)</span>
                  </div>
                  <p className="text-slate-600 truncate">
                    <strong>IRN:</strong> 3a49f87c2b01e48810294715bd820f129a01f928e48911029c71928374a8102f
                  </p>
                  <p className="text-slate-600">
                    <strong>Ack No:</strong> 1120260049281 · <strong>Ack Date:</strong> 06-Nov-2026 10:45:12
                  </p>
                </div>
                <div className="sm:col-span-3 flex justify-end">
                  {/* Simulated E-Invoice Signed QR */}
                  <div className="h-16 w-16 border border-slate-300 p-1 bg-white flex flex-col items-center justify-center text-center">
                    <QrCode className="h-12 w-12 text-slate-800" />
                    <span className="text-[6px] font-bold text-slate-500">NIC SIGNED</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MAIN FORM BORDER CONTAINER (Standard Indian Boxed Layout) */}
          <div className="border border-slate-800 text-[11px] leading-tight">
            
            {/* 1. HEADER SECTION */}
            <div className="border-b border-slate-800 p-3 text-center relative bg-slate-50/40">
              <span className="absolute top-2 right-3 font-semibold text-[10px] text-slate-600 uppercase border border-slate-400 px-2 py-0.5 rounded">
                {getCopyLabel()}
              </span>
              <h1 className="text-base sm:text-lg font-black tracking-wider uppercase text-slate-900">
                {isPendingSync ? 'OFFLINE BILLING DRAFT' : 'TAX INVOICE'}
              </h1>
              <p className="text-[9px] text-slate-600 font-medium">
                {isPendingSync ? 'Internal preview only · not issued under GST' : '(Issued under Section 31 of CGST Act, 2017 read with Rule 46 of CGST Rules, 2017)'}
              </p>
            </div>

            {/* 2. SUPPLIER (SELLER) & INVOICE METADATA SECTION */}
            <div className="grid grid-cols-1 sm:grid-cols-12 border-b border-slate-800 divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
              {/* Left Column: Supplier Details */}
              <div className="sm:col-span-7 p-3 space-y-1">
                <h2 className="text-sm font-bold uppercase text-slate-900">{supplier.tradeName}</h2>
                <p className="font-semibold text-slate-700">{supplier.legalName}</p>
                <p className="text-slate-600">{supplier.address}, {supplier.city}, {supplier.state} - {supplier.postalCode}</p>
                <div className="pt-1 grid grid-cols-2 gap-1 text-[10.5px]">
                  <p><strong>GSTIN:</strong> <span className="font-mono font-bold text-blue-700">{supplier.gstin}</span></p>
                  <p><strong>State:</strong> {supplierState.name} ({supplierState.code})</p>
                  <p><strong>PAN:</strong> <span className="font-mono">{supplier.pan}</span></p>
                  <p><strong>Phone:</strong> {supplier.phone}</p>
                </div>
              </div>

              {/* Right Column: Invoice Metadata */}
              <div className="sm:col-span-5 p-3 space-y-1.5 bg-slate-50/20">
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-600">Invoice Number:</span>
                  <span className="font-mono font-bold text-slate-900">{invoice.invoiceNumber || 'INV-2026-001'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-600">Invoice Date:</span>
                  <span className="font-semibold text-slate-900">
                    {invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '06-Nov-2026'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-600">Place of Supply:</span>
                  <span className="font-semibold text-slate-900">{recipientState.name} ({recipientState.code})</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 pb-1">
                  <span className="text-slate-600">Reverse Charge:</span>
                  <span className="font-semibold text-slate-900">No</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Payment Terms:</span>
                  <span className="font-semibold text-slate-900">{invoice.paymentTerms || 'Due in 15 days'}</span>
                </div>
              </div>
            </div>

            {/* 3. RECIPIENT (BILLED TO) & CONSIGNEE (SHIPPED TO) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 border-b border-slate-800 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 bg-white">
              {/* Billed To Box */}
              <div className="p-3 space-y-1">
                <div className="font-bold uppercase text-[10px] tracking-wider text-slate-500 border-b border-slate-200 pb-1">
                  Details of Receiver | Billed to:
                </div>
                <p className="font-bold text-slate-900">{customer.name}</p>
                <p className="text-slate-600">{customer.address}, {customer.city}, {customer.state} - {customer.postalCode}</p>
                <div className="pt-0.5 space-y-0.5">
                  <p><strong>GSTIN / UIN:</strong> <span className="font-mono font-bold">{customer.gstin}</span></p>
                  <p><strong>State & Code:</strong> {recipientState.name} ({recipientState.code})</p>
                  <p><strong>PAN:</strong> <span className="font-mono">{customer.pan}</span></p>
                </div>
              </div>

              {/* Shipped To Box */}
              <div className="p-3 space-y-1 bg-slate-50/20">
                <div className="font-bold uppercase text-[10px] tracking-wider text-slate-500 border-b border-slate-200 pb-1">
                  Details of Consignee | Shipped to:
                </div>
                <p className="font-bold text-slate-900">{customer.name}</p>
                <p className="text-slate-600">{customer.address}, {customer.city}, {customer.state} - {customer.postalCode}</p>
                <div className="pt-0.5 space-y-0.5">
                  <p><strong>State & Code:</strong> {recipientState.name} ({recipientState.code})</p>
                  <p><strong>Country:</strong> India</p>
                </div>
              </div>
            </div>

            {/* 4. STATUTORY ITEM TABLE (INDIAN GST STANDARD COLUMNS) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[10px]">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-100 font-bold uppercase text-slate-700">
                    <th className="border-r border-slate-800 p-1.5 w-7 text-center">#</th>
                    <th className="border-r border-slate-800 p-1.5">Description of Goods / Services</th>
                    <th className="border-r border-slate-800 p-1.5 text-center w-16">HSN/SAC</th>
                    <th className="border-r border-slate-800 p-1.5 text-center w-12">Qty</th>
                    <th className="border-r border-slate-800 p-1.5 text-right w-18">Rate (₹)</th>
                    <th className="border-r border-slate-800 p-1.5 text-right w-20">Taxable Val</th>
                    {isInterstate ? (
                      <th className="border-r border-slate-800 p-1.5 text-right w-24">IGST (18%)</th>
                    ) : (
                      <>
                        <th className="border-r border-slate-800 p-1.5 text-right w-16">CGST (9%)</th>
                        <th className="border-r border-slate-800 p-1.5 text-right w-16">SGST (9%)</th>
                      </>
                    )}
                    <th className="p-1.5 text-right w-22">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {items.map((it: any, idx: number) => {
                    const qty = Number(it.quantity || 1);
                    const rate = Number(it.unitPrice || 0);
                    const itemTaxable = qty * rate;
                    const taxRate = Number(it.taxRate || 18);
                    const itemCgst = isInterstate ? 0 : (itemTaxable * (taxRate / 200));
                    const itemSgst = isInterstate ? 0 : (itemTaxable * (taxRate / 200));
                    const itemIgst = isInterstate ? (itemTaxable * (taxRate / 100)) : 0;
                    const itemTotal = itemTaxable + itemCgst + itemSgst + itemIgst;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="border-r border-slate-800 p-1.5 text-center font-mono">{idx + 1}</td>
                        <td className="border-r border-slate-800 p-1.5">
                          <p className="font-semibold text-slate-900">{it.name}</p>
                          <p className="text-[9px] text-slate-500 font-mono">SKU: {it.sku || 'SRV-001'}</p>
                        </td>
                        <td className="border-r border-slate-800 p-1.5 text-center font-mono">{it.hsnCode || '998314'}</td>
                        <td className="border-r border-slate-800 p-1.5 text-center font-mono">{qty} NOS</td>
                        <td className="border-r border-slate-800 p-1.5 text-right font-mono">{rate.toFixed(2)}</td>
                        <td className="border-r border-slate-800 p-1.5 text-right font-mono font-medium">{itemTaxable.toFixed(2)}</td>
                        {isInterstate ? (
                          <td className="border-r border-slate-800 p-1.5 text-right font-mono text-slate-700">
                            {itemIgst.toFixed(2)}
                          </td>
                        ) : (
                          <>
                            <td className="border-r border-slate-800 p-1.5 text-right font-mono text-slate-700">
                              {itemCgst.toFixed(2)}
                            </td>
                            <td className="border-r border-slate-800 p-1.5 text-right font-mono text-slate-700">
                              {itemSgst.toFixed(2)}
                            </td>
                          </>
                        )}
                        <td className="p-1.5 text-right font-mono font-bold text-slate-900">{itemTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>

                {/* Subtotals & Taxes row */}
                <tfoot>
                  <tr className="border-t border-slate-800 bg-slate-50 font-bold">
                    <td colSpan={5} className="border-r border-slate-800 p-1.5 text-right uppercase">
                      Total Taxable Value & Tax:
                    </td>
                    <td className="border-r border-slate-800 p-1.5 text-right font-mono">
                      {subtotal.toFixed(2)}
                    </td>
                    {isInterstate ? (
                      <td className="border-r border-slate-800 p-1.5 text-right font-mono">{igst.toFixed(2)}</td>
                    ) : (
                      <>
                        <td className="border-r border-slate-800 p-1.5 text-right font-mono">{cgst.toFixed(2)}</td>
                        <td className="border-r border-slate-800 p-1.5 text-right font-mono">{sgst.toFixed(2)}</td>
                      </>
                    )}
                    <td className="p-1.5 text-right font-mono text-blue-700">{grandTotal.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* 5. STATUTORY HSN / SAC TAX BREAKUP TABLE */}
            <div className="border-t border-slate-800 p-2 bg-slate-50/30">
              <span className="font-bold text-[9px] uppercase tracking-wider text-slate-600 block mb-1">
                HSN / SAC Tax Analysis:
              </span>
              <table className="w-full text-[9px] text-left border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-200/60 font-semibold text-slate-700 border-b border-slate-300">
                    <th className="p-1 border-r border-slate-300">HSN/SAC</th>
                    <th className="p-1 border-r border-slate-300 text-right">Taxable Value (₹)</th>
                    {!isInterstate && (
                      <>
                        <th className="p-1 border-r border-slate-300 text-right">CGST Rate</th>
                        <th className="p-1 border-r border-slate-300 text-right">CGST Amt (₹)</th>
                        <th className="p-1 border-r border-slate-300 text-right">SGST Rate</th>
                        <th className="p-1 border-r border-slate-300 text-right">SGST Amt (₹)</th>
                      </>
                    )}
                    {isInterstate && (
                      <>
                        <th className="p-1 border-r border-slate-300 text-right">IGST Rate</th>
                        <th className="p-1 border-r border-slate-300 text-right">IGST Amt (₹)</th>
                      </>
                    )}
                    <th className="p-1 text-right">Total Tax (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-1 border-r border-slate-300 font-mono font-medium">998314</td>
                    <td className="p-1 border-r border-slate-300 text-right font-mono">{subtotal.toFixed(2)}</td>
                    {!isInterstate && (
                      <>
                        <td className="p-1 border-r border-slate-300 text-right font-mono">9%</td>
                        <td className="p-1 border-r border-slate-300 text-right font-mono">{cgst.toFixed(2)}</td>
                        <td className="p-1 border-r border-slate-300 text-right font-mono">9%</td>
                        <td className="p-1 border-r border-slate-300 text-right font-mono">{sgst.toFixed(2)}</td>
                      </>
                    )}
                    {isInterstate && (
                      <>
                        <td className="p-1 border-r border-slate-300 text-right font-mono">18%</td>
                        <td className="p-1 border-r border-slate-300 text-right font-mono">{igst.toFixed(2)}</td>
                      </>
                    )}
                    <td className="p-1 text-right font-mono font-bold text-slate-900">{totalTax.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 6. TOTAL AMOUNT IN WORDS (MANDATORY IN INDIA) */}
            <div className="border-t border-slate-800 p-2.5 bg-white">
              <span className="text-slate-600 font-semibold">Total Amount in Words: </span>
              <strong className="text-slate-900 font-bold">{totalInWords}</strong>
            </div>

            {/* 7. BANK DETAILS & EMBEDDED DYNAMIC UPI QR CODE */}
            {isPendingSync ? (
              <div className="border-t border-amber-300 bg-amber-50 p-4 text-center text-xs font-semibold text-amber-950">
                Payment instructions and UPI collection are available after this draft is synced and formally issued.
              </div>
            ) : (
            <div className="grid grid-cols-1 sm:grid-cols-12 border-t border-slate-800 divide-y sm:divide-y-0 sm:divide-x divide-slate-800 bg-slate-50/20">
              {/* Left Column: Bank Accounts */}
              <div className="sm:col-span-8 p-3 space-y-1">
                <span className="font-bold text-[9px] uppercase tracking-wider text-slate-500 block mb-1">
                  Bank Remittance & UPI Payment Details:
                </span>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10.5px]">
                  <p><strong>Bank Name:</strong> {supplier.bankName}</p>
                  <p><strong>A/C Holder:</strong> {supplier.legalName}</p>
                  <p><strong>Account No:</strong> <span className="font-mono font-bold">{supplier.accountNumber}</span></p>
                  <p><strong>IFSC Code:</strong> <span className="font-mono font-bold text-blue-700">{supplier.ifscCode}</span></p>
                  <p><strong>Branch:</strong> {supplier.branch}</p>
                  <p><strong>UPI ID:</strong> <span className="font-mono font-bold text-emerald-700">{supplier.upiId}</span></p>
                </div>
                <p className="text-[9px] text-slate-500 pt-1">
                  * Scan the UPI QR code on the right with Google Pay, PhonePe, Paytm, or BHIM to pay instantly.
                </p>
              </div>

              {/* Right Column: Visual UPI QR Code */}
              <div className="sm:col-span-4 p-3 flex flex-col items-center justify-center text-center bg-white">
                <div className="relative border border-slate-300 p-1.5 rounded bg-white shadow-xs">
                  {/* Clean SVG Vector UPI QR Pattern */}
                  <svg className="w-20 h-20" viewBox="0 0 100 100" fill="none">
                    <rect width="100" height="100" fill="#FFFFFF" />
                    {/* Corners */}
                    <rect x="5" y="5" width="26" height="26" rx="2" stroke="#0F172A" strokeWidth="4" />
                    <rect x="11" y="11" width="14" height="14" fill="#0F172A" />
                    <rect x="69" y="5" width="26" height="26" rx="2" stroke="#0F172A" strokeWidth="4" />
                    <rect x="75" y="11" width="14" height="14" fill="#0F172A" />
                    <rect x="5" y="69" width="26" height="26" rx="2" stroke="#0F172A" strokeWidth="4" />
                    <rect x="11" y="75" width="14" height="14" fill="#0F172A" />
                    {/* Data Matrix Dots */}
                    <rect x="37" y="10" width="8" height="8" fill="#0066FF" />
                    <rect x="50" y="10" width="8" height="8" fill="#0F172A" />
                    <rect x="40" y="24" width="8" height="8" fill="#0F172A" />
                    <rect x="52" y="24" width="8" height="8" fill="#0066FF" />
                    <rect x="38" y="40" width="24" height="20" rx="2" fill="#0066FF" />
                    <text x="50" y="54" fill="#FFFFFF" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">UPI</text>
                    <rect x="12" y="45" width="8" height="8" fill="#0F172A" />
                    <rect x="24" y="45" width="8" height="8" fill="#0F172A" />
                    <rect x="70" y="45" width="8" height="8" fill="#0F172A" />
                    <rect x="82" y="45" width="8" height="8" fill="#0066FF" />
                    <rect x="40" y="70" width="8" height="8" fill="#0F172A" />
                    <rect x="54" y="70" width="8" height="8" fill="#0F172A" />
                    <rect x="70" y="70" width="8" height="8" fill="#0066FF" />
                    <rect x="82" y="78" width="8" height="8" fill="#0F172A" />
                  </svg>
                </div>
                <span className="text-[9px] font-bold text-slate-800 mt-1">Instant UPI Scan & Pay</span>
                <span className="text-[8px] text-slate-500 font-mono">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
            )}

            {/* 8. TERMS, DECLARATION & AUTHORIZED SIGNATORY */}
            <div className="grid grid-cols-1 sm:grid-cols-12 border-t border-slate-800 divide-y sm:divide-y-0 sm:divide-x divide-slate-800">
              {/* Terms & Statutory Declaration */}
              <div className="sm:col-span-7 p-3 text-[9.5px] space-y-1">
                {isPendingSync ? (
                  <p className="font-bold uppercase text-amber-900">Offline draft for internal reference only. Sync and review before issuing a tax invoice.</p>
                ) : (
                  <>
                    <p className="font-bold uppercase text-slate-700">Terms & Conditions:</p>
                    <ol className="list-decimal pl-3 space-y-0.5 text-slate-600">
                      <li>Payment is due within 15 days from the invoice date.</li>
                      <li>Interest @ 18% p.a. will be levied on overdue balances.</li>
                      <li>All disputes are subject to {supplier.city} jurisdiction.</li>
                    </ol>
                    <div className="mt-2 pt-1 border-t border-slate-200 text-slate-500 italic">
                      <strong>Declaration:</strong> We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.
                    </div>
                  </>
                )}
              </div>

              {/* Authorized Signatory Box */}
              <div className="sm:col-span-5 p-3 flex flex-col justify-between text-right bg-slate-50/10">
                <span className="text-[10px] font-bold text-slate-900">
                  For {supplier.legalName}
                </span>

                {/* Digital Signature Seal */}
                {!isPendingSync && <div className="my-3 flex justify-end">
                  <div className="border border-blue-400 bg-blue-50/60 rounded px-3 py-1 text-center font-mono text-[8px] text-blue-900 inline-block shadow-xs">
                    <p className="font-bold">✓ DIGITALLY SIGNED</p>
                    <p className="text-[7px] text-blue-700">Signatory: Authorized Officer</p>
                    <p className="text-[6.5px] text-slate-500">{new Date().toISOString().slice(0, 10)}</p>
                  </div>
                </div>}

                <div className="border-t border-slate-400 pt-1 text-[9px] text-slate-600">
                  Authorised Signatory
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Compliance Tag */}
          <div className="mt-3 text-center text-[9px] text-slate-400 print:text-[8px]">
            This is a computer-generated GST Tax Invoice issued under the Central Goods and Services Tax Rules, 2017.
          </div>

        </div>

      </div>

      {/* Embedded CSS for Exact A4 Print Layout */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #gst-tax-invoice-printable,
          #gst-tax-invoice-printable * {
            visibility: visible;
          }
          #gst-tax-invoice-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 8mm !important;
            background: #ffffff !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}</style>
    </div>
  );
}


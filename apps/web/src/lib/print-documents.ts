import { detectGstState, numberToIndianWords } from './gst-utils';

/**
 * ollaiBooks print engine — Indian GST invoices (Rule 46, CGST Rules 2017),
 * thermal receipts and kitchen order tickets (KOT). Works fully offline:
 * every document is a self-contained HTML page with inline CSS.
 */

export type InvoiceTemplateId = 'thermal' | 'classic-gst' | 'modern-gst';
export type ThermalPaperWidth = '80mm' | '58mm';
export type GstRegistrationType = 'regular' | 'composition' | 'unregistered';

export interface PrintableShop {
  name: string;
  phone: string;
  address: string;
  gstin?: string;
  state?: string;
  businessType?: string;
  /** data:image/... URL (PNG/JPEG/WebP/SVG), resized on upload */
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
}

export interface PrintableSale {
  id: string;
  number: string;
  date: string;
  customer: string;
  phone?: string;
  customerGstin?: string;
  customerAddress?: string;
  items: Array<{ productId?: string; name: string; quantity: number; price: number; hsn?: string; unit?: string; note?: string }>;
  subtotal: number;
  discount: number;
  taxRate: number;
  gst: number;
  total: number;
  paid: number;
  method: string;
  note?: string;
  pickup?: string;
  orderType?: string;
  tableNumber?: string;
  placeOfSupply?: string;
  isInterstate?: boolean;
  sync?: 'pending' | 'synced';
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function escapeHtml(value: unknown) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character]!));
}

function formatInr(amount: number) {
  return `₹${Number(amount || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function num(amount: number) {
  return Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

function formatRate(rate: number) {
  return `${Number(rate.toFixed(2))}%`;
}

function safeLogo(logo?: string) {
  if (!logo || typeof logo !== 'string') return '';
  return /^data:image\/(png|jpe?g|webp|gif|svg\+xml);base64,[a-z0-9+/=]+$/i.test(logo) ? logo : '';
}

function safeColor(color?: string) {
  return color && /^#[0-9a-f]{6}$/i.test(color) ? color : '#1d4ed8';
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(date: string) {
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function resolveSupplierState(shop: PrintableShop) {
  return (shop.state ? detectGstState(shop.state) : null) || detectGstState(shop.gstin) || detectGstState(shop.address);
}

function resolvePlaceOfSupply(sale: PrintableSale, shop: PrintableShop): string {
  if (sale.placeOfSupply) {
    const detected = detectGstState(sale.placeOfSupply);
    return detected ? `${detected.name} (${detected.code})` : sale.placeOfSupply;
  }
  if (sale.customerGstin) {
    const fromGstin = detectGstState(sale.customerGstin);
    if (fromGstin) return `${fromGstin.name} (${fromGstin.code})`;
  }
  const shopDetected = resolveSupplierState(shop);
  return shopDetected ? `${shopDetected.name} (${shopDetected.code})` : 'Local counter sale';
}

/** What document title the law expects for this seller + sale. */
function documentKind(sale: PrintableSale, shop: PrintableShop) {
  if (shop.gstRegistration === 'composition') {
    return {
      title: 'BILL OF SUPPLY',
      taxable: false,
      declaration: 'Composition taxable person, not eligible to collect tax on supplies.',
    };
  }
  if (!shop.gstin || shop.gstRegistration === 'unregistered' || sale.taxRate <= 0) {
    return {
      title: shop.gstin ? 'BILL OF SUPPLY' : 'CASH MEMO',
      taxable: false,
      declaration: shop.gstin ? 'Supply exempt from / not liable to GST.' : 'Seller is not registered under GST.',
    };
  }
  return {
    title: 'TAX INVOICE',
    taxable: true,
    declaration: 'We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct.',
  };
}

/* ------------------------------------------------------------------ */
/* GST computation — line level, discount pro-rated, rounding reconciled */
/* ------------------------------------------------------------------ */

export interface GstLine {
  index: number;
  name: string;
  hsn: string;
  unit: string;
  note?: string;
  quantity: number;
  rate: number;
  gross: number;
  discount: number;
  taxable: number;
  taxRate: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface GstBreakup {
  lines: GstLine[];
  hsnSummary: Array<{ hsn: string; taxRate: number; taxable: number; cgst: number; sgst: number; igst: number; tax: number }>;
  rateSummary: Array<{ taxRate: number; taxable: number; cgst: number; sgst: number; igst: number }>;
  totals: { gross: number; discount: number; taxable: number; cgst: number; sgst: number; igst: number; tax: number };
}

export function computeGstBreakup(sale: PrintableSale): GstBreakup {
  const items = Array.isArray(sale.items) ? sale.items : [];
  const gross = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
  const discount = Math.min(gross, Math.max(0, Number(sale.discount || 0)));
  const taxRate = Math.max(0, Number(sale.taxRate || 0));
  const interstate = Boolean(sale.isInterstate);

  let discountLeft = round2(discount);
  let taxLeft = round2(Number(sale.gst || 0));
  let cgstLeft = round2(Number(sale.gst || 0) / 2);

  const lines: GstLine[] = items.map((item, idx) => {
    const isLast = idx === items.length - 1;
    const lineGross = round2(Number(item.price || 0) * Number(item.quantity || 0));
    const lineDiscount = isLast ? discountLeft : round2(gross ? (discount * lineGross) / gross : 0);
    discountLeft = round2(discountLeft - lineDiscount);
    const taxable = round2(lineGross - lineDiscount);
    const tax = isLast ? taxLeft : round2((taxable * taxRate) / 100);
    taxLeft = round2(taxLeft - tax);
    const cgst = interstate ? 0 : (isLast ? cgstLeft : round2(tax / 2));
    cgstLeft = round2(cgstLeft - cgst);
    const sgst = interstate ? 0 : round2(tax - cgst);
    const igst = interstate ? tax : 0;
    return {
      index: idx + 1,
      name: item.name,
      hsn: item.hsn || '',
      unit: item.unit || 'Nos',
      note: item.note,
      quantity: Number(item.quantity || 0),
      rate: Number(item.price || 0),
      gross: lineGross,
      discount: lineDiscount,
      taxable,
      taxRate,
      cgst,
      sgst,
      igst,
      total: round2(taxable + tax),
    };
  });

  const hsnMap = new Map<string, GstBreakup['hsnSummary'][number]>();
  const rateMap = new Map<number, GstBreakup['rateSummary'][number]>();
  lines.forEach((line) => {
    const key = `${line.hsn || '—'}|${line.taxRate}`;
    const h = hsnMap.get(key) || { hsn: line.hsn || '—', taxRate: line.taxRate, taxable: 0, cgst: 0, sgst: 0, igst: 0, tax: 0 };
    h.taxable = round2(h.taxable + line.taxable);
    h.cgst = round2(h.cgst + line.cgst);
    h.sgst = round2(h.sgst + line.sgst);
    h.igst = round2(h.igst + line.igst);
    h.tax = round2(h.cgst + h.sgst + h.igst);
    hsnMap.set(key, h);
    const r = rateMap.get(line.taxRate) || { taxRate: line.taxRate, taxable: 0, cgst: 0, sgst: 0, igst: 0 };
    r.taxable = round2(r.taxable + line.taxable);
    r.cgst = round2(r.cgst + line.cgst);
    r.sgst = round2(r.sgst + line.sgst);
    r.igst = round2(r.igst + line.igst);
    rateMap.set(line.taxRate, r);
  });

  const sum = (key: keyof GstLine) => round2(lines.reduce((s, l) => s + Number(l[key] || 0), 0));
  const cgst = sum('cgst');
  const sgst = sum('sgst');
  const igst = sum('igst');
  return {
    lines,
    hsnSummary: Array.from(hsnMap.values()),
    rateSummary: Array.from(rateMap.values()),
    totals: { gross: round2(gross), discount: round2(discount), taxable: sum('taxable'), cgst, sgst, igst, tax: round2(cgst + sgst + igst) },
  };
}

/* ------------------------------------------------------------------ */
/* Shared fragments                                                    */
/* ------------------------------------------------------------------ */

const AUTO_PRINT_SCRIPT = '<script>window.onload=()=>{window.focus();setTimeout(()=>window.print(),150)};window.onafterprint=()=>window.close()</script>';

function wrapDocument(title: string, css: string, body: string, autoPrint: boolean) {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>${css}</style></head><body>${body}${autoPrint ? AUTO_PRINT_SCRIPT : ''}</body></html>`;
}

function openPrintPopup(html: string, width = 420, height = 720) {
  const printWindow = window.open('', '_blank', `width=${width},height=${height}`);
  if (!printWindow) {
    throw new Error('Your browser blocked the print window. Allow pop-ups for ollaiBooks and try again.');
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function supplierStateLine(shop: PrintableShop) {
  const st = resolveSupplierState(shop);
  return st ? `${st.name} · State Code ${st.code}` : '';
}

/* ------------------------------------------------------------------ */
/* KOT — Kitchen Order Ticket                                          */
/* ------------------------------------------------------------------ */

function kotNumberFrom(orderNumber: string) {
  const digits = String(orderNumber).replace(/\D/g, '');
  return digits.slice(-3) || '001';
}

function buildKotSectionHtml(order: any, shopName?: string) {
  const orderNumber = order.orderNumber || order.number || 'Offline order';
  const kotNo = kotNumberFrom(orderNumber);
  const when = order.orderDate || order.date || new Date().toISOString();
  const customerName = typeof order.customer === 'string' ? order.customer : (order.customer?.name || 'Walk-in');
  const sourceLabel = order.website?.name || order.orderType || order.source || 'Counter';
  const items = Array.isArray(order.items) ? order.items : [];
  const totalQty = items.reduce((s: number, i: any) => s + Number(i.quantity || 0), 0);

  const rows = items.map((item: any) => {
    const subParts = [
      item.note ? `Note: ${escapeHtml(item.note)}` : '',
      item.sku ? `SKU: ${escapeHtml(item.sku)}` : '',
    ].filter(Boolean);
    return `
      <tr>
        <td>
          <div class="item-name">${escapeHtml(item.name)}</div>
          ${subParts.length ? `<div class="item-sub">${subParts.join(' · ')}</div>` : ''}
        </td>
        <td class="right"><b>${escapeHtml(item.quantity)} ×</b></td>
      </tr>
    `;
  }).join('');

  return `
    <div class="receipt">
      <header>
        <h1>${escapeHtml(shopName || 'KITCHEN ORDER')}</h1>
        <div class="doc-title">KOT · #${escapeHtml(kotNo)}</div>
      </header>
      <div class="meta">
        <div><span>KOT No</span><b>#${escapeHtml(kotNo)}</b></div>
        <div><span>Bill Ref</span><b>${escapeHtml(orderNumber)}</b></div>
        <div><span>Date</span><span>${escapeHtml(formatDate(when))} ${escapeHtml(formatTime(when))}</span></div>
        <div><span>Customer</span><span>${escapeHtml(customerName)}</span></div>
        <div><span>Order</span><span>${escapeHtml(sourceLabel)}${order.tableNumber ? ` · Table ${escapeHtml(order.tableNumber)}` : ''}</span></div>
      </div>
      <table class="items">
        <thead><tr><th>Item</th><th class="right">Qty</th></tr></thead>
        <tbody>${rows || '<tr><td colspan="2">No items listed.</td></tr>'}</tbody>
      </table>
      <div class="totals">
        <div class="grand"><span>TOTAL QTY</span><span>${escapeHtml(totalQty)} (${items.length} item${items.length === 1 ? '' : 's'})</span></div>
      </div>
      ${order.note ? `<div class="words">Note: ${escapeHtml(order.note)}</div>` : ''}
      ${order.pickup ? `<div class="words">Pickup / Due: ${escapeHtml(order.pickup)}</div>` : ''}
      <div class="decl">Kitchen / Counter Copy · Not a Tax Invoice</div>
      <footer>
        <p class="thanks">Prepare order promptly</p>
        <p class="tiny">E. &amp; O.E. · Billed with ollaiBooks</p>
      </footer>
    </div>
  `;
}

/* ------------------------------------------------------------------ */
/* Thermal receipt (58mm / 80mm)                                       */
/* ------------------------------------------------------------------ */

function buildThermalReceiptBodyHtml(sale: PrintableSale, shop: PrintableShop) {
  const kind = documentKind(sale, shop);
  const breakup = computeGstBreakup(sale);
  const placeOfSupply = resolvePlaceOfSupply(sale, shop);
  const logo = safeLogo(shop.logo);
  const stateLine = supplierStateLine(shop);

  const rows = breakup.lines.map((line) => `
    <tr>
      <td>
        <div class="item-name">${escapeHtml(line.name)}</div>
        <div class="item-sub">${escapeHtml(line.quantity)} ${escapeHtml(line.unit)} × ${num(line.rate)}${line.hsn ? ` · HSN ${escapeHtml(line.hsn)}` : ''}</div>
      </td>
      <td class="right">${num(line.gross)}</td>
    </tr>
  `).join('');

  const taxTable = kind.taxable && breakup.totals.tax > 0 ? `
    <table class="tax-mini">
      <thead><tr><th>GST%</th><th class="right">Taxable</th>${sale.isInterstate ? '<th class="right">IGST</th>' : '<th class="right">CGST</th><th class="right">SGST</th>'}</tr></thead>
      <tbody>${breakup.rateSummary.map((r) => `<tr><td>${formatRate(r.taxRate)}</td><td class="right">${num(r.taxable)}</td>${sale.isInterstate ? `<td class="right">${num(r.igst)}</td>` : `<td class="right">${num(r.cgst)}</td><td class="right">${num(r.sgst)}</td>`}</tr>`).join('')}</tbody>
    </table>` : '';

  const halfRate = formatRate(sale.taxRate / 2);

  return `
    <div class="receipt">
      <header>
        ${logo ? `<img class="logo" src="${logo}" alt="">` : ''}
        <h1>${escapeHtml(shop.name)}</h1>
        ${shop.address ? `<p>${escapeHtml(shop.address)}</p>` : ''}
        ${shop.phone ? `<p>Ph: ${escapeHtml(shop.phone)}</p>` : ''}
        ${shop.gstin ? `<p class="strong">GSTIN: ${escapeHtml(shop.gstin)}</p>` : ''}
        ${stateLine ? `<p>${escapeHtml(stateLine)}</p>` : ''}
        ${shop.fssai ? `<p>FSSAI: ${escapeHtml(shop.fssai)}</p>` : ''}
        <div class="doc-title">${kind.title}</div>
      </header>
      <div class="meta">
        <div><span>Bill No</span><b>${escapeHtml(sale.number)}</b></div>
        <div><span>Date</span><span>${escapeHtml(formatDate(sale.date))} ${escapeHtml(formatTime(sale.date))}</span></div>
        <div><span>Customer</span><span>${escapeHtml(sale.customer)}</span></div>
        ${sale.phone ? `<div><span>Mobile</span><span>${escapeHtml(sale.phone)}</span></div>` : ''}
        ${sale.customerGstin ? `<div><span>Cust. GSTIN</span><span>${escapeHtml(sale.customerGstin)}</span></div>` : ''}
        ${kind.taxable ? `<div><span>Place of Supply</span><span>${escapeHtml(placeOfSupply)}</span></div>` : ''}
        ${sale.orderType ? `<div><span>Order</span><span>${escapeHtml(sale.orderType)}${sale.tableNumber ? ` · Table ${escapeHtml(sale.tableNumber)}` : ''}</span></div>` : ''}
      </div>
      <table class="items">
        <thead><tr><th>Item</th><th class="right">Amount</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="totals">
        <div><span>Subtotal</span><span>${num(sale.subtotal)}</span></div>
        ${sale.discount ? `<div><span>Discount</span><span>−${num(sale.discount)}</span></div>` : ''}
        ${kind.taxable && sale.taxRate > 0 ? (sale.isInterstate
          ? `<div><span>IGST @ ${formatRate(sale.taxRate)}</span><span>${num(breakup.totals.igst)}</span></div>`
          : `<div><span>CGST @ ${halfRate}</span><span>${num(breakup.totals.cgst)}</span></div><div><span>SGST @ ${halfRate}</span><span>${num(breakup.totals.sgst)}</span></div>`) : ''}
        <div class="grand"><span>TOTAL</span><span>${formatInr(sale.total)}</span></div>
        <div><span>Paid via</span><b>${escapeHtml(sale.method)}</b></div>
      </div>
      ${taxTable}
      <p class="words">${escapeHtml(numberToIndianWords(sale.total))}</p>
      ${kind.taxable ? '' : `<p class="small center">${escapeHtml(kind.declaration)}</p>`}
      ${sale.pickup ? `<p class="small">Pickup: ${escapeHtml(sale.pickup)}</p>` : ''}
      ${sale.note ? `<p class="small">Note: ${escapeHtml(sale.note)}</p>` : ''}
      ${shop.upiId ? `<p class="small center">UPI: <b>${escapeHtml(shop.upiId)}</b></p>` : ''}
      <footer>
        <p class="thanks">${escapeHtml(shop.footerNote || 'Thank you! Please visit again.')}</p>
        <p class="small">E. &amp; O.E. · Billed with ollaiBooks</p>
      </footer>
    </div>
  `;
}

function getThermalBaseCss(paperWidth: ThermalPaperWidth) {
  const maxWidth = paperWidth === '58mm' ? '50mm' : '72mm';
  const fontSize = paperWidth === '58mm' ? '11px' : '12.5px';
  return `
    @page{size:${paperWidth} auto;margin:2.5mm}
    *{box-sizing:border-box}
    body{font:${fontSize}/1.38 'Courier New',ui-monospace,Menlo,Consolas,monospace;color:#000;margin:0 auto;max-width:${maxWidth};background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
    b,.strong{font-weight:700}
    p{margin:1px 0}
    .right{text-align:right;white-space:nowrap}.center{text-align:center}
    .small{font-size:.82em;color:#222}
    header{text-align:center;padding:2px 0 8px;border-bottom:1px dashed #000}
    header .logo{max-width:60%;max-height:52px;object-fit:contain;filter:grayscale(1) contrast(1.4);margin:0 auto 4px;display:block}
    header h1{font-size:1.35em;margin:0 0 2px;text-transform:uppercase;letter-spacing:.5px;font-family:Arial,Helvetica,sans-serif;font-weight:800}
    header p{font-size:.88em}
    .doc-title{margin-top:6px;display:inline-block;border:1.5px solid #000;padding:2px 10px;font-weight:700;letter-spacing:1.5px;font-family:Arial,Helvetica,sans-serif;font-size:.9em}
    .meta{padding:6px 0;border-bottom:1px dashed #000}
    .meta div{display:flex;justify-content:space-between;gap:6px}
    .meta div span:first-child{color:#333}
    table{width:100%;border-collapse:collapse}
    .items{margin:4px 0}
    .items th{text-align:left;border-bottom:1px solid #000;padding:4px 0;font-size:.85em}
    .items td{padding:4px 0;border-bottom:1px dotted #777;vertical-align:top}
    .item-name{font-weight:700;font-family:Arial,Helvetica,sans-serif}
    .item-sub{font-size:.82em;color:#333}
    .totals{border-top:1px dashed #000;padding-top:4px}
    .totals div{display:flex;justify-content:space-between;margin:1px 0}
    .totals .grand{font-weight:800;font-size:1.3em;border-top:2px solid #000;border-bottom:2px solid #000;padding:5px 0;margin:5px 0;font-family:Arial,Helvetica,sans-serif}
    .tax-mini{margin:6px 0;font-size:.82em;border:1px dashed #000}
    .tax-mini th,.tax-mini td{padding:2px 3px}
    .tax-mini th{border-bottom:1px dashed #000;text-align:left}
    .words{font-size:.82em;font-style:italic;margin:6px 0;border-bottom:1px dashed #000;padding-bottom:6px}
    footer{text-align:center;margin-top:8px;padding-top:6px;border-top:1px dashed #000}
    .thanks{font-weight:700;font-family:Arial,Helvetica,sans-serif}
    .page-break{page-break-after:always;break-after:page;margin-bottom:14px;padding-bottom:10px;border-bottom:2px dashed #999}
    /* KOT */
    .kot{font-family:Arial,Helvetica,sans-serif}
    .kot-head{text-align:center;border-bottom:2px solid #000;padding-bottom:5px}
    .kot-shop{font-size:.9em;font-weight:700;text-transform:uppercase}
    .kot-title{font-size:1.15em;font-weight:900;letter-spacing:1.5px}
    .kot-token{display:flex;gap:6px;margin:6px 0}
    .kot-token div{flex:1;border:2px solid #000;text-align:center;padding:3px 0}
    .kot-token span{display:block;font-size:.72em;letter-spacing:1px}
    .kot-token b{font-size:1.9em;line-height:1.05}
    .kot-token b.sm{font-size:1.05em;line-height:1.9}
    .kot-meta{border-bottom:1px dashed #000;padding-bottom:5px}
    .kot-meta div{display:flex;justify-content:space-between;gap:6px;font-size:.9em}
    .kot-items{margin:5px 0}
    .kot-items th{text-align:left;font-size:.75em;border-bottom:1px solid #000;padding:3px 0}
    .kot-items td{padding:5px 0;border-bottom:1px dotted #555;vertical-align:top}
    .kq{width:38px;font-size:1.5em;font-weight:900}
    .kn{font-size:1.15em;font-weight:700}
    .kn small{display:block;font-size:.72em;font-weight:400}
    .kot-count{text-align:right;font-weight:700;font-size:.9em}
    .kot-note{margin-top:6px;border:1.5px solid #000;padding:5px;font-size:.95em}
    .kot-note b{display:block;font-size:.72em;letter-spacing:1px}
    .kot-foot{margin-top:8px;text-align:center;font-size:.75em;border-top:1px dashed #000;padding-top:4px}
    @media screen{body{padding:10px 0}}
  `;
}

/* ------------------------------------------------------------------ */
/* A4 GST invoices                                                     */
/* ------------------------------------------------------------------ */

function buildA4ItemTable(sale: PrintableSale, breakup: GstBreakup, taxable: boolean) {
  const inter = Boolean(sale.isInterstate);
  const showDiscount = breakup.totals.discount > 0;
  const head = `
    <tr>
      <th rowspan="${taxable ? 2 : 1}" class="c" style="width:28px">Sr</th>
      <th rowspan="${taxable ? 2 : 1}">Description of Goods / Services</th>
      <th rowspan="${taxable ? 2 : 1}" class="c" style="width:64px">HSN/SAC</th>
      <th rowspan="${taxable ? 2 : 1}" class="r" style="width:54px">Qty</th>
      <th rowspan="${taxable ? 2 : 1}" class="r" style="width:70px">Rate</th>
      ${showDiscount ? `<th rowspan="${taxable ? 2 : 1}" class="r" style="width:62px">Disc.</th>` : ''}
      <th rowspan="${taxable ? 2 : 1}" class="r" style="width:80px">Taxable Value</th>
      ${taxable ? (inter ? '<th colspan="2" class="c">IGST</th>' : '<th colspan="2" class="c">CGST</th><th colspan="2" class="c">SGST/UTGST</th>') : ''}
      <th rowspan="${taxable ? 2 : 1}" class="r" style="width:84px">Amount</th>
    </tr>
    ${taxable ? `<tr>${(inter ? ['IGST'] : ['CGST', 'SGST']).map(() => '<th class="c sub">Rate</th><th class="r sub">Amt</th>').join('')}</tr>` : ''}`;

  const body = breakup.lines.map((l) => `
    <tr>
      <td class="c">${l.index}</td>
      <td><b>${escapeHtml(l.name)}</b>${l.note ? `<div class="mut">${escapeHtml(l.note)}</div>` : ''}</td>
      <td class="c">${escapeHtml(l.hsn || '—')}</td>
      <td class="r">${escapeHtml(l.quantity)} <span class="mut">${escapeHtml(l.unit)}</span></td>
      <td class="r">${num(l.rate)}</td>
      ${showDiscount ? `<td class="r">${num(l.discount)}</td>` : ''}
      <td class="r">${num(l.taxable)}</td>
      ${taxable ? (inter
        ? `<td class="c">${formatRate(l.taxRate)}</td><td class="r">${num(l.igst)}</td>`
        : `<td class="c">${formatRate(l.taxRate / 2)}</td><td class="r">${num(l.cgst)}</td><td class="c">${formatRate(l.taxRate / 2)}</td><td class="r">${num(l.sgst)}</td>`) : ''}
      <td class="r"><b>${num(taxable ? l.total : l.taxable)}</b></td>
    </tr>`).join('');

  const t = breakup.totals;
  const foot = `
    <tr class="tot">
      <td colspan="3" class="r">Total</td>
      <td class="r">${breakup.lines.reduce((s, l) => s + l.quantity, 0)}</td>
      <td></td>
      ${showDiscount ? `<td class="r">${num(t.discount)}</td>` : ''}
      <td class="r">${num(t.taxable)}</td>
      ${taxable ? (inter ? `<td></td><td class="r">${num(t.igst)}</td>` : `<td></td><td class="r">${num(t.cgst)}</td><td></td><td class="r">${num(t.sgst)}</td>`) : ''}
      <td class="r">${num(sale.total)}</td>
    </tr>`;
  return `<table class="items"><thead>${head}</thead><tbody>${body}</tbody><tfoot>${foot}</tfoot></table>`;
}

function buildHsnSummary(sale: PrintableSale, breakup: GstBreakup) {
  const inter = Boolean(sale.isInterstate);
  const rows = breakup.hsnSummary.map((h) => `
    <tr><td>${escapeHtml(h.hsn)}</td><td class="r">${num(h.taxable)}</td>
    ${inter ? `<td class="c">${formatRate(h.taxRate)}</td><td class="r">${num(h.igst)}</td>`
      : `<td class="c">${formatRate(h.taxRate / 2)}</td><td class="r">${num(h.cgst)}</td><td class="c">${formatRate(h.taxRate / 2)}</td><td class="r">${num(h.sgst)}</td>`}
    <td class="r"><b>${num(h.tax)}</b></td></tr>`).join('');
  return `
    <table class="hsn">
      <thead>
        <tr><th rowspan="2">HSN/SAC</th><th rowspan="2" class="r">Taxable Value</th>${inter ? '<th colspan="2" class="c">IGST</th>' : '<th colspan="2" class="c">CGST</th><th colspan="2" class="c">SGST/UTGST</th>'}<th rowspan="2" class="r">Total Tax</th></tr>
        <tr>${(inter ? ['I'] : ['C', 'S']).map(() => '<th class="c sub">Rate</th><th class="r sub">Amount</th>').join('')}</tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

function safeHexColor(value: string | undefined, fallback: string) {
  return value && /^#[0-9a-fA-F]{6}$/.test(value.trim()) ? value.trim() : fallback;
}

function a4BaseCss(primary: string, secondary: string) {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap');
    @page{size:A4;margin:10mm}
    *{box-sizing:border-box}
    html,body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
    body{font:12px/1.5 'Manrope',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#0f172a;margin:0;background:#f1f5f9;-webkit-font-smoothing:antialiased;font-variant-numeric:tabular-nums}
    .sheet{max-width:794px;margin:16px auto;background:#fff;border:1px solid #cbd5e1;box-shadow:0 10px 32px rgba(15,23,42,.08)}
    @media print{body{background:#fff}.sheet{margin:0;box-shadow:none;max-width:none}}
    b{font-weight:600}
    .r{text-align:right;white-space:nowrap}.c{text-align:center}.mut{color:#64748b;font-size:10px}
    table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
    .items th,.items td,.hsn th,.hsn td{border:1px solid #cbd5e1;padding:7px 8px;vertical-align:top}
    .items th,.hsn th{background:#f1f5f9;color:#1e293b;font-size:9.5px;text-transform:uppercase;letter-spacing:.45px;font-weight:600;border-bottom:2px solid ${primary};vertical-align:middle}
    .items th.sub,.hsn th.sub{font-size:8.5px;background:#f8fafc;color:${secondary};padding:4px 6px}
    .items tbody tr:nth-child(even) td{background:#f8fafc}
    .items tfoot td{background:#f1f5f9;font-weight:600;color:#0f172a;border-top:1.5px solid ${secondary}}
    .hsn{margin-top:10px;font-size:10.5px}
    .words{margin-top:10px;padding:9px 12px;border:1px dashed ${secondary};border-radius:8px;background:#f8fafc}
    .words span{display:block;font-size:9px;text-transform:uppercase;letter-spacing:.6px;color:${secondary};font-weight:600;margin-bottom:2px}
    .bottom{display:grid;grid-template-columns:1.2fr 1fr;gap:12px;margin-top:12px;align-items:stretch}
    .panel{border:1px solid #cbd5e1;border-radius:8px;padding:11px 13px;background:#fff}
    .panel h4{margin:0 0 6px;font-size:9.5px;text-transform:uppercase;letter-spacing:.6px;color:${primary};font-weight:600}
    .panel p{margin:2px 0;white-space:pre-line;line-height:1.45}
    .sum{background:#f8fafc;display:flex;flex-direction:column;justify-content:center}
    .sum div{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:4px 0;border-bottom:1px dashed #e2e8f0}
    .sum div:last-child{border-bottom:0}
    .sum .grand{margin-top:6px;padding:9px 12px;border-radius:7px;background:${primary};border-left:5px solid ${secondary};border-bottom:0;color:#fff;font-size:14px;font-weight:700;align-items:center}
    .sign{margin-top:14px;display:flex;justify-content:space-between;align-items:flex-end;gap:16px}
    .sign .decl{flex:1;font-size:10px;color:#475569;line-height:1.45}
    .sign .box{width:220px;text-align:center;flex:none}
    .sign .box .space{height:42px}
    .sign .box .line{border-top:1px solid ${secondary};padding-top:4px;font-size:10.5px;color:#334155;font-weight:500}
    .tag{display:inline-block;padding:2px 8px;border-radius:999px;font-size:9px;font-weight:600;letter-spacing:.6px;text-transform:uppercase}
    .brandfoot{margin-top:12px;padding-top:8px;border-top:1px dashed #cbd5e1;display:flex;justify-content:space-between;gap:12px;font-size:9.5px;color:#64748b}
  `;
}

function a4Bottom(sale: PrintableSale, shop: PrintableShop, breakup: GstBreakup, kind: ReturnType<typeof documentKind>) {
  const inter = Boolean(sale.isInterstate);
  const t = breakup.totals;
  return `
    <div class="words"><span>Amount chargeable (in words)</span><b>INR ${escapeHtml(numberToIndianWords(sale.total))}</b></div>
    ${kind.taxable && t.tax > 0 ? `<div class="words" style="margin-top:6px"><span>Tax amount (in words)</span>INR ${escapeHtml(numberToIndianWords(t.tax))}</div>` : ''}
    <div class="bottom">
      <div style="display:flex;flex-direction:column;gap:10px">
        ${shop.bankDetails || shop.upiId ? `<div class="panel"><h4>Payment details</h4>${shop.bankDetails ? `<p>${escapeHtml(shop.bankDetails)}</p>` : ''}${shop.upiId ? `<p>UPI ID: <b>${escapeHtml(shop.upiId)}</b></p>` : ''}</div>` : ''}
        <div class="panel"><h4>Terms &amp; conditions</h4><p>${escapeHtml(shop.terms || '1. Goods once sold will not be taken back or exchanged.\n2. All disputes are subject to local jurisdiction only.')}</p>${sale.note ? `<p><b>Note:</b> ${escapeHtml(sale.note)}</p>` : ''}</div>
      </div>
      <div class="panel sum">
        <div><span>Gross amount</span><span>${formatInr(t.gross)}</span></div>
        ${t.discount ? `<div><span>Less: Discount</span><span>−${formatInr(t.discount)}</span></div>` : ''}
        <div><span>Taxable value</span><span>${formatInr(t.taxable)}</span></div>
        ${kind.taxable && sale.taxRate > 0 ? (inter
          ? `<div><span>IGST @ ${formatRate(sale.taxRate)}</span><span>${formatInr(t.igst)}</span></div>`
          : `<div><span>CGST @ ${formatRate(sale.taxRate / 2)}</span><span>${formatInr(t.cgst)}</span></div><div><span>SGST @ ${formatRate(sale.taxRate / 2)}</span><span>${formatInr(t.sgst)}</span></div>`) : ''}
        <div class="grand"><span>Invoice total</span><span>${formatInr(sale.total)}</span></div>
        <div style="margin-top:4px"><span>Received (${escapeHtml(sale.method)})</span><span>${formatInr(sale.paid)}</span></div>
        <div><span>Balance due</span><span>${formatInr(Math.max(0, sale.total - sale.paid))}</span></div>
      </div>
    </div>
    <div class="sign">
      <div class="decl"><b>Declaration:</b> ${escapeHtml(kind.declaration)}${kind.taxable ? '<br>Tax payable on reverse charge: <b>No</b>' : ''}</div>
      <div class="box"><div style="font-size:10.5px">For <b>${escapeHtml(shop.name)}</b></div><div class="space"></div><div class="line">Authorised Signatory</div></div>
    </div>
    <div class="brandfoot"><span>${escapeHtml(shop.footerNote || 'This is a computer-generated invoice.')}</span><span>Generated with ollaiBooks · ${sale.sync === 'synced' ? 'Synced to cloud' : 'Saved on device'}</span></div>
  `;
}

function partyBlock(sale: PrintableSale, shop: PrintableShop, kind: ReturnType<typeof documentKind>) {
  const pos = resolvePlaceOfSupply(sale, shop);
  const buyerState = sale.customerGstin ? detectGstState(sale.customerGstin) : (sale.placeOfSupply ? detectGstState(sale.placeOfSupply) : null);
  return {
    billTo: `
      <h4>Bill to / Buyer</h4>
      <p><b style="font-size:13px">${escapeHtml(sale.customer)}</b></p>
      ${sale.customerAddress ? `<p>${escapeHtml(sale.customerAddress)}</p>` : ''}
      ${sale.phone ? `<p>Mobile: ${escapeHtml(sale.phone)}</p>` : ''}
      <p>GSTIN: <b>${escapeHtml(sale.customerGstin || 'Unregistered (B2C)')}</b></p>
      ${buyerState ? `<p>State: ${escapeHtml(buyerState.name)} · Code ${escapeHtml(buyerState.code)}</p>` : ''}`,
    details: `
      <h4>Invoice details</h4>
      <div class="kv"><span>Invoice No.</span><b>${escapeHtml(sale.number)}</b></div>
      <div class="kv"><span>Invoice Date</span><b>${escapeHtml(formatDate(sale.date))}</b></div>
      <div class="kv"><span>Time</span><span>${escapeHtml(formatTime(sale.date))}</span></div>
      ${kind.taxable ? `<div class="kv"><span>Place of Supply</span><b>${escapeHtml(pos)}</b></div><div class="kv"><span>Reverse Charge</span><span>No</span></div>` : ''}
      <div class="kv"><span>Payment Mode</span><span>${escapeHtml(sale.method)}</span></div>
      ${sale.orderType ? `<div class="kv"><span>Order Type</span><span>${escapeHtml(sale.orderType)}${sale.tableNumber ? ` · Table ${escapeHtml(sale.tableNumber)}` : ''}</span></div>` : ''}`,
  };
}

function buildClassicGstInvoiceHtml(sale: PrintableSale, shop: PrintableShop, autoPrint: boolean) {
  const kind = documentKind(sale, shop);
  const breakup = computeGstBreakup(sale);
  const logo = safeLogo(shop.logo);
  const primary = safeHexColor(shop.brandColor, '#2563eb');
  const secondary = safeHexColor(shop.secondaryColor, '#64748b');
  const party = partyBlock(sale, shop, kind);
  const stateLine = supplierStateLine(shop);
  const initial = escapeHtml((shop.name || 'S').trim().charAt(0).toUpperCase());

  const css = `${a4BaseCss(primary, secondary)}
    .sheet{border:1.5px solid #cbd5e1;border-top:5px solid ${primary};border-bottom:4px solid ${secondary};padding:20px 22px}
    .topline{display:flex;justify-content:space-between;font-size:9.5px;color:#64748b;text-transform:uppercase;letter-spacing:.8px;margin-bottom:10px}
    .head{display:grid;grid-template-columns:72px minmax(0,1fr) auto;gap:16px;align-items:start;background:#f8fafc;border:1px solid #cbd5e1;border-left:4px solid ${secondary};border-radius:10px;padding:14px 16px;margin-bottom:12px}
    .logo-box{width:72px;height:72px;border-radius:10px;background:#fff;border:1px solid #cbd5e1;display:grid;place-items:center;overflow:hidden}
    .logo-box img{width:100%;height:100%;object-fit:contain;padding:4px}
    .logo-box span{font-size:26px;font-weight:600;color:${primary}}
    .head .who{min-width:0}
    .head h1{margin:0 0 4px;font-size:20px;font-weight:600;letter-spacing:-.02em;color:#0f172a;line-height:1.2}
    .head p{margin:2px 0;color:#475569;font-size:11px;line-height:1.45}
    .doc{text-align:right;min-width:170px}
    .doc .t{display:inline-block;background:${primary};color:#fff;border-bottom:3px solid ${secondary};border-radius:6px;padding:6px 14px;font-size:11.5px;font-weight:600;letter-spacing:1.2px}
    .doc .no{font-size:15px;font-weight:700;color:#0f172a;margin-top:6px}
    .doc .dt{font-size:10.5px;color:#64748b;margin-top:2px}
    .grid2{display:grid;grid-template-columns:1fr 1fr;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;margin-bottom:12px;background:#fff;align-items:stretch}
    .grid2>div{padding:11px 13px}
    .grid2>div+div{border-left:1px solid #cbd5e1;background:#f8fafc}
    .grid2 h4{margin:0 0 6px;font-size:9.5px;text-transform:uppercase;letter-spacing:.6px;color:${primary};font-weight:600}
    .grid2>div+div h4{color:${secondary}}
    .grid2 p{margin:2px 0;line-height:1.45}
    .kv{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:2.5px 0}
    .kv span{color:#64748b;flex:none}
    .kv b,.kv span:last-child{text-align:right;color:#0f172a}
  `;

  const body = `<div class="sheet">
    <div class="topline"><span>${kind.title === 'TAX INVOICE' ? 'Original for Recipient' : 'Customer copy'}</span><span>${kind.taxable ? 'Under Section 31 of CGST Act, 2017' : ''}</span></div>
    <div class="head">
      <div class="logo-box">${logo ? `<img src="${logo}" alt="">` : `<span>${initial}</span>`}</div>
      <div class="who">
        <h1>${escapeHtml(shop.name)}</h1>
        ${shop.address ? `<p>${escapeHtml(shop.address)}</p>` : ''}
        <p>${[shop.phone ? `Ph: ${escapeHtml(shop.phone)}` : '', shop.email ? escapeHtml(shop.email) : ''].filter(Boolean).join(' · ')}</p>
        ${shop.gstin ? `<p><b>GSTIN: ${escapeHtml(shop.gstin)}</b>${stateLine ? ` · ${escapeHtml(stateLine)}` : ''}</p>` : (stateLine ? `<p>${escapeHtml(stateLine)}</p>` : '')}
        ${shop.fssai ? `<p>FSSAI Lic. No: ${escapeHtml(shop.fssai)}</p>` : ''}
      </div>
      <div class="doc">
        <div class="t">${kind.title}</div>
        <div class="no">${escapeHtml(sale.number)}</div>
        <div class="dt">${escapeHtml(formatDate(sale.date))} · ${escapeHtml(formatTime(sale.date))}</div>
      </div>
    </div>
    <div class="grid2"><div>${party.billTo}</div><div>${party.details}</div></div>
    ${buildA4ItemTable(sale, breakup, kind.taxable)}
    ${kind.taxable && breakup.totals.tax > 0 ? buildHsnSummary(sale, breakup) : ''}
    ${a4Bottom(sale, shop, breakup, kind)}
  </div>`;
  return wrapDocument(`${kind.title} ${sale.number}`, css, body, autoPrint);
}

function buildModernGstInvoiceHtml(sale: PrintableSale, shop: PrintableShop, autoPrint: boolean) {
  const kind = documentKind(sale, shop);
  const breakup = computeGstBreakup(sale);
  const logo = safeLogo(shop.logo);
  const primary = safeHexColor(shop.brandColor, '#2563eb');
  const secondary = safeHexColor(shop.secondaryColor, '#64748b');
  const party = partyBlock(sale, shop, kind);
  const stateLine = supplierStateLine(shop);
  const initial = escapeHtml((shop.name || 'S').trim().charAt(0).toUpperCase());

  const css = `${a4BaseCss(primary, secondary)}
    .sheet{border-radius:12px;overflow:hidden;border:1px solid #cbd5e1}
    .topbar{height:6px;background:linear-gradient(90deg,${primary} 0%,${primary} 55%,${secondary} 55%,${secondary} 100%)}
    .hero{background:#f1f5f9;border-bottom:1px solid #cbd5e1;padding:20px 24px;display:grid;grid-template-columns:72px minmax(0,1fr) auto;gap:18px;align-items:start}
    .mark{width:72px;height:72px;border-radius:12px;background:#fff;border:1px solid #cbd5e1;display:grid;place-items:center;overflow:hidden;box-shadow:0 2px 8px rgba(15,23,42,.06)}
    .mark img{width:100%;height:100%;object-fit:contain;padding:5px}
    .mark span{font-size:28px;font-weight:600;color:${primary}}
    .hero .who{min-width:0}
    .hero h1{margin:0 0 4px;font-size:21px;font-weight:600;letter-spacing:-.025em;color:#0f172a;line-height:1.2}
    .hero p{margin:2px 0;font-size:11.5px;color:#475569;line-height:1.45}
    .hero .contact-row{display:flex;flex-wrap:wrap;gap:10px;margin-top:3px;font-size:11px;color:#334155}
    .hero .doc{text-align:right;min-width:190px;background:#ffffff;border:1px solid #cbd5e1;border-top:3px solid ${secondary};border-radius:10px;padding:11px 14px}
    .pill{display:inline-block;background:${primary};color:#fff;padding:4px 11px;border-radius:999px;font-size:10px;font-weight:600;letter-spacing:1.2px}
    .hero .no{font-size:16px;font-weight:700;margin-top:6px;color:#0f172a}
    .hero .dt{font-size:10.5px;color:#64748b;margin-top:2px}
    .content{padding:18px 24px 22px}
    .cards{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;align-items:stretch}
    .card{background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;padding:12px 14px}
    .card h4{margin:0 0 6px;font-size:9.5px;text-transform:uppercase;letter-spacing:.6px;color:${primary};font-weight:600}
    .card+.card h4{color:${secondary}}
    .card p{margin:2px 0;line-height:1.45}
    .kv{display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:2px 0}
    .kv span{color:#475569;flex:none}
    .kv b,.kv span:last-child{text-align:right;color:#0f172a}
    .items{border-radius:8px;overflow:hidden}
    .paid{background:#dcfce7;color:#166534}
    .due{background:#fef3c7;color:#92400e}
  `;

  const paid = sale.paid >= sale.total;
  const contactItems = [
    shop.phone ? `<span>Tel: <b>${escapeHtml(shop.phone)}</b></span>` : '',
    shop.email ? `<span>Email: <b>${escapeHtml(shop.email)}</b></span>` : '',
  ].filter(Boolean).join('');
  const body = `<div class="sheet">
    <div class="topbar"></div>
    <div class="hero">
      <div class="mark">${logo ? `<img src="${logo}" alt="">` : `<span>${initial}</span>`}</div>
      <div class="who">
        <h1>${escapeHtml(shop.name)}</h1>
        ${shop.address ? `<p>${escapeHtml(shop.address)}</p>` : ''}
        ${contactItems ? `<div class="contact-row">${contactItems}</div>` : ''}
        ${shop.gstin ? `<p><b style="color:#1e293b">GSTIN: ${escapeHtml(shop.gstin)}</b>${stateLine ? ` · ${escapeHtml(stateLine)}` : ''}</p>` : (stateLine ? `<p>${escapeHtml(stateLine)}</p>` : '')}
        ${shop.fssai ? `<p>FSSAI: ${escapeHtml(shop.fssai)}</p>` : ''}
      </div>
      <div class="doc">
        <div class="pill">${kind.title}</div>
        <div class="no">${escapeHtml(sale.number)}</div>
        <p class="dt">${escapeHtml(formatDate(sale.date))} · ${escapeHtml(formatTime(sale.date))}</p>
        <span class="tag ${paid ? 'paid' : 'due'}" style="margin-top:5px">${paid ? 'Paid' : 'Balance due'}</span>
      </div>
    </div>
    <div class="content">
      <div class="cards"><div class="card">${party.billTo}</div><div class="card">${party.details}</div></div>
      ${buildA4ItemTable(sale, breakup, kind.taxable)}
      ${kind.taxable && breakup.totals.tax > 0 ? buildHsnSummary(sale, breakup) : ''}
      ${a4Bottom(sale, shop, breakup, kind)}
    </div>
  </div>`;
  return wrapDocument(`Invoice ${sale.number}`, css, body, autoPrint);
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export function buildInvoiceHtml(
  sale: PrintableSale,
  shop: PrintableShop,
  options?: { template?: InvoiceTemplateId; paperWidth?: ThermalPaperWidth; autoPrint?: boolean },
) {
  const template = options?.template || 'thermal';
  const autoPrint = options?.autoPrint ?? true;
  if (template === 'classic-gst') return buildClassicGstInvoiceHtml(sale, shop, autoPrint);
  if (template === 'modern-gst') return buildModernGstInvoiceHtml(sale, shop, autoPrint);
  const paperWidth = options?.paperWidth || '80mm';
  return wrapDocument(sale.number, getThermalBaseCss(paperWidth), buildThermalReceiptBodyHtml(sale, shop), autoPrint);
}

export function buildKotHtml(order: any, options?: { paperWidth?: ThermalPaperWidth; shopName?: string; autoPrint?: boolean }) {
  const orderNumber = order.orderNumber || order.number || 'Offline order';
  return wrapDocument(`KOT ${orderNumber}`, getThermalBaseCss(options?.paperWidth || '80mm'), buildKotSectionHtml(order, options?.shopName), options?.autoPrint ?? true);
}

export function printKitchenOrderTicket(
  order: any,
  options?: { paperWidth?: ThermalPaperWidth; shopName?: string },
) {
  openPrintPopup(buildKotHtml(order, options), 420, 700);
}

export function printInvoiceDocument(
  sale: PrintableSale,
  shop: PrintableShop,
  options?: { template?: InvoiceTemplateId; paperWidth?: ThermalPaperWidth },
) {
  const template = options?.template || 'thermal';
  const html = buildInvoiceHtml(sale, shop, { ...options, autoPrint: true });
  if (template === 'thermal') openPrintPopup(html, 420, 760);
  else openPrintPopup(html, 900, 960);
}

export function printKotAndBill(
  sale: PrintableSale,
  shop: PrintableShop,
  options?: { paperWidth?: ThermalPaperWidth },
) {
  const paperWidth = options?.paperWidth || '80mm';
  const html = wrapDocument(
    `KOT + Bill ${sale.number}`,
    getThermalBaseCss(paperWidth),
    `<div class="page-break">${buildKotSectionHtml(sale, shop.name)}</div>${buildThermalReceiptBodyHtml(sale, shop)}`,
    true,
  );
  openPrintPopup(html, 420, 800);
}

/** Demo sale used for live template previews in settings. */
export function buildSampleSale(taxRate = 5, interstate = false): PrintableSale {
  const items = [
    { name: 'Masala Dosa', quantity: 2, price: 90, hsn: '996331', unit: 'Plate' },
    { name: 'Filter Coffee', quantity: 2, price: 40, hsn: '996331', unit: 'Cup' },
    { name: 'Gulab Jamun (2 pc)', quantity: 1, price: 60, hsn: '996331', unit: 'Bowl' },
  ];
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const discount = 20;
  const gst = round2(((subtotal - discount) * taxRate) / 100);
  const total = round2(subtotal - discount + gst);
  return {
    id: 'preview', number: 'INV-PREVIEW-001', date: new Date().toISOString(), customer: 'Priya Raman', phone: '98400 12345',
    items, subtotal, discount, taxRate, gst, total, paid: total, method: 'UPI', orderType: 'Dine-in', tableNumber: '4',
    isInterstate: interstate, note: '', sync: 'pending',
  };
}

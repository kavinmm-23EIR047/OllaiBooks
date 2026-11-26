export type InvoiceTemplateId = 'thermal' | 'classic-gst' | 'modern-gst';
export type ThermalPaperWidth = '80mm' | '58mm';

export interface PrintableShop {
  name: string;
  phone: string;
  address: string;
  gstin?: string;
  businessType?: string;
}

export interface PrintableSale {
  id: string;
  number: string;
  date: string;
  customer: string;
  phone?: string;
  items: Array<{ productId?: string; name: string; quantity: number; price: number; hsn?: string }>;
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
}

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

function openPrintPopup(title: string, html: string, width = 420, height = 720) {
  const printWindow = window.open('', '_blank', `width=${width},height=${height}`);
  if (!printWindow) {
    throw new Error('Allow pop-ups for this site to print on your billing machine.');
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

function buildKotSectionHtml(order: any, shopName?: string) {
  const orderNumber = order.orderNumber || order.number || 'Offline order';
  const orderDate = new Date(order.orderDate || order.date || Date.now()).toLocaleString('en-IN');
  const customerName = typeof order.customer === 'string'
    ? order.customer
    : (order.customer?.name || 'Walk-in');
  const sourceLabel = order.website?.name || order.orderType || order.source || 'POS Counter';
  const items = Array.isArray(order.items) ? order.items : [];

  const rows = items.map((item: any) => `
    <tr>
      <td class="qty">${escapeHtml(item.quantity)}×</td>
      <td>
        <strong>${escapeHtml(item.name)}</strong>
        ${item.sku ? `<small>SKU: ${escapeHtml(item.sku)}</small>` : ''}
      </td>
    </tr>
  `).join('');

  return `
    <div class="kot-ticket">
      <header>
        ${shopName ? `<div class="shop">${escapeHtml(shopName)}</div>` : ''}
        <h1>KITCHEN / COUNTER KOT</h1>
        <div class="muted">${escapeHtml(orderNumber)}</div>
      </header>
      <section class="meta">
        <div><strong>Order #</strong><span>${escapeHtml(orderNumber)}</span></div>
        <div><strong>Type</strong><span>${escapeHtml(sourceLabel)}${order.tableNumber ? ` · Table ${escapeHtml(order.tableNumber)}` : ''}</span></div>
        <div><strong>Customer</strong><span>${escapeHtml(customerName)}</span></div>
        <div><strong>Time</strong><span>${escapeHtml(orderDate)}</span></div>
      </section>
      ${order.note ? `<div class="note-box"><strong>Note:</strong> ${escapeHtml(order.note)}</div>` : ''}
      <h2>Items (${items.reduce((s: number, i: any) => s + Number(i.quantity || 0), 0)} qty)</h2>
      <table>${rows || '<tr><td colspan="2">No items listed.</td></tr>'}</table>
      <div class="draft">KOT COPY · NOT A CUSTOMER TAX INVOICE</div>
    </div>
  `;
}

function buildThermalReceiptBodyHtml(sale: PrintableSale, shop: PrintableShop) {
  const halfRate = sale.taxRate ? (sale.taxRate / 2).toFixed(1).replace(/\.0$/, '') : '0';
  const halfGst = sale.gst / 2;
  const rows = sale.items.map((item) => `
    <tr>
      <td>
        <div class="item-name">${escapeHtml(item.name)}</div>
        <div class="item-sub">${escapeHtml(item.quantity)} × ${formatInr(item.price)}${item.hsn ? ` · HSN ${escapeHtml(item.hsn)}` : ''}</div>
      </td>
      <td class="right">${formatInr(item.price * item.quantity)}</td>
    </tr>
  `).join('');

  return `
    <div class="receipt-ticket">
      <header>
        <h1>${escapeHtml(shop.name)}</h1>
        ${shop.address ? `<p>${escapeHtml(shop.address)}</p>` : ''}
        ${shop.phone ? `<p>Ph: ${escapeHtml(shop.phone)}</p>` : ''}
        ${shop.gstin ? `<p><strong>GSTIN: ${escapeHtml(shop.gstin)}</strong></p>` : ''}
      </header>
      <div class="meta">
        <div><span>Bill No</span><strong>${escapeHtml(sale.number)}</strong></div>
        <div><span>Date</span><span>${escapeHtml(new Date(sale.date).toLocaleString('en-IN'))}</span></div>
        <div><span>Customer</span><span>${escapeHtml(sale.customer)}${sale.phone ? ` (${escapeHtml(sale.phone)})` : ''}</span></div>
        ${sale.orderType ? `<div><span>Order</span><span>${escapeHtml(sale.orderType)}${sale.tableNumber ? ` · T-${escapeHtml(sale.tableNumber)}` : ''}</span></div>` : ''}
      </div>
      <table>
        <thead><tr><th>Item</th><th class="right">Amount</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="totals">
        <div><span>Subtotal</span><span>${formatInr(sale.subtotal)}</span></div>
        ${sale.discount ? `<div><span>Discount</span><span>−${formatInr(sale.discount)}</span></div>` : ''}
        ${sale.taxRate > 0 ? `
          <div><span>CGST (${halfRate}%)</span><span>${formatInr(halfGst)}</span></div>
          <div><span>SGST (${halfRate}%)</span><span>${formatInr(halfGst)}</span></div>
        ` : ''}
        <div class="grand"><span>TOTAL PAID</span><span>${formatInr(sale.total)}</span></div>
        <div><span>Payment</span><strong>${escapeHtml(sale.method)}</strong></div>
      </div>
      ${sale.pickup ? `<p class="small">Pickup: ${escapeHtml(sale.pickup)}</p>` : ''}
      ${sale.note ? `<p class="small">Note: ${escapeHtml(sale.note)}</p>` : ''}
      <footer>
        <p>Thank you for your business!</p>
        <p class="small">Powered by ollaiBooks POS</p>
      </footer>
    </div>
  `;
}

function buildClassicGstInvoiceHtml(sale: PrintableSale, shop: PrintableShop) {
  const halfRate = sale.taxRate ? (sale.taxRate / 2).toFixed(1).replace(/\.0$/, '') : '0';
  const halfGst = sale.gst / 2;
  const rows = sale.items.map((item, idx) => `
    <tr>
      <td class="center">${idx + 1}</td>
      <td><strong>${escapeHtml(item.name)}</strong></td>
      <td class="center">${escapeHtml(item.hsn || '—')}</td>
      <td class="right">${escapeHtml(item.quantity)}</td>
      <td class="right">${formatInr(item.price)}</td>
      <td class="right"><strong>${formatInr(item.price * item.quantity)}</strong></td>
    </tr>
  `).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>Tax Invoice ${escapeHtml(sale.number)}</title><style>
    @page{size:A4;margin:14mm}*{box-sizing:border-box}body{font:13px/1.45 Arial,Helvetica,sans-serif;color:#111;margin:0;background:#fff}
    .sheet{max-width:780px;margin:0 auto;border:1.5px solid #1e293b;padding:20px}
    .title-bar{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #1e293b;padding-bottom:14px;margin-bottom:14px}
    .title-bar h1{margin:0 0 4px;font-size:20px;text-transform:uppercase;letter-spacing:.5px}
    .title-bar p{margin:2px 0;color:#475569;font-size:12px}
    .badge{border:1.5px solid #1e293b;padding:5px 12px;font-weight:bold;font-size:12px;letter-spacing:1px}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:16px}
    .box{border:1px solid #cbd5e1;padding:10px 12px;background:#f8fafc}
    .box h3{margin:0 0 6px;font-size:11px;text-transform:uppercase;color:#64748b;letter-spacing:.6px}
    .box div{font-size:12px;margin:2px 0}
    table{width:100%;border-collapse:collapse;margin-bottom:16px}
    th,td{border:1px solid #cbd5e1;padding:8px 10px;font-size:12px}
    th{background:#f1f5f9;text-align:left;font-size:11px;text-transform:uppercase;color:#334155}
    .right{text-align:right}.center{text-align:center}
    .summary-wrap{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;margin-top:10px}
    .terms{flex:1;font-size:11px;color:#475569;border:1px solid #e2e8f0;padding:10px}
    .totals{width:280px;border:1px solid #1e293b}
    .totals div{display:flex;justify-content:space-between;padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:12px}
    .totals .grand{background:#0f172a;color:#fff;font-weight:bold;font-size:14px;border-bottom:none}
    .sign{margin-top:32px;display:flex;justify-content:space-between;font-size:12px;color:#475569}
    .sign-line{border-top:1px solid #64748b;padding-top:6px;width:200px;text-align:center}
    @media print{.sheet{border:1px solid #1e293b}}
  </style></head><body><div class="sheet">
    <div class="title-bar">
      <div>
        <h1>${escapeHtml(shop.name)}</h1>
        ${shop.address ? `<p>${escapeHtml(shop.address)}</p>` : ''}
        <p>${shop.phone ? `Phone: ${escapeHtml(shop.phone)}` : ''}${shop.gstin ? ` · <strong>GSTIN: ${escapeHtml(shop.gstin)}</strong>` : ''}</p>
      </div>
      <div class="badge">TAX INVOICE</div>
    </div>
    <div class="grid">
      <div class="box">
        <h3>Bill To</h3>
        <div><strong>${escapeHtml(sale.customer)}</strong></div>
        ${sale.phone ? `<div>Phone: ${escapeHtml(sale.phone)}</div>` : ''}
        ${sale.orderType ? `<div>Order Type: ${escapeHtml(sale.orderType)}${sale.tableNumber ? ` (Table ${escapeHtml(sale.tableNumber)})` : ''}</div>` : ''}
      </div>
      <div class="box">
        <h3>Invoice Details</h3>
        <div><strong>Invoice No:</strong> ${escapeHtml(sale.number)}</div>
        <div><strong>Date &amp; Time:</strong> ${escapeHtml(new Date(sale.date).toLocaleString('en-IN'))}</div>
        <div><strong>Payment Mode:</strong> ${escapeHtml(sale.method)} (Paid)</div>
      </div>
    </div>
    <table>
      <thead><tr><th class="center" style="width:40px">#</th><th>Description</th><th class="center" style="width:85px">HSN/SAC</th><th class="right" style="width:60px">Qty</th><th class="right" style="width:95px">Rate</th><th class="right" style="width:110px">Amount</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="summary-wrap">
      <div class="terms">
        <strong>Terms &amp; Notes</strong>
        <p style="margin:4px 0 0">${escapeHtml(sale.note || 'Goods once sold will be handled as per store policy. Subject to local jurisdiction.')}</p>
      </div>
      <div class="totals">
        <div><span>Taxable Subtotal</span><span>${formatInr(sale.subtotal)}</span></div>
        ${sale.discount ? `<div><span>Discount</span><span>−${formatInr(sale.discount)}</span></div>` : ''}
        ${sale.taxRate > 0 ? `
          <div><span>CGST (${halfRate}%)</span><span>${formatInr(halfGst)}</span></div>
          <div><span>SGST (${halfRate}%)</span><span>${formatInr(halfGst)}</span></div>
        ` : ''}
        <div class="grand"><span>Grand Total</span><span>${formatInr(sale.total)}</span></div>
      </div>
    </div>
    <div class="sign">
      <span>Computer-generated invoice · Powered by ollaiBooks</span>
      <div class="sign-line">Authorized Signatory</div>
    </div>
  </div><script>window.onload=()=>{window.focus();window.print()};window.onafterprint=()=>window.close()</script></body></html>`;
}

function buildModernGstInvoiceHtml(sale: PrintableSale, shop: PrintableShop) {
  const halfRate = sale.taxRate ? (sale.taxRate / 2).toFixed(1).replace(/\.0$/, '') : '0';
  const halfGst = sale.gst / 2;
  const rows = sale.items.map((item, idx) => `
    <tr>
      <td class="muted">${idx + 1}</td>
      <td>
        <div class="item-title">${escapeHtml(item.name)}</div>
        ${item.hsn ? `<div class="hsn">HSN: ${escapeHtml(item.hsn)}</div>` : ''}
      </td>
      <td class="right">${escapeHtml(item.quantity)}</td>
      <td class="right">${formatInr(item.price)}</td>
      <td class="right"><strong>${formatInr(item.price * item.quantity)}</strong></td>
    </tr>
  `).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${escapeHtml(sale.number)}</title><style>
    @page{size:A4;margin:12mm}*{box-sizing:border-box}body{font:13px/1.5 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;margin:0;background:#fff}
    .page{max-width:780px;margin:0 auto;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden}
    .hero{background:linear-gradient(135deg,#0f172a 0%,#1d4ed8 100%);color:#fff;padding:24px 28px;display:flex;justify-content:space-between;align-items:flex-start;gap:20px}
    .hero h1{margin:0 0 4px;font-size:22px;font-weight:800;letter-spacing:-.3px}
    .hero p{margin:2px 0;font-size:12px;color:#cbd5e1}
    .inv-meta{text-align:right}
    .inv-pill{display:inline-block;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.28);padding:4px 10px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.6px;margin-bottom:8px}
    .inv-num{font-size:18px;font-weight:800}
    .content{padding:24px 28px}
    .cards{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:20px}
    .card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px}
    .card-label{font-size:10px;font-weight:700;text-transform:uppercase;color:#64748b;letter-spacing:.7px;margin-bottom:4px}
    .card-val{font-size:13px;font-weight:700;color:#0f172a}
    .card-sub{font-size:12px;color:#475569;margin-top:2px}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}
    th{background:#f1f5f9;color:#475569;font-size:11px;text-transform:uppercase;letter-spacing:.5px;padding:10px 12px;text-align:left;border-bottom:2px solid #cbd5e1}
    td{padding:11px 12px;border-bottom:1px solid #e2e8f0;vertical-align:top}
    tbody tr:nth-child(even){background:#fafcff}
    .item-title{font-weight:600;color:#0f172a}.hsn{font-size:11px;color:#64748b;margin-top:2px}.muted{color:#64748b}
    .right{text-align:right}
    .bottom{display:flex;justify-content:space-between;align-items:flex-start;gap:20px}
    .pay-box{flex:1;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 14px;font-size:12px;color:#1e3a8a}
    .totals{width:290px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 16px}
    .t-row{display:flex;justify-content:space-between;padding:5px 0;font-size:12px;color:#334155}
    .t-grand{display:flex;justify-content:space-between;padding-top:10px;margin-top:8px;border-top:2px solid #0f172a;font-size:16px;font-weight:800;color:#0f172a}
    .foot{margin-top:22px;padding-top:14px;border-top:1px dashed #cbd5e1;display:flex;justify-content:space-between;font-size:11px;color:#64748b}
  </style></head><body><div class="page">
    <div class="hero">
      <div>
        <h1>${escapeHtml(shop.name)}</h1>
        ${shop.address ? `<p>${escapeHtml(shop.address)}</p>` : ''}
        <p>${shop.phone ? `Tel: ${escapeHtml(shop.phone)}` : ''}${shop.gstin ? ` · GSTIN: ${escapeHtml(shop.gstin)}` : ''}</p>
      </div>
      <div class="inv-meta">
        <div class="inv-pill">GST TAX INVOICE</div>
        <div class="inv-num">${escapeHtml(sale.number)}</div>
        <p>${escapeHtml(new Date(sale.date).toLocaleString('en-IN'))}</p>
      </div>
    </div>
    <div class="content">
      <div class="cards">
        <div class="card">
          <div class="card-label">Billed To</div>
          <div class="card-val">${escapeHtml(sale.customer)}</div>
          <div class="card-sub">${sale.phone ? `Phone: ${escapeHtml(sale.phone)}` : 'Walk-in Customer'}</div>
        </div>
        <div class="card">
          <div class="card-label">Settlement &amp; Order</div>
          <div class="card-val">${escapeHtml(sale.method)} · Paid</div>
          <div class="card-sub">${escapeHtml(sale.orderType || 'Counter Sale')}${sale.tableNumber ? ` · Table ${escapeHtml(sale.tableNumber)}` : ''}</div>
        </div>
      </div>
      <table>
        <thead><tr><th style="width:36px">#</th><th>Item Description</th><th class="right" style="width:65px">Qty</th><th class="right" style="width:95px">Unit Price</th><th class="right" style="width:110px">Line Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="bottom">
        <div class="pay-box">
          <strong>Payment Confirmation</strong>
          <p style="margin:4px 0 0">Settled via <strong>${escapeHtml(sale.method)}</strong> (${formatInr(sale.total)}).${sale.note ? `<br/>Note: ${escapeHtml(sale.note)}` : ''}</p>
        </div>
        <div class="totals">
          <div class="t-row"><span>Subtotal</span><span>${formatInr(sale.subtotal)}</span></div>
          ${sale.discount ? `<div class="t-row"><span>Discount</span><span>−${formatInr(sale.discount)}</span></div>` : ''}
          ${sale.taxRate > 0 ? `
            <div class="t-row"><span>CGST (${halfRate}%)</span><span>${formatInr(halfGst)}</span></div>
            <div class="t-row"><span>SGST (${halfRate}%)</span><span>${formatInr(halfGst)}</span></div>
          ` : ''}
          <div class="t-grand"><span>Total Paid</span><span>${formatInr(sale.total)}</span></div>
        </div>
      </div>
      <div class="foot">
        <span>Thank you for choosing ${escapeHtml(shop.name)}</span>
        <span>Generated offline · ollaiBooks Universal POS</span>
      </div>
    </div>
  </div><script>window.onload=()=>{window.focus();window.print()};window.onafterprint=()=>window.close()</script></body></html>`;
}

function getThermalBaseCss(paperWidth: ThermalPaperWidth) {
  const maxWidth = paperWidth === '58mm' ? '50mm' : '72mm';
  const fontSize = paperWidth === '58mm' ? '12px' : '13px';
  return `
    @page{size:${paperWidth} auto;margin:3mm}
    *{box-sizing:border-box}
    body{font:${fontSize}/1.4 Arial,Helvetica,sans-serif;color:#111;margin:0 auto;max-width:${maxWidth};background:#fff}
    header{text-align:center;border-bottom:2px dashed #222;padding:4px 0 10px}
    .shop{font-size:12px;font-weight:bold;text-transform:uppercase;margin-bottom:2px}
    h1{font-size:17px;margin:0 0 4px;letter-spacing:.4px}
    h2{font-size:14px;margin:10px 0 4px}
    p{margin:2px 0;font-size:11px;color:#333}
    .muted{color:#444;font-size:11px}
    .meta{padding:8px 0;border-bottom:1px dashed #555;font-size:12px}
    .meta div{display:flex;justify-content:space-between;gap:6px;margin:2px 0}
    .note-box{margin:8px 0;padding:6px;border:1px solid #333;font-size:11px}
    table{width:100%;border-collapse:collapse;margin:8px 0;font-size:12px}
    th{text-align:left;border-bottom:1px solid #333;padding:5px 0;font-size:11px;text-transform:uppercase}
    td{padding:6px 0;border-bottom:1px dotted #aaa;vertical-align:top}
    td.qty{width:36px;font-size:15px;font-weight:bold}
    .item-name{font-weight:600}
    .item-sub{font-size:10px;color:#555}
    .right{text-align:right;white-space:nowrap}
    .totals{border-top:1px dashed #333;padding-top:6px;font-size:12px}
    .totals div{display:flex;justify-content:space-between;margin:3px 0}
    .totals .grand{font-weight:bold;font-size:15px;border-top:2px solid #111;border-bottom:2px solid #111;padding:6px 0;margin:6px 0}
    footer{text-align:center;border-top:1px dashed #555;margin-top:10px;padding-top:8px}
    .small{font-size:10px;color:#555}
    .draft{margin-top:10px;border:1px solid #111;padding:6px;text-align:center;font-size:11px;font-weight:bold}
    .page-break{page-break-after:always;break-after:page;margin-bottom:16px}
    @media print{body{width:100%;max-width:none}}
  `;
}

export function printKitchenOrderTicket(
  order: any,
  options?: { paperWidth?: ThermalPaperWidth; shopName?: string },
) {
  const paperWidth = options?.paperWidth || '80mm';
  const orderNumber = order.orderNumber || order.number || 'Offline order';
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>KOT ${escapeHtml(orderNumber)}</title><style>${getThermalBaseCss(paperWidth)}</style></head><body>${buildKotSectionHtml(order, options?.shopName)}<script>window.onload=()=>{window.focus();window.print()};window.onafterprint=()=>window.close()</script></body></html>`;
  openPrintPopup(`KOT ${orderNumber}`, html, 420, 700);
}

export function printInvoiceDocument(
  sale: PrintableSale,
  shop: PrintableShop,
  options?: { template?: InvoiceTemplateId; paperWidth?: ThermalPaperWidth },
) {
  const template = options?.template || 'thermal';
  const paperWidth = options?.paperWidth || '80mm';

  if (template === 'classic-gst') {
    openPrintPopup(sale.number, buildClassicGstInvoiceHtml(sale, shop), 860, 900);
    return;
  }
  if (template === 'modern-gst') {
    openPrintPopup(sale.number, buildModernGstInvoiceHtml(sale, shop), 860, 900);
    return;
  }

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${escapeHtml(sale.number)}</title><style>${getThermalBaseCss(paperWidth)}</style></head><body>${buildThermalReceiptBodyHtml(sale, shop)}<script>window.onload=()=>{window.focus();window.print()};window.onafterprint=()=>window.close()</script></body></html>`;
  openPrintPopup(sale.number, html, 420, 740);
}

export function printKotAndBill(
  sale: PrintableSale,
  shop: PrintableShop,
  options?: { paperWidth?: ThermalPaperWidth },
) {
  const paperWidth = options?.paperWidth || '80mm';
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>KOT + Bill ${escapeHtml(sale.number)}</title><style>${getThermalBaseCss(paperWidth)}</style></head><body><div class="page-break">${buildKotSectionHtml(sale, shop.name)}</div>${buildThermalReceiptBodyHtml(sale, shop)}<script>window.onload=()=>{window.focus();window.print()};window.onafterprint=()=>window.close()</script></body></html>`;
  openPrintPopup(`KOT + Bill ${sale.number}`, html, 420, 780);
}

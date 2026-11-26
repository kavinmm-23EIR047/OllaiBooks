import * as React from 'react';

/**
 * Rich, Sharp Vector Illustrations & Infographics for ollaiBooks Homepage
 * Crisp geometry, modern SVG visuals, vibrant #0066FF brand accents.
 */

// 1. Hero Cockpit Graphic (Full visual overview of ollaiBooks in action)
export function HeroCockpitGraphic({ className = 'w-full h-auto' }: { className?: string }) {
  return (
    <div className={`relative rounded-xl border border-slate-200 bg-white/95 p-4 sm:p-6 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90 ${className}`}>
      {/* Top Window Bar */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-rose-400" />
          <div className="h-3 w-3 rounded-full bg-amber-400" />
          <div className="h-3 w-3 rounded-full bg-emerald-400" />
          <span className="ml-2 text-xs font-semibold text-slate-500">ollaiBooks Cockpit · Real-Time Activity</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            AI Autonomous Engine Active
          </span>
        </div>
      </div>

      {/* Grid of Live Modules */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Left Column: Live Invoicing Card */}
        <div className="md:col-span-7 space-y-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-800/40">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">INVOICE GENERATOR</span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">INV-2026-8842 · Acme Retail Hub</h4>
              </div>
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-300">
                PAID IN 12s
              </span>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-200 pb-1.5 text-slate-600 dark:border-slate-700 dark:text-slate-400">
                <span>Enterprise SaaS License (Annual)</span>
                <span className="font-semibold text-slate-900 dark:text-white">₹72,000.00</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-1.5 text-slate-600 dark:border-slate-700 dark:text-slate-400">
                <span>Integrated AI Voice Telephony (10,000 min)</span>
                <span className="font-semibold text-slate-900 dark:text-white">₹18,500.00</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>GST (18% Integrated IGST)</span>
                <span>₹16,290.00</span>
              </div>
              <div className="flex justify-between pt-1 font-bold text-sm text-blue-600">
                <span>Total Settled (Instant UPI QR)</span>
                <span>₹1,06,790.00</span>
              </div>
            </div>

            {/* Quick Speed Meter Pill */}
            <div className="mt-3 flex items-center justify-between rounded bg-white p-2 border border-blue-100 text-xs text-slate-700">
              <div className="flex items-center gap-1.5">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-blue-600 text-[10px] font-bold text-white">⚡</span>
                <span className="font-medium">Generation to dispatch</span>
              </div>
              <span className="font-bold text-blue-600">1.4 seconds</span>
            </div>
          </div>

          {/* Real-time Business Pipeline & Velocity bar */}
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Cash Flow Velocity Rate</span>
              <span className="font-bold text-emerald-600">+34.8% vs last month</span>
            </div>
            {/* Progress / Velocity track */}
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-emerald-500" style={{ width: '84%' }} />
            </div>
            <div className="mt-2 flex justify-between text-[11px] text-slate-500">
              <span>Avg. Settlement: <strong className="text-slate-800 dark:text-slate-200">1.8 Days</strong> (was 24 days)</span>
              <span>Reconciled: <strong className="text-slate-800 dark:text-slate-200">99.4%</strong></span>
            </div>
          </div>
        </div>

        {/* Right Column: AI Telephony & WhatsApp Real-time Feed */}
        <div className="md:col-span-5 space-y-3">
          {/* AI Voice Call Card */}
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3.5 dark:border-blue-900/50 dark:bg-blue-950/20">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white animate-pulse">
                <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                  <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300">AI Voice Telephony Call</span>
                  <span className="text-[10px] font-mono text-blue-600 font-semibold">00:42</span>
                </div>
                <p className="text-[11px] text-blue-700 dark:text-blue-400 font-medium">Auto-Calling: Zenith Supplies</p>
              </div>
            </div>

            {/* Simulated Voice Waveform */}
            <div className="mt-2.5 flex items-center justify-center gap-1 h-6">
              {[4, 12, 20, 8, 24, 16, 28, 14, 22, 10, 18, 6, 20, 15, 8].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-blue-600 rounded-full"
                  style={{ height: `${h}px` }}
                />
              ))}
            </div>

            <div className="mt-2 rounded bg-white p-2 text-[11px] text-slate-700 border border-blue-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
              <span className="font-semibold text-blue-600">AI:</span> "Hi Mr. Sharma, ollaiBooks detected your invoice #1042 was due today. Would you like me to send an instant UPI link to WhatsApp?"
            </div>
          </div>

          {/* WhatsApp Payment Message Mockup */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3.5 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 6.46 17.5 2 12.04 2Z" />
                </svg>
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-950 dark:text-emerald-300">WhatsApp Autonomous Bot</span>
                <p className="text-[10px] text-emerald-700 dark:text-emerald-400">Delivered · 1-Click Pay</p>
              </div>
            </div>

            <div className="mt-2 rounded bg-white p-2 text-[11px] border border-emerald-200 shadow-xs dark:bg-slate-900 dark:border-slate-800">
              <p className="font-medium text-slate-800 dark:text-slate-200">Invoice PDF & Payment Link</p>
              <p className="text-slate-500 text-[10px] mt-0.5">Amount: ₹18,500 | Due: Today</p>
              <div className="mt-2 inline-flex items-center gap-1 rounded bg-emerald-600 px-2 py-1 text-[10px] font-bold text-white shadow-xs">
                <span>Pay ₹18,500 via UPI</span>
                <span>→</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 2. Speed Comparison Graphic (Manual vs ollaiBooks)
export function SpeedComparisonGraphic({ className = 'w-full' }: { className?: string }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${className}`}>
      {/* Old Manual Way */}
      <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-6 relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-800">
            ❌ The Old Manual Way
          </span>
          <span className="text-xs font-semibold text-rose-600 font-mono">Slow & Error-Prone</span>
        </div>

        <h3 className="mt-4 text-lg font-bold text-slate-900">18–25 Days Cash Cycle</h3>
        <p className="text-sm text-slate-600 mt-1">Manual spreadsheets, delayed follow-ups, and painful audits.</p>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-700 border-b border-rose-200/60 pb-2">
            <span>Creating 1 Invoice</span>
            <span className="font-bold text-rose-700">15–20 minutes</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-700 border-b border-rose-200/60 pb-2">
            <span>Payment Chasing</span>
            <span className="font-bold text-rose-700">3–5 days phone tag</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-700 border-b border-rose-200/60 pb-2">
            <span>Bank Reconciliation</span>
            <span className="font-bold text-rose-700">18+ hours / month</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-700">
            <span>GST & Tax Compliance</span>
            <span className="font-bold text-rose-700">3 days end-of-month panic</span>
          </div>
        </div>
      </div>

      {/* ollaiBooks AI Velocity Way */}
      <div className="rounded-xl border border-blue-300 bg-gradient-to-br from-blue-50/80 via-white to-emerald-50/40 p-6 shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
            ⚡ ollaiBooks AI Velocity
          </span>
          <span className="text-xs font-bold text-blue-700 font-mono">10x Acceleration</span>
        </div>

        <h3 className="mt-4 text-lg font-bold text-slate-900">Same-Day Instant Cash Flow</h3>
        <p className="text-sm text-slate-600 mt-1">Autonomous generation, AI collections, and 1-click tax filing.</p>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-700 border-b border-blue-100 pb-2">
            <span>Creating 1 Invoice</span>
            <span className="font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded">12 seconds (AI auto-fill)</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-700 border-b border-blue-100 pb-2">
            <span>Payment Chasing</span>
            <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">Autonomous WhatsApp & AI Voice</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-700 border-b border-blue-100 pb-2">
            <span>Bank Reconciliation</span>
            <span className="font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded">0 hours (Real-time auto-match)</span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-700">
            <span>GST & Tax Compliance</span>
            <span className="font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">1-Click GSTR-1 & 3B Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// 3. Interactive Invoicing Illustration
export function InvoiceIllustrationGraphic({ className = 'w-full h-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Background card with gentle shadow */}
      <rect x="20" y="15" width="360" height="210" rx="8" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
      
      {/* Top Brand Bar */}
      <rect x="20" y="15" width="360" height="28" rx="8" fill="#0066FF" />
      <rect x="20" y="35" width="360" height="8" fill="#0066FF" />
      <circle cx="42" cy="29" r="4" fill="#FFFFFF" />
      <text x="54" y="33" fill="#FFFFFF" fontSize="12" fontWeight="bold" fontFamily="sans-serif">ollaiBooks Smart Invoice</text>
      <text x="310" y="32" fill="#BAE0FF" fontSize="9" fontWeight="600" fontFamily="sans-serif">GST COMPLIANT</text>

      {/* Invoice Meta */}
      <text x="40" y="65" fill="#0F172A" fontSize="12" fontWeight="bold" fontFamily="sans-serif">INV-2026-9041</text>
      <text x="40" y="78" fill="#64748B" fontSize="9" fontFamily="sans-serif">Billed to: Reliance Logistics Solutions</text>
      <text x="260" y="65" fill="#64748B" fontSize="9" fontFamily="sans-serif">Issue Date: 06 Nov 2026</text>
      <text x="260" y="78" fill="#DC2626" fontSize="9" fontWeight="bold" fontFamily="sans-serif">Due Date: Net 15 Days</text>

      {/* Table Header */}
      <rect x="40" y="90" width="320" height="18" rx="3" fill="#F1F5F9" />
      <text x="50" y="103" fill="#475569" fontSize="8" fontWeight="bold" fontFamily="sans-serif">ITEM DESCRIPTION</text>
      <text x="210" y="103" fill="#475569" fontSize="8" fontWeight="bold" fontFamily="sans-serif">QTY</text>
      <text x="250" y="103" fill="#475569" fontSize="8" fontWeight="bold" fontFamily="sans-serif">RATE</text>
      <text x="310" y="103" fill="#475569" fontSize="8" fontWeight="bold" fontFamily="sans-serif">AMOUNT</text>

      {/* Table Rows */}
      <text x="50" y="122" fill="#0F172A" fontSize="8" fontWeight="500" fontFamily="sans-serif">Cloud ERP Implementation Sprint</text>
      <text x="215" y="122" fill="#0F172A" fontSize="8" fontFamily="sans-serif">1</text>
      <text x="245" y="122" fill="#0F172A" fontSize="8" fontFamily="sans-serif">₹85,000</text>
      <text x="315" y="122" fill="#0F172A" fontSize="8" fontWeight="bold" fontFamily="sans-serif">₹85,000</text>

      <line x1="40" y1="130" x2="360" y2="130" stroke="#E2E8F0" strokeWidth="1" />

      <text x="50" y="142" fill="#0F172A" fontSize="8" fontWeight="500" fontFamily="sans-serif">AI Telephony & WhatsApp Gateway</text>
      <text x="215" y="142" fill="#0F172A" fontSize="8" fontFamily="sans-serif">1</text>
      <text x="245" y="142" fill="#0F172A" fontSize="8" fontFamily="sans-serif">₹15,000</text>
      <text x="315" y="142" fill="#0F172A" fontSize="8" fontWeight="bold" fontFamily="sans-serif">₹15,000</text>

      <line x1="40" y1="150" x2="360" y2="150" stroke="#CBD5E1" strokeWidth="1" />

      {/* Totals & QR Code */}
      <rect x="40" y="160" width="50" height="50" rx="4" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
      {/* QR Code pattern simulation */}
      <rect x="46" y="166" width="12" height="12" fill="#0F172A" />
      <rect x="72" y="166" width="12" height="12" fill="#0F172A" />
      <rect x="46" y="192" width="12" height="12" fill="#0F172A" />
      <rect x="62" y="178" width="6" height="6" fill="#0066FF" />
      <rect x="72" y="192" width="6" height="6" fill="#0F172A" />
      <text x="100" y="175" fill="#475569" fontSize="8" fontFamily="sans-serif">Scan with any UPI app</text>
      <text x="100" y="188" fill="#0066FF" fontSize="8" fontWeight="bold" fontFamily="sans-serif">GPay · PhonePe · Paytm</text>

      {/* Right Totals */}
      <text x="240" y="172" fill="#64748B" fontSize="9" fontFamily="sans-serif">Subtotal:</text>
      <text x="315" y="172" fill="#0F172A" fontSize="9" fontWeight="600" fontFamily="sans-serif">₹1,00,000</text>
      <text x="240" y="186" fill="#64748B" fontSize="9" fontFamily="sans-serif">IGST (18%):</text>
      <text x="315" y="186" fill="#0F172A" fontSize="9" fontWeight="600" fontFamily="sans-serif">₹18,000</text>

      <line x1="240" y1="192" x2="360" y2="192" stroke="#0066FF" strokeWidth="1.5" />
      <text x="240" y="206" fill="#0066FF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">Total Due:</text>
      <text x="305" y="206" fill="#0066FF" fontSize="12" fontWeight="bold" fontFamily="sans-serif">₹1,18,000</text>

      {/* Floating Instant Paid Stamp */}
      <g transform="translate(160, 160) rotate(-10)">
        <rect x="0" y="0" width="70" height="24" rx="4" fill="#ECFDF5" stroke="#10B981" strokeWidth="1.5" strokeDasharray="3 2" />
        <text x="12" y="16" fill="#059669" fontSize="10" fontWeight="bold" fontFamily="sans-serif">✓ RECONCILED</text>
      </g>
    </svg>
  );
}

// 4. CRM & Sales Pipeline Illustration
export function CrmPipelineGraphic({ className = 'w-full h-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Outer Window */}
      <rect x="15" y="15" width="370" height="210" rx="8" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.5" />
      
      {/* 3 Pipeline Stages */}
      {/* Column 1: Qualified Leads */}
      <rect x="25" y="30" width="110" height="185" rx="6" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
      <rect x="33" y="38" width="60" height="6" rx="2" fill="#64748B" />
      <text x="98" y="44" fill="#0F172A" fontSize="8" fontWeight="bold" fontFamily="sans-serif">3</text>
      {/* Deal Card 1 */}
      <rect x="33" y="52" width="94" height="42" rx="4" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
      <text x="40" y="66" fill="#0F172A" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Titan Industries</text>
      <text x="40" y="78" fill="#0066FF" fontSize="8" fontWeight="bold" fontFamily="sans-serif">₹2,40,000</text>
      <circle cx="115" cy="74" r="5" fill="#EEF6FF" />
      {/* Deal Card 2 */}
      <rect x="33" y="100" width="94" height="42" rx="4" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1" />
      <text x="40" y="114" fill="#0F172A" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Metro Mart Ltd</text>
      <text x="40" y="126" fill="#0066FF" fontSize="8" fontWeight="bold" fontFamily="sans-serif">₹95,000</text>

      {/* Column 2: Proposal Sent (Active Highlight) */}
      <rect x="145" y="30" width="110" height="185" rx="6" fill="#EEF6FF" stroke="#91CAFF" strokeWidth="1.5" />
      <rect x="153" y="38" width="60" height="6" rx="2" fill="#0066FF" />
      <text x="218" y="44" fill="#0066FF" fontSize="8" fontWeight="bold" fontFamily="sans-serif">2</text>
      {/* Deal Card Active */}
      <rect x="153" y="52" width="94" height="52" rx="4" fill="#FFFFFF" stroke="#0066FF" strokeWidth="1.5" />
      <text x="160" y="66" fill="#0F172A" fontSize="8" fontWeight="bold" fontFamily="sans-serif">NexGen Logistics</text>
      <text x="160" y="78" fill="#059669" fontSize="9" fontWeight="bold" fontFamily="sans-serif">₹5,80,000</text>
      <rect x="160" y="86" width="65" height="10" rx="2" fill="#ECFDF5" />
      <text x="164" y="94" fill="#059669" fontSize="7" fontWeight="bold" fontFamily="sans-serif">AI Invoice Drafted</text>

      {/* Column 3: Won & Closed */}
      <rect x="265" y="30" width="110" height="185" rx="6" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
      <rect x="273" y="38" width="60" height="6" rx="2" fill="#059669" />
      <text x="338" y="44" fill="#059669" fontSize="8" fontWeight="bold" fontFamily="sans-serif">5</text>
      {/* Won Deal Card */}
      <rect x="273" y="52" width="94" height="42" rx="4" fill="#ECFDF5" stroke="#A7F3D0" strokeWidth="1" />
      <text x="280" y="66" fill="#0F172A" fontSize="8" fontWeight="bold" fontFamily="sans-serif">Apex Global</text>
      <text x="280" y="78" fill="#059669" fontSize="8" fontWeight="bold" fontFamily="sans-serif">₹12,40,000</text>
      <text x="280" y="87" fill="#10B981" fontSize="7" fontWeight="bold" fontFamily="sans-serif">✓ Paid & Reconciled</text>

      {/* Connecting Flow Arrow */}
      <path d="M 240 120 Q 255 120 265 120" stroke="#0066FF" strokeWidth="2" strokeDasharray="3 2" markerEnd="url(#arrow)" />
    </svg>
  );
}

// 5. AI Voice Telephony & WhatsApp Graphic
export function VoiceAndWhatsAppGraphic({ className = 'w-full h-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Outer Canvas */}
      <rect x="15" y="15" width="370" height="210" rx="8" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />

      {/* Left: AI Telephony Bot */}
      <rect x="30" y="30" width="160" height="180" rx="6" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="1" />
      <circle cx="60" cy="55" r="16" fill="#0066FF" />
      {/* Mic icon */}
      <path d="M 57 51 C 57 49 63 49 63 51 L 63 56 C 63 58 57 58 57 56 Z" fill="#FFFFFF" />
      <path d="M 54 54 C 54 60 66 60 66 54" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="60" y1="60" x2="60" y2="64" stroke="#FFFFFF" strokeWidth="1.5" />
      <text x="85" y="52" fill="#0F172A" fontSize="9" fontWeight="bold" fontFamily="sans-serif">AI Voice Agent</text>
      <text x="85" y="64" fill="#059669" fontSize="8" fontWeight="bold" fontFamily="sans-serif">● Live Call Active</text>

      {/* Audio Wave Visualizer */}
      <rect x="40" y="80" width="140" height="30" rx="4" fill="#EEF6FF" />
      {[8, 16, 24, 12, 28, 14, 20, 10, 26, 18, 12, 22, 14, 8].map((h, i) => (
        <rect key={i} x={48 + i * 9} y={95 - h / 2} width="4" height={h} rx="2" fill="#0066FF" />
      ))}

      {/* Live Transcript Bubble */}
      <rect x="40" y="120" width="140" height="48" rx="4" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
      <text x="46" y="133" fill="#0066FF" fontSize="7" fontWeight="bold" fontFamily="sans-serif">Transcript (AI Agent):</text>
      <text x="46" y="145" fill="#475569" fontSize="7" fontFamily="sans-serif">"Payment of ₹45,000 confirmed.</text>
      <text x="46" y="156" fill="#475569" fontSize="7" fontFamily="sans-serif">Dispatching receipt to WhatsApp."</text>
      <rect x="40" y="176" width="140" height="22" rx="4" fill="#ECFDF5" />
      <text x="56" y="190" fill="#059669" fontSize="8" fontWeight="bold" fontFamily="sans-serif">✓ 100% Polite & Compliant</text>

      {/* Right: WhatsApp Message Phone Mockup */}
      <rect x="210" y="30" width="160" height="180" rx="6" fill="#25D366" fillOpacity="0.06" stroke="#25D366" strokeWidth="1.5" />
      <rect x="210" y="30" width="160" height="28" rx="6" fill="#075E54" />
      <rect x="210" y="50" width="160" height="8" fill="#075E54" />
      <circle cx="226" cy="44" r="8" fill="#FFFFFF" />
      <text x="240" y="47" fill="#FFFFFF" fontSize="9" fontWeight="bold" fontFamily="sans-serif">ollaiBooks WhatsApp Bot</text>

      {/* Message Bubble 1 */}
      <rect x="220" y="68" width="140" height="50" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
      <text x="226" y="80" fill="#0F172A" fontSize="7" fontWeight="bold" fontFamily="sans-serif">Invoice #9042 Generated</text>
      <text x="226" y="91" fill="#64748B" fontSize="7" fontFamily="sans-serif">Total: ₹45,000.00</text>
      <rect x="226" y="98" width="128" height="14" rx="2" fill="#0066FF" />
      <text x="245" y="108" fill="#FFFFFF" fontSize="7" fontWeight="bold" fontFamily="sans-serif">Pay Instantly via UPI</text>

      {/* Message Bubble 2 (User Reply) */}
      <rect x="240" y="126" width="120" height="26" rx="4" fill="#DCF8C6" stroke="#C5E1A5" strokeWidth="1" />
      <text x="246" y="137" fill="#0F172A" fontSize="7" fontFamily="sans-serif">Paid! Sent ref #UPI9981</text>
      <text x="340" y="146" fill="#0066FF" fontSize="7" fontWeight="bold" fontFamily="sans-serif">✓✓</text>

      {/* Message Bubble 3 (Bot Receipt) */}
      <rect x="220" y="158" width="140" height="42" rx="4" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
      <text x="226" y="170" fill="#059669" fontSize="7" fontWeight="bold" fontFamily="sans-serif">✓ Payment Confirmed!</text>
      <text x="226" y="181" fill="#64748B" fontSize="7" fontFamily="sans-serif">Receipt & GSTR input PDF sent.</text>
      <text x="226" y="192" fill="#0066FF" fontSize="7" fontWeight="bold" fontFamily="sans-serif">Zero human follow-up needed.</text>
    </svg>
  );
}

// 6. Visual Automations Flow Graphic
export function AutomationFlowGraphic({ className = 'w-full h-auto' }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 240" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect x="15" y="15" width="370" height="210" rx="8" fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
      
      {/* Node 1: Trigger */}
      <rect x="35" y="90" width="85" height="60" rx="6" fill="#1E293B" stroke="#0066FF" strokeWidth="1.5" />
      <circle cx="50" cy="105" r="5" fill="#0066FF" />
      <text x="60" y="108" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="sans-serif">TRIGGER</text>
      <text x="42" y="125" fill="#94A3B8" fontSize="7" fontFamily="sans-serif">New Order Placed</text>
      <text x="42" y="136" fill="#38BDF8" fontSize="7" fontWeight="bold" fontFamily="sans-serif">Shopify / Webhook</text>

      {/* Connecting Wire 1 */}
      <line x1="120" y1="120" x2="160" y2="120" stroke="#0066FF" strokeWidth="2" strokeDasharray="3 2" />
      <circle cx="140" cy="120" r="3" fill="#38BDF8" />

      {/* Node 2: AI Action */}
      <rect x="160" y="90" width="85" height="60" rx="6" fill="#1E293B" stroke="#10B981" strokeWidth="1.5" />
      <circle cx="175" cy="105" r="5" fill="#10B981" />
      <text x="185" y="108" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="sans-serif">AI ACTION</text>
      <text x="167" y="125" fill="#94A3B8" fontSize="7" fontFamily="sans-serif">Create GST Invoice</text>
      <text x="167" y="136" fill="#4ADE80" fontSize="7" fontWeight="bold" fontFamily="sans-serif">Calculate 18% Tax</text>

      {/* Connecting Wire 2 Split */}
      <path d="M 245 120 L 265 120 L 265 70 L 285 70" stroke="#10B981" strokeWidth="2" strokeDasharray="3 2" />
      <path d="M 245 120 L 265 120 L 265 170 L 285 170" stroke="#10B981" strokeWidth="2" strokeDasharray="3 2" />

      {/* Node 3A: WhatsApp Delivery */}
      <rect x="285" y="45" width="85" height="50" rx="6" fill="#1E293B" stroke="#25D366" strokeWidth="1.5" />
      <text x="295" y="62" fill="#25D366" fontSize="8" fontWeight="bold" fontFamily="sans-serif">ACTION A</text>
      <text x="295" y="75" fill="#FFFFFF" fontSize="7" fontFamily="sans-serif">WhatsApp UPI PDF</text>
      <text x="295" y="85" fill="#94A3B8" fontSize="6" fontFamily="sans-serif">Delivered in 0.8s</text>

      {/* Node 3B: CRM Deal Update */}
      <rect x="285" y="145" width="85" height="50" rx="6" fill="#1E293B" stroke="#F59E0B" strokeWidth="1.5" />
      <text x="295" y="162" fill="#F59E0B" fontSize="8" fontWeight="bold" fontFamily="sans-serif">ACTION B</text>
      <text x="295" y="175" fill="#FFFFFF" fontSize="7" fontFamily="sans-serif">Move Deal to WON</text>
      <text x="295" y="185" fill="#94A3B8" fontSize="6" fontFamily="sans-serif">Ledger Synced</text>

      {/* Bottom Status Banner */}
      <text x="35" y="200" fill="#94A3B8" fontSize="8" fontFamily="sans-serif">Status: 100% Fully Automated · Zero Manual Intervention Needed</text>
    </svg>
  );
}


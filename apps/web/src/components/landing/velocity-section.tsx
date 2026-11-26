'use client';

import * as React from 'react';
import { SpeedComparisonGraphic } from '@/components/illustrations/landing-illustrations';
import { Zap, Clock, TrendingUp, DollarSign, ArrowRight, Gauge, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export function VelocitySection() {
  const [invoiceVolume, setInvoiceVolume] = React.useState<number>(120);

  // Dynamic calculations based on invoice volume
  const hoursSavedPerMonth = Math.round(invoiceVolume * 0.32);
  const moneySavedPerYear = invoiceVolume * 380 * 12;
  const daysDsoReduced = 18;

  return (
    <section id="business-velocity" className="py-20 bg-white border-y border-slate-200/80 dark:bg-slate-900 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <Gauge className="h-3.5 w-3.5 text-blue-600" />
            <span>BUSINESS ACCELERATION METRICS</span>
          </div>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
            How Fast Does ollaiBooks Accelerate Your Business?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            In business, speed is oxygen. ollaiBooks eliminates every friction point between making a sale and having settled cash in your bank account.
          </p>
        </div>

        {/* 1. Side-by-side Visual Comparison (Manual vs ollaiBooks) */}
        <div className="mt-12">
          <SpeedComparisonGraphic />
        </div>

        {/* 2. Interactive Business Velocity & ROI Calculator */}
        <div className="mt-16 rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/60 via-white to-slate-50 p-6 sm:p-10 shadow-lg dark:border-blue-900 dark:bg-slate-900/60">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Interactive Slider Control */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">INTERACTIVE SPEED CALCULATOR</span>
                <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                  Calculate Your Velocity Gains
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                  Select your current monthly invoice volume to see exact time and cashflow recovered:
                </p>
              </div>

              {/* Slider Component */}
              <div className="space-y-3 bg-white p-5 rounded-xl border border-slate-200 shadow-xs dark:bg-slate-800 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <label htmlFor="volume-slider" className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Monthly Invoices Sent:
                  </label>
                  <span className="rounded-lg bg-blue-600 px-3 py-1 text-base font-extrabold text-white">
                    {invoiceVolume} invoices/mo
                  </span>
                </div>
                <input
                  id="volume-slider"
                  type="range"
                  min="20"
                  max="1500"
                  step="10"
                  value={invoiceVolume}
                  onChange={(e) => setInvoiceVolume(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                  <span>20 (Boutique)</span>
                  <span>500 (Growth)</span>
                  <span>1,500+ (Enterprise)</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span>Calculated based on standard 18-minute manual processing vs 12s AI flow</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                  <span>Includes WhatsApp automated reminders + autonomous AI telephone follow-ups</span>
                </div>
              </div>
            </div>

            {/* Right: Dynamic Calculated Impact Badges */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Badge 1: Hours Saved */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {hoursSavedPerMonth} hrs
                  </p>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">Time Saved Every Month</p>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Freed from manual spreadsheet entries and follow-ups.
                  </p>
                </div>
              </div>

              {/* Badge 2: Cash Speed Up */}
              <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-800">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-extrabold text-emerald-600">
                    {daysDsoReduced} Days
                  </p>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">Faster Cash Settlement (DSO)</p>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Turn overdue receivables into bank balances 18 days sooner.
                  </p>
                </div>
              </div>

              {/* Badge 3: Estimated Annual Operational Savings */}
              <div className="sm:col-span-2 rounded-xl border border-blue-200 bg-blue-600 p-5 text-white shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-200">
                      ESTIMATED ANNUAL VALUE RECOVERED
                    </span>
                    <p className="text-2xl sm:text-3xl font-black mt-1">
                      ₹{moneySavedPerYear.toLocaleString('en-IN')} / year
                    </p>
                    <p className="text-xs text-blue-100 mt-1">
                      Direct operational savings + unlocked working capital interest savings.
                    </p>
                  </div>
                  <Link
                    href="/login?mode=register"
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-4 py-2.5 text-xs font-bold text-blue-700 shadow-sm hover:bg-blue-50 active:scale-95 transition-all flex-shrink-0"
                  >
                    <span>Unlock This Speed</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. The 4 Speed Pillars of ollaiBooks */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
              01
            </div>
            <h4 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Sub-Second Ingestion</h4>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              New customer orders from Shopify, WooCommerce, or webhooks are converted into GST invoices in under 800 milliseconds.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
              02
            </div>
            <h4 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Instant UPI QR Links</h4>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Every invoice delivers a dynamic UPI QR code and payment link over WhatsApp. Customers click and pay in 4 seconds.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
              03
            </div>
            <h4 className="mt-4 text-base font-bold text-slate-900 dark:text-white">AI Voice Telephony</h4>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              When an invoice hits its due date, conversational AI initiates polite courtesy calls to confirm payment schedules automatically.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
              04
            </div>
            <h4 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Real-Time Ledger Sync</h4>
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Bank statements and gateway payouts match line items in real-time. No waiting until month-end for accounting clarity.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}


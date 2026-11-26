'use client';

import * as React from 'react';
import {
  FileText,
  Users,
  Mic,
  MessageSquare,
  Zap,
  CreditCard,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Layers,
  Repeat,
  QrCode,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';
import Link from 'next/link';

export function FeaturesShowcase() {
  const features = [
    {
      id: 'billing',
      icon: FileText,
      badge: 'CORE BILLING ENGINE',
      title: 'Smart Autonomous Invoicing',
      description:
        'Generate GST, VAT, and multi-currency invoices in seconds. Includes automated line-item calculation, HSN/SAC codes, dynamic discount rules, customizable invoice prefixes (INV-), and instant PDF generation.',
      highlights: [
        '100% Indian GST & International VAT ready',
        'Dynamic UPI QR code embedded on every invoice',
        'Automated recurring subscriptions & retainer cycles',
        'Custom invoice styling & company branding',
      ],
      color: 'from-blue-600 to-sky-600',
    },
    {
      id: 'crm',
      icon: Users,
      badge: 'SALES & CUSTOMER 360',
      title: 'Integrated CRM & Deal Pipelines',
      description:
        'A full-fledged customer relationship management hub. Track contacts, companies, pipeline stages, lead scores, lifetime deal value, and full ledger transaction histories under one unified view.',
      highlights: [
        'Visual Kanban stages: Prospect, Lead, Proposal, Negotiating, Won',
        'Customer 360 dossier with real-time balance & credit limit',
        'Direct 1-click invoice creation from any customer card',
        'Communication timeline & payment reliability score',
      ],
      color: 'from-sky-600 to-indigo-600',
    },
    {
      id: 'ai-telephony',
      icon: Mic,
      badge: 'COURTEOUS VOICE REMINDERS',
      title: 'Polite Automated Call Follow-ups',
      description:
        'A warm, natural-sounding voice assistant that places polite follow-up calls to customers with pending or upcoming bills. Confirms invoice delivery and texts a direct UPI payment link while on the line.',
      highlights: [
        'Gentle, polite reminders that preserve great customer relations',
        'Confirms expected payment dates automatically',
        'Sends WhatsApp payment link during or immediately after the call',
        'Complete call notes and payment status recorded directly in CRM',
      ],
      color: 'from-blue-600 to-emerald-600',
    },
    {
      id: 'whatsapp',
      icon: MessageSquare,
      badge: 'OMNICHANNEL MESSAGING',
      title: 'WhatsApp Business Autonomous Bot',
      description:
        'Send professional WhatsApp invoice notifications with interactive buttons. Customers can download the official PDF, tap to pay with UPI, or ask questions to the autonomous assistant 24/7.',
      highlights: [
        'Official WhatsApp Business API integration',
        '1-click UPI, GPay, PhonePe, and Card payment buttons',
        'Automated D-3, Due Day, and Overdue reminder sequences',
        'Instant payment confirmation receipt delivered back to WhatsApp',
      ],
      color: 'from-emerald-600 to-teal-600',
    },
    {
      id: 'automations',
      icon: Zap,
      badge: 'SAVE TIME EVERY DAY',
      title: 'Effortless Store & Sales Automations',
      description:
        'Connect your physical counter, online store, and WhatsApp without manual copy-pasting. Invoices, payment receipts, and customer updates happen smoothly on autopilot.',
      highlights: [
        'Triggers on new customer orders or completed payments',
        'Sends instant WhatsApp receipts & updates order status automatically',
        'Keeps inventory synced across counter and website',
        'Ready-to-use blueprints that start working in 1 click',
      ],
      color: 'from-indigo-600 to-purple-600',
    },
    {
      id: 'payments',
      icon: CreditCard,
      badge: 'PAYMENT ORCHESTRATION',
      title: 'Multi-Gateway Payment Reconciliation',
      description:
        'Accept payments seamlessly through Razorpay, BillDesk, Stripe, Cashfree, PayPal, and Direct UPI transfers. ollaiBooks automatically reconciles incoming payouts to matching invoices in real-time.',
      highlights: [
        'Multi-gateway smart routing for lowest processing fees',
        'Instant settlement verification with bank UTR matching',
        'Partial payment support with automatic balance tracking',
        'Automated credit notes and refund handling',
      ],
      color: 'from-amber-600 to-rose-600',
    },
    {
      id: 'compliance',
      icon: ShieldCheck,
      badge: 'TAX & AUDIT INTELLIGENCE',
      title: 'GST, E-Invoicing & Audit Compliance',
      description:
        'Never worry about GST filings again. ollaiBooks calculates CGST, SGST, IGST, and cess automatically and generates audit-ready reports ready for 1-click GSTR-1 and GSTR-3B submission.',
      highlights: [
        'GSTR-1, GSTR-3B, and GSTR-9 ready data exports',
        'E-Way bill generation and NIC e-invoicing compatible',
        'Immutable audit logs tracking every change and transaction',
        'Role-based access control (Admin, Accountant, Sales Rep)',
      ],
      color: 'from-emerald-600 to-blue-600',
    },
    {
      id: 'copilot',
      icon: Sparkles,
      badge: 'YOUR BUSINESS ASSISTANT',
      title: 'Ask Questions in Plain English',
      description:
        'Need to check your numbers? Just ask: "Who owes me more than ₹50,000?", "What were my top-selling items this week?", or "Draft a bill for Rajesh Enterprises". Your copilot finds the answer instantly.',
      highlights: [
        'Understands simple everyday business questions',
        'Predictive cashflow forecasts and debtor reminders',
        'Highlights missing or delayed customer settlements',
        'Clear, digestible daily summaries for business owners',
      ],
      color: 'from-purple-600 to-pink-600',
    },
  ];

  return (
    <section id="what-billpilot-does" className="py-20 bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <Layers className="h-3.5 w-3.5 text-blue-600" />
            <span>ALL-IN-ONE BUSINESS OPERATING SYSTEM</span>
          </div>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
            What Does ollaiBooks Do? Everything Your Business Needs.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            Replaces 5 disconnected tools — invoicing software, CRM, payment collection apps, WhatsApp bots, and Zapier — with a single, high-speed unified AI platform.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className="group relative rounded-2xl border border-slate-200 bg-white p-7 shadow-xs hover:shadow-xl hover:border-blue-500/50 hover:-translate-y-1 transition-all duration-200 dark:border-slate-800 dark:bg-slate-900"
              >
                {/* Header Icon & Badge */}
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200 dark:bg-blue-950/60 dark:text-blue-400">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 uppercase tracking-wider dark:bg-slate-800 dark:text-slate-400">
                    {feature.badge}
                  </span>
                </div>

                {/* Title & Description */}
                <h3 className="mt-5 text-xl font-bold text-slate-900 dark:text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>

                {/* Feature Highlights Checklist */}
                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  {feature.highlights.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Callout: Ready to experience it */}
        <div className="mt-14 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-8 text-white shadow-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                UNIFIED ENTERPRISE WORKSPACE
              </span>
              <h3 className="mt-1 text-2xl font-bold">
                Run Your Entire Business From A Single Cockpit
              </h3>
              <p className="mt-1 text-sm text-blue-100 max-w-xl">
                Log into ollaiBooks and access invoicing, CRM pipelines, AI voice telephony, and multi-tenant management without tab-switching.
              </p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <Link
                href="/login?mode=register"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-md hover:bg-blue-50 active:scale-95 transition-all"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-blue-400/80 bg-blue-700/50 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 active:scale-95 transition-all"
              >
                <span>Access CRM Workspace</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


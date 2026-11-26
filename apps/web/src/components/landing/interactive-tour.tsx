'use client';

import * as React from 'react';
import {
  FileText,
  Users,
  Mic,
  Zap,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Layers,
  TrendingUp,
  ShieldCheck,
  LayoutGrid,
  CreditCard,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

interface FeatureCardData {
  id: string;
  category: string;
  title: string;
  humanStory: string;
  imageSrc: string;
  imageAlt: string;
  themeColor: {
    badgeBg: string;
    badgeText: string;
    border: string;
    gradient: string;
    glow: string;
  };
  metrics: {
    stat: string;
    label: string;
  };
  benefits: string[];
  statusPill: {
    activeText: string;
    subText: string;
  };
  ctaText: string;
  ctaHref: string;
}

const FEATURE_CARDS: FeatureCardData[] = [
  {
    id: 'invoicing',
    category: 'INSTANT REVENUE COLLECTION',
    title: 'Get Paid 3x Faster Directly via UPI',
    humanStory:
      'Send clean, professional GST invoices directly over WhatsApp or Email. Customers tap once to pay with PhonePe, Google Pay, or Paytm — and money settles immediately into your bank account with a verified paid receipt.',
    imageSrc: '/illustrations/invoice-paid-stamp.png',
    imageAlt: 'Indian GST Tax Invoice with Paid Verification Stamp',
    themeColor: {
      badgeBg: 'bg-blue-100 dark:bg-blue-950',
      badgeText: 'text-blue-700 dark:text-blue-300',
      border: 'hover:border-blue-400',
      gradient: 'from-blue-50/70 via-sky-50/40 to-white dark:from-blue-950/20 dark:to-slate-900',
      glow: 'shadow-blue-500/10',
    },
    metrics: {
      stat: '12 Seconds',
      label: 'Average Invoice Dispatch Time',
    },
    benefits: [
      'Embedded dynamic UPI QR code on every single bill',
      'Automatic verified "PAID" digital stamp generated upon settlement',
      'Zero awkward payment follow-up chats or friction',
    ],
    statusPill: {
      activeText: 'GST Rule 46 Compliant',
      subText: 'INV-2026-1082 · Settled Instantly',
    },
    ctaText: 'Try Smart Invoicing Free',
    ctaHref: '/login?mode=register',
  },
  {
    id: 'copilot',
    category: 'FRIENDLY 24/7 HELPER',
    title: 'Your Tireless AI Business Co-Pilot',
    humanStory:
      'Think of it as having your most organized assistant on duty 24 hours a day. It tracks customer orders, answers billing questions warmly, and sends polite courtesy reminders before dues so you never chase payments manually.',
    imageSrc: '/illustrations/hero-ai-robot-mascot.png',
    imageAlt: 'ollaiBooks Autonomous AI Assistant Robot Mascot',
    themeColor: {
      badgeBg: 'bg-emerald-100 dark:bg-emerald-950',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      border: 'hover:border-emerald-400',
      gradient: 'from-emerald-50/70 via-teal-50/40 to-white dark:from-emerald-950/20 dark:to-slate-900',
      glow: 'shadow-emerald-500/10',
    },
    metrics: {
      stat: '15+ Hours',
      label: 'Saved on Weekly Billing Chores',
    },
    benefits: [
      'Courteous, natural customer reminders that preserve friendships & trust',
      'Syncs online orders, counter bills, and inventory automatically',
      'Always on duty — no customer bill or inquiry is ever forgotten',
    ],
    statusPill: {
      activeText: 'Friendly Assistant Active',
      subText: '12 Customer Follow-ups Handled Today',
    },
    ctaText: 'Meet Your Business Co-Pilot',
    ctaHref: '/login?mode=register',
  },
  {
    id: 'audit',
    category: 'PEACE OF MIND ACCOUNTING',
    title: 'Zero Month-End Stress & 100% Tax Peace of Mind',
    humanStory:
      'Say goodbye to crumpled paper receipts and late-night panic before tax filing deadlines. Every sale, expense, and tax calculation is neatly matched, giving your accountant a pristine, audit-ready balance sheet in one click.',
    imageSrc: '/illustrations/balance-audit-clipboard.png',
    imageAlt: 'Balance Sheet and Financial Audit Clipboard',
    themeColor: {
      badgeBg: 'bg-amber-100 dark:bg-amber-950',
      badgeText: 'text-amber-800 dark:text-amber-300',
      border: 'hover:border-amber-400',
      gradient: 'from-amber-50/70 via-orange-50/40 to-white dark:from-amber-950/20 dark:to-slate-900',
      glow: 'shadow-amber-500/10',
    },
    metrics: {
      stat: '1-Click',
      label: 'Instant Accountant / CA Export',
    },
    benefits: [
      'Instant automatic split for CGST, SGST, and IGST for all states',
      'Clean GSTR-1 & GSTR-3B audit-ready summaries with zero math mistakes',
      'No missing bills or surprise penalties at year-end',
    ],
    statusPill: {
      activeText: 'Audit Health: 100%',
      subText: 'Zero Discrepancies · Ready for CA',
    },
    ctaText: 'Explore Tax-Ready Reports',
    ctaHref: '/login?mode=register',
  },
  {
    id: 'analytics',
    category: 'REAL-TIME PROFIT CLARITY',
    title: 'Know Your Real Daily Profits at a Single Glance',
    humanStory:
      'See exactly how much revenue came in today, what customer payments are pending, and which products are making you the most profit. Crystal-clear numbers that anyone can understand without confusing accounting spreadsheets.',
    imageSrc: '/illustrations/finance-analytics-calc.png',
    imageAlt: 'Real-time Financial Calculator and Analytics Tape',
    themeColor: {
      badgeBg: 'bg-purple-100 dark:bg-purple-950',
      badgeText: 'text-purple-700 dark:text-purple-300',
      border: 'hover:border-purple-400',
      gradient: 'from-purple-50/70 via-indigo-50/40 to-white dark:from-purple-950/20 dark:to-slate-900',
      glow: 'shadow-purple-500/10',
    },
    metrics: {
      stat: 'Real-Time',
      label: 'Daily Profit & Cash Flow Tracking',
    },
    benefits: [
      'Live cashflow and profit calculations updated as orders happen',
      'Timely stock alerts before your top-selling products run out',
      'Crystal-clear bank settlement matching with zero guessing',
    ],
    statusPill: {
      activeText: 'Daily Profit Dashboard',
      subText: 'Live Cash Flow & Sales In Sync',
    },
    ctaText: 'See Your Daily Profits',
    ctaHref: '/login?mode=register',
  },
];

export function InteractiveTour() {
  const [highlightedCard, setHighlightedCard] = React.useState<string | null>(null);

  return (
    <section
      id="interactive-tour"
      className="py-20 sm:py-24 bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 border-t border-slate-200/80 dark:border-slate-800"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/90 px-3.5 py-1 text-xs font-bold text-blue-700 shadow-xs dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-300">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-pulse" />
            <span>ALL-IN-ONE BUSINESS FREEDOM</span>
          </div>

          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
            Four Ways ollaiBooks Gives You{' '}
            <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent">
              Speed &amp; Peace of Mind
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            No accounting headaches, no awkward payment reminders, and no lost receipts. Here is how your daily business workflow transforms into an effortless, fast experience.
          </p>

          {/* Quick Filter / Highlight Pills */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => setHighlightedCard(null)}
              className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                highlightedCard === null
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              Show All 4 Features
            </button>
            {FEATURE_CARDS.map((card) => {
              const isSelected = highlightedCard === card.id;
              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setHighlightedCard(isSelected ? null : card.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  {card.title.split(' ')[0]} {card.title.split(' ')[1]}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4-Card Bento Gallery: ALL 4 Custom PNG Illustrations Showcased Simultaneously */}
        <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {FEATURE_CARDS.map((card) => {
            const isFaded = highlightedCard !== null && highlightedCard !== card.id;
            const isTargeted = highlightedCard === card.id;

            return (
              <div
                key={card.id}
                className={`group relative rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col justify-between dark:border-slate-800 dark:bg-slate-900 ${
                  card.themeColor.border
                } ${card.themeColor.glow} ${
                  isFaded ? 'opacity-40 scale-[0.98]' : 'opacity-100'
                } ${isTargeted ? 'ring-2 ring-blue-500 shadow-blue-500/20 scale-[1.01]' : ''}`}
              >
                {/* Card Top: Category Badge & Stat */}
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider ${card.themeColor.badgeBg} ${card.themeColor.badgeText}`}
                    >
                      {card.category}
                    </span>
                    <div className="text-right">
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        {card.metrics.stat}
                      </span>
                      <p className="text-[10px] text-slate-500 font-semibold">{card.metrics.label}</p>
                    </div>
                  </div>

                  {/* Card Title & Story */}
                  <h3 className="mt-4 text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {card.humanStory}
                  </p>
                </div>

                {/* Card Middle: Dedicated Clean Illustration Display Container */}
                <div className="my-6 rounded-2xl bg-gradient-to-b from-slate-50 via-slate-50/50 to-white dark:from-slate-800/60 dark:to-slate-900 border border-slate-200/70 dark:border-slate-800 p-5 sm:p-7 flex items-center justify-center relative overflow-hidden group-hover:border-blue-300 transition-colors">
                  {/* Subtle soft backdrop radial glow */}
                  <div className="absolute inset-0 bg-blue-500/5 blur-xl rounded-full pointer-events-none" />

                  <img
                    src={card.imageSrc}
                    alt={card.imageAlt}
                    className="relative z-10 w-full max-w-[280px] sm:max-w-xs h-52 sm:h-60 object-contain drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Card Bottom: Benefits Checklist, Live Status Pill & CTA */}
                <div className="space-y-4 pt-2">
                  {/* Checklist */}
                  <div className="space-y-2">
                    {card.benefits.map((benefit, bIdx) => (
                      <div key={bIdx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Status Indicator Pill */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs dark:bg-slate-800/50 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {card.statusPill.activeText}
                      </span>
                    </div>
                    <span className="font-semibold text-blue-600 dark:text-blue-400 text-[11px]">
                      {card.statusPill.subText}
                    </span>
                  </div>

                  {/* Action Link Button */}
                  <div className="pt-1">
                    <Link
                      href={card.ctaHref}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all"
                    >
                      <span>{card.ctaText}</span>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

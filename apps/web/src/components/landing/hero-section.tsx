'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, CheckCircle2, Zap, Play, ShieldCheck, ChevronRight } from 'lucide-react';
import { HeroCockpitGraphic } from '@/components/illustrations/landing-illustrations';

export function HeroSection() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  React.useEffect(() => {
    try {
      setIsLoggedIn(Boolean(sessionStorage.getItem('billpilot_jwt_token')));
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  return (
    <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28 bg-gradient-to-b from-blue-50/50 via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Background Glow Circles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative">
        {/* Top Feature Pill */}
        <div className="flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold text-blue-700 shadow-xs backdrop-blur-md dark:border-blue-900/60 dark:bg-slate-900/80 dark:text-blue-300">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="font-bold">ollaiBooks 2.0 Released</span>
            <span className="text-slate-400">·</span>
            <span>Effortless Invoicing, Customer Management & Smart Payment Follow-ups</span>
            <ChevronRight className="h-3.5 w-3.5 text-blue-500" />
          </div>
        </div>

        {/* Master Headline */}
        <div className="mx-auto mt-6 max-w-4xl text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl dark:text-white leading-[1.12]">
            The Autonomous Billing & CRM Engine That{' '}
            <span className="bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 bg-clip-text text-transparent">
              Accelerates Your Business 10x
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Eliminate billing delays, manage customer orders smoothly, and collect overdue payments 3x faster with friendly WhatsApp reminders, polite phone follow-ups, and automatic GST reconciliation.
          </p>

          {/* Primary CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all"
              >
                <span>Enter CRM Workspace</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login?mode=register"
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700 active:scale-95 transition-all"
                >
                  <Sparkles className="h-5 w-5 text-sky-200" />
                  <span>Start 14-Day Free Trial</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-base font-semibold text-slate-800 shadow-sm hover:bg-slate-50 hover:border-slate-400 active:scale-95 transition-all dark:bg-slate-900 dark:border-slate-700 dark:text-slate-100"
                >
                  <span>Sign In to CRM</span>
                </Link>
              </>
            )}
            <a
              href="#invoice-templates"
              className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 px-5 py-3.5 text-base font-semibold text-blue-700 hover:bg-blue-100/80 hover:border-blue-300 active:scale-95 transition-all dark:bg-blue-950/40 dark:border-blue-900/60 dark:text-blue-300"
            >
              <Sparkles className="h-4 w-4 text-blue-600 animate-pulse" />
              <span>Live GST Templates & QR</span>
            </a>
            <a
              href="#interactive-tour"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/60 px-5 py-3.5 text-base font-semibold text-slate-700 hover:bg-white hover:border-slate-300 active:scale-95 transition-all dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-300"
            >
              <Play className="h-4 w-4 text-blue-600 fill-blue-600" />
              <span>Explore Interactive Demo</span>
            </a>
          </div>

          {/* Trust Guarantees */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Instant 60-Second Onboarding
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              No Credit Card Required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              100% GST & Multi-Currency Compliant
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Enterprise Data Encryption
            </span>
          </div>
        </div>

        {/* Hero Visual Cockpit Illustration Graphic with AI Mascot Header */}
        <div className="mt-12 lg:mt-16 relative">
          {/* Autonomous AI Robot Mascot Floating Pill */}
          <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-blue-200/90 bg-white/90 p-3 sm:px-5 sm:py-3.5 shadow-lg backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
            <div className="flex items-center gap-3.5 text-left w-full sm:w-auto">
              <div className="relative h-12 w-12 sm:h-14 sm:w-14 flex-shrink-0">
                <img
                  src="/illustrations/hero-ai-robot-mascot.png"
                  alt="ollaiBooks Autonomous AI Mascot"
                  className="h-full w-full object-contain filter drop-shadow-sm hover:scale-105 transition-transform"
                />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 ring-2 ring-white" />
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                    ollaiBooks Smart Business Co-Pilot
                  </span>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 border border-emerald-300">
                    ACTIVE · READY TO ASSIST
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  "I automatically prepare GST Rule 46 invoices, sync inventory, and trigger WhatsApp UPI payment links."
                </p>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="rounded bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 text-blue-700 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800">
                Response Time: &lt; 1s · 24/7 AI Sales Assistant
              </span>
            </div>
          </div>

          <HeroCockpitGraphic />
        </div>

        {/* Live Metrics Floating Bar */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <p className="text-2xl sm:text-3xl font-extrabold text-blue-600">12.4s</p>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">Invoice Generation Time</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600">3.2x</p>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">Faster Cash Collections</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <p className="text-2xl sm:text-3xl font-extrabold text-blue-600">99.4%</p>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">Automatic Bookkeeping Accuracy</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <p className="text-2xl sm:text-3xl font-extrabold text-indigo-600">0 hrs</p>
            <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mt-1">Month-End Audit Stress</p>
          </div>
        </div>
      </div>
    </section>
  );
}


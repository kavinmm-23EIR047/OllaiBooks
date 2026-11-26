'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export function CtaBanner() {
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  React.useEffect(() => {
    try {
      setIsLoggedIn(Boolean(sessionStorage.getItem('billpilot_jwt_token')));
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  return (
    <section className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 px-6 py-16 sm:px-12 sm:py-20 text-white shadow-2xl">
          {/* Subtle Ambient Background circles */}
          <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

          <div className="relative mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/40 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-blue-100 border border-blue-400/30">
              <Sparkles className="h-3.5 w-3.5 text-sky-200" />
              <span>TRANSFORM YOUR BUSINESS VELOCITY TODAY</span>
            </span>

            <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              Ready to Accelerate Your Billing & CRM to 10x Velocity?
            </h2>

            <p className="mt-4 text-base sm:text-lg text-blue-100 leading-relaxed max-w-2xl mx-auto">
              Stop waiting 30 days for customer payments. Start generating instant GST invoices, tracking deals, and collecting cash flow automatically with ollaiBooks AI.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              {isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 text-base font-extrabold text-blue-700 shadow-xl hover:bg-blue-50 active:scale-95 transition-all"
                >
                  <span>Open CRM Workspace</span>
                  <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <>
                  <Link
                    href="/login?mode=register"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 text-base font-extrabold text-blue-700 shadow-xl hover:bg-blue-50 active:scale-95 transition-all"
                  >
                    <span>Start 14-Day Free Trial</span>
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-xl border-2 border-white/80 bg-blue-800/40 px-6 py-3.5 text-base font-bold text-white hover:bg-blue-800/60 active:scale-95 transition-all"
                  >
                    <span>Sign In to CRM</span>
                  </Link>
                </>
              )}
            </div>

            {/* Guarantee checklist */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-blue-100">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                No Credit Card Required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Instant 60-Second Onboarding
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                Full GST, VAT & Multi-Currency Engine
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


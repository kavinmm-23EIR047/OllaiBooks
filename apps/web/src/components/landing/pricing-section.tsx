'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export function PricingSection() {
  const [billingCycle, setBillingCycle] = React.useState<'monthly' | 'annual'>('annual');

  const plans = [
    {
      name: 'Starter',
      badge: 'FOR FREELANCERS & BOUTIQUES',
      priceMonthly: '₹1,299',
      priceAnnual: '₹999',
      period: 'per month, billed annually',
      description: 'Everything you need to send professional GST invoices and track customer deals.',
      features: [
        'Up to 150 invoices / month',
        'Full CRM Customer 360 & deal pipeline',
        'Dynamic UPI QR code on every invoice',
        'Automated payment receipt generation',
        'Standard email invoice delivery',
        '1 User workspace access',
        'GSTR-1 data exports',
      ],
      cta: 'Start 14-Day Free Trial',
      popular: false,
    },
    {
      name: 'Pro Growth',
      badge: 'MOST POPULAR · BEST VALUE',
      priceMonthly: '₹3,299',
      priceAnnual: '₹2,499',
      period: 'per month, billed annually',
      description: 'Supercharge your cash flow with autonomous WhatsApp reminders & AI Voice Telephony.',
      features: [
        'Unlimited invoices & recurring subscriptions',
        'Official WhatsApp Business bot integration',
        'AI Voice Telephony Collection Agent (500 mins/mo)',
        'Visual workflow automation builder',
        'Shopify & WooCommerce store auto-ingestion',
        'Multi-currency & international VAT billing',
        'Up to 5 team seats with role permissions',
        'Priority 24/7 support',
      ],
      cta: 'Start 14-Day Free Trial',
      popular: true,
    },
    {
      name: 'Enterprise',
      badge: 'FOR LARGE ENTERPRISES',
      priceMonthly: '₹9,999',
      priceAnnual: '₹7,999',
      period: 'per month, billed annually',
      description: 'Maximum velocity and dedicated multi-tenant infrastructure for high-volume operations.',
      features: [
        'Unlimited invoices, deals & users',
        'Dedicated multi-tenant cloud cluster',
        'Unlimited AI Voice Telephony calling minutes',
        'Custom ERP integrations (SAP, Zoho, Tally)',
        'NIC E-Invoicing & E-Way Bill automated sync',
        'Custom AI Copilot prompt customization',
        '99.99% SLA guarantee & dedicated account manager',
        'Custom domain & white-label branding',
      ],
      cta: 'Contact Enterprise Sales',
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            <span>TRANSPARENT, HIGH-ROI PRICING</span>
          </div>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900 sm:text-4xl dark:text-white">
            Simple Plans That Pay For Themselves in 48 Hours
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            Recover just 1 overdue invoice and ollaiBooks has already paid for itself for the entire year.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <span className={`text-sm font-semibold ${billingCycle === 'monthly' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'annual' : 'monthly')}
              className="relative inline-flex h-7 w-12 items-center rounded-full bg-blue-600 transition-colors cursor-pointer"
              aria-label="Toggle billing frequency"
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-semibold ${billingCycle === 'annual' ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                Annual
              </span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-300">
                SAVE 25%
              </span>
            </div>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col justify-between rounded-2xl p-8 transition-all duration-200 ${plan.popular
                    ? 'border-2 border-blue-600 bg-white shadow-2xl scale-105 z-10 dark:bg-slate-900'
                    : 'border border-slate-200 bg-white shadow-sm hover:shadow-lg dark:border-slate-800 dark:bg-slate-900'
                  }`}
              >
                {/* Popular Pill */}
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-md">
                    MOST POPULAR CHOICE
                  </div>
                )}

                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {plan.badge}
                  </span>
                  <h3 className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white">{price}</span>
                    <span className="text-xs text-slate-500">/ mo</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{plan.period}</p>

                  {/* Feature Checklist */}
                  <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    {plan.features.map((ft, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
                        <Check className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span>{ft}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <div className="mt-8 pt-4">
                  <Link
                    href="/login?mode=register"
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold shadow-md transition-all ${plan.popular
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/25 active:scale-95'
                        : 'border border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 active:scale-95'
                      }`}
                  >
                    <span>{plan.cta}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Money-Back Guarantee Strip */}
        <div className="mt-12 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>All plans include a 14-day full feature trial · No credit card required · Cancel anytime</span>
        </div>
      </div>
    </section>
  );
}


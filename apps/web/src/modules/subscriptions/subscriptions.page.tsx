'use client';

import * as React from 'react';
import { WorkspaceHeader } from '@/components/workspace/header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Package, Sparkles, CreditCard, ShieldCheck } from 'lucide-react';
import { AiPageAgentBanner } from '@/components/ai/ai-page-agent-banner';
import { AiSymbol } from '@/components/ui/ai-symbol';

export function SubscriptionsPage() {
  const plans = [
    {
      name: 'Starter',
      price: '₹999',
      interval: '/month',
      current: false,
      features: ['1 Connected Website', '500 Invoices/mo', '1,000 WhatsApp Msgs', 'Manual & Auto Billing'],
      cta: 'Upgrade Plan',
    },
    {
      name: 'Growth',
      price: '₹2,499',
      interval: '/month',
      current: true,
      features: [
        '3 Connected Websites',
        '2,500 Invoices/mo',
        '5,000 WhatsApp Msgs',
        'Automations Engine',
        'Priority SLA Support',
      ],
      cta: 'Manage Billing',
    },
    {
      name: 'Business AI',
      price: '₹4,999',
      interval: '/month',
      current: false,
      features: [
        'Unlimited Websites',
        'Unlimited Invoices',
        'AI WhatsApp Copilot',
        'AI Voice Calling Agent (300 mins)',
        'Custom GST & Branding',
      ],
      cta: 'Upgrade to Business AI',
    },
  ];

  return (
    <div className="space-y-6">
      <WorkspaceHeader
        title="Subscription & Quota Metering"
        description="Monitor current plan entitlements, active monthly quotas, and subscription tier."
        badge="Active Tier: Growth"
        primaryAction={{
          label: 'Manage Billing',
          onClick: () => alert('Stripe/Billdesk Customer Portal opened.'),
          icon: <CreditCard className="h-3.5 w-3.5" />,
        }}
      />

      {/* Autonomous AI Guidance Agent Banner */}
      <AiPageAgentBanner module="dashboard" />

      {/* 3 Zoho-Style Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => (
          <Card
            key={p.name}
            className={`relative p-6 rounded-2xl transition-all ${
              p.current
                ? 'border-2 border-blue-600 bg-white shadow-lg ring-4 ring-blue-50'
                : 'border border-slate-200/90 bg-white shadow-xs hover:border-slate-300'
            }`}
          >
            {p.current && (
              <div className="absolute -top-3 left-6">
                <span className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                  Current Plan
                </span>
              </div>
            )}

            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-bold text-slate-900">{p.name}</h4>
              <Package className={`h-6 w-6 ${p.current ? 'text-blue-600' : 'text-slate-400'}`} />
            </div>

            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl font-bold text-slate-900">{p.price}</span>
              <span className="text-xs font-semibold text-slate-400">{p.interval}</span>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100 text-xs font-medium text-slate-600 mb-8">
              {p.features.map((feat, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </span>
                  <span>{feat}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => alert(`Selected plan: ${p.name}`)}
              className={`w-full rounded-xl py-2.5 text-xs font-bold transition shadow-xs ${
                p.current
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'
                  : 'border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {p.cta}
            </button>
          </Card>
        ))}
      </div>
    </div>
  );
}

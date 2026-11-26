'use client';

import * as React from 'react';
import Link from 'next/link';
import { AiSymbol } from '@/components/ui/ai-symbol';
import { ShieldCheck, ArrowRight } from 'lucide-react';

export function LandingFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-900 text-slate-400 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Info */}
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <AiSymbol className="h-4.5 w-4.5 fill-white" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                ollaiBooks AI
              </span>
            </Link>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Enterprise Billing & Autonomous Business CRM. Accelerate cash collections, automate sales pipelines, and eliminate bookkeeping friction with AI agents.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Systems Operational · 99.99% Uptime</span>
            </div>
          </div>

          {/* Column 1: Core Modules */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Modules</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li><a href="#what-billpilot-does" className="hover:text-white transition-colors">Smart Invoicing</a></li>
              <li><a href="#what-billpilot-does" className="hover:text-white transition-colors">CRM & Deals</a></li>
              <li><a href="#what-billpilot-does" className="hover:text-white transition-colors">AI Telephony Bot</a></li>
              <li><a href="#what-billpilot-does" className="hover:text-white transition-colors">WhatsApp Engine</a></li>
              <li><a href="#what-billpilot-does" className="hover:text-white transition-colors">Visual Automations</a></li>
            </ul>
          </div>

          {/* Column 2: Platform & CRM */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">CRM Workspace</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li><Link href="/login" className="hover:text-white transition-colors">Sign In to CRM</Link></li>
              <li><Link href="/login?mode=register" className="hover:text-white transition-colors">Create Workspace</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard Overview</Link></li>
              <li><Link href="/home" className="hover:text-white transition-colors">Workspace Hub</Link></li>
              <li><Link href="/#download-app" className="hover:text-white transition-colors">Install the App</Link></li>
              <li><a href="#business-velocity" className="hover:text-white transition-colors">Speed Calculator</a></li>
            </ul>
          </div>

          {/* Column 3: Compliance & Trust */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">Compliance & Legal</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li><span className="hover:text-white">GST & Tax Compliance</span></li>
              <li><span className="hover:text-white">Multi-Tenant Isolation</span></li>
              <li><span className="hover:text-white">256-bit Encryption</span></li>
              <li><span className="hover:text-white">Terms of Service</span></li>
              <li><span className="hover:text-white">Privacy Policy</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <p>© {new Date().getFullYear()} ollaiBooks AI Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              SOC2 & GST Ready Architecture
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}


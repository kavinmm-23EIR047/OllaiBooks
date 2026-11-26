'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AiSymbol } from '@/components/ui/ai-symbol';
import { Menu, X, ArrowRight, ShieldCheck, LogIn, LayoutDashboard, Download } from 'lucide-react';

export function LandingNav() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  React.useEffect(() => {
    try {
      const token = sessionStorage.getItem('billpilot_jwt_token');
      setIsLoggedIn(Boolean(token));
    } catch {
      setIsLoggedIn(false);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('billpilot_jwt_token');
    sessionStorage.removeItem('billpilot_active_tenant_id');
    sessionStorage.removeItem('billpilot_workspaces');
    setIsLoggedIn(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/95 transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <AiSymbol className="h-5 w-5 fill-white" />
          </div>
          <div className="flex flex-col flex-shrink-0">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap">
                ollaiBooks
              </span>
              <span className="inline-flex items-center rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 whitespace-nowrap flex-shrink-0 leading-none">
                AI PILOT
              </span>
            </div>
            <span className="block text-[11px] font-medium text-slate-500 -mt-0.5 whitespace-nowrap">
              Autonomous Billing & CRM
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-3.5 xl:gap-6 text-[13px] xl:text-sm font-semibold text-slate-600 dark:text-slate-300 flex-shrink-0">
          <a href="#invoice-templates" className="hover:text-blue-600 transition-colors flex items-center gap-1.5 whitespace-nowrap flex-shrink-0">
            <span className="whitespace-nowrap">GST Templates</span>
            <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 whitespace-nowrap dark:bg-blue-950 dark:text-blue-300 leading-none flex-shrink-0">UPI QR</span>
          </a>
          <a href="#what-billpilot-does" className="hover:text-blue-600 transition-colors whitespace-nowrap flex-shrink-0">
            <span className="whitespace-nowrap">What It Does</span>
          </a>
          <a href="#business-velocity" className="hover:text-blue-600 transition-colors flex items-center gap-1 whitespace-nowrap flex-shrink-0">
            <span className="whitespace-nowrap">Business Speed</span>
            <span className="inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 whitespace-nowrap leading-none flex-shrink-0">10x</span>
          </a>
          <a href="#interactive-tour" className="hover:text-blue-600 transition-colors whitespace-nowrap flex-shrink-0">
            <span className="whitespace-nowrap">Interactive Tour</span>
          </a>
          <a href="#pricing" className="hover:text-blue-600 transition-colors whitespace-nowrap flex-shrink-0">
            <span className="whitespace-nowrap">Pricing</span>
          </a>
          <a href="#faq" className="hover:text-blue-600 transition-colors whitespace-nowrap flex-shrink-0">
            <span className="whitespace-nowrap">FAQ</span>
          </a>
          <Link href="/#download-app" className="hover:text-blue-600 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap flex-shrink-0">
            <Download className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">Get the App</span>
          </Link>
        </nav>

        {/* Desktop Right Action Area: Login / CRM Switcher */}
        <div className="hidden lg:flex items-center gap-2 xl:gap-3 flex-shrink-0 whitespace-nowrap">
          {isLoggedIn ? (
            <div className="flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 xl:px-4 py-2 text-xs xl:text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all whitespace-nowrap flex-shrink-0"
              >
                <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
                <span className="whitespace-nowrap">Enter CRM Workspace</span>
                <ArrowRight className="h-4 w-4 flex-shrink-0" />
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs font-semibold text-slate-500 hover:text-rose-600 px-2 py-2 whitespace-nowrap flex-shrink-0"
                title="Sign out of local workspace"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 xl:gap-2.5 flex-shrink-0 whitespace-nowrap">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 xl:px-3.5 py-2 text-xs xl:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-400 active:scale-95 transition-all whitespace-nowrap flex-shrink-0 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
              >
                <LogIn className="h-4 w-4 text-slate-500 flex-shrink-0" />
                <span className="whitespace-nowrap">Sign In to CRM</span>
              </Link>
              <Link
                href="/login?mode=register"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 xl:px-4 py-2 text-xs xl:text-sm font-semibold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all whitespace-nowrap flex-shrink-0"
              >
                <span className="whitespace-nowrap">Get Started Free</span>
                <ArrowRight className="h-4 w-4 flex-shrink-0" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 flex-shrink-0"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 space-y-4 shadow-xl dark:bg-slate-950 dark:border-slate-800">
          <div className="flex flex-col space-y-3 font-semibold text-slate-700 dark:text-slate-200 text-sm">
            <a
              href="#invoice-templates"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-blue-600 flex items-center justify-between"
            >
              <span>GST Templates & UPI QR</span>
              <span className="rounded bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5">Rule 46</span>
            </a>
            <a
              href="#what-billpilot-does"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-blue-600"
            >
              What ollaiBooks Does
            </a>
            <a
              href="#business-velocity"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-blue-600 flex items-center justify-between"
            >
              <span>Business Speed & Velocity</span>
              <span className="rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5">10x Faster</span>
            </a>
            <a
              href="#interactive-tour"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-blue-600"
            >
              Interactive Tour & Illustrations
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-blue-600"
            >
              Pricing & Plans
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="py-1.5 hover:text-blue-600"
            >
              Frequently Asked Questions
            </a>
            <Link href="/#download-app" onClick={() => setMobileMenuOpen(false)} className="py-1.5 text-blue-700 hover:text-blue-800 dark:text-blue-300 inline-flex items-center gap-2">
              <Download className="h-4 w-4" /> Get the App
            </Link>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Enter CRM Workspace</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 py-2.5 text-sm font-semibold text-slate-800"
                >
                  <LogIn className="h-4 w-4" />
                  <span>Sign In to CRM</span>
                </Link>
                <Link
                  href="/login?mode=register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-500/20"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}


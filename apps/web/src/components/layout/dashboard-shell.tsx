'use client';

import * as React from 'react';
import { DashboardSidebar } from './sidebar';
import { DashboardHeader } from './header';
import { AiVoiceActionWidget } from '@/components/ai/ai-voice-action-widget';

interface DashboardShellProps {
  children: React.ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] text-[#0F172A] relative">
      {/* 1. Desktop & Laptop Docked Sidebar (Hidden on mobile/tablet) */}
      <div className="hidden md:flex flex-shrink-0">
        <DashboardSidebar />
      </div>

      {/* 2. Mobile & Tablet Slide-Over Drawer with Backdrop */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-[270px] max-w-[85vw] bg-white shadow-2xl z-50 animate-pop-in">
            <DashboardSidebar onNavigate={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* 3. Main Application Canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <DashboardHeader
          mobileMenuOpen={mobileMenuOpen}
          onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
        />
        <main className="flex-1 w-full p-3.5 sm:p-5 md:p-6 lg:p-8 2xl:p-10 max-w-[1920px] mx-auto">
          {children}
        </main>
      </div>

      {/* 4. Global Interactive AI Voice Action Executor */}
      <AiVoiceActionWidget />
    </div>
  );
}


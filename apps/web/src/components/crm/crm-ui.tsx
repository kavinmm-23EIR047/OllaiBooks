'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const inr = (n: number) => `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export function relativeTime(iso?: string) {
  if (!iso) return '';
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const mins = Math.round(abs / 60000);
  const fmt = (v: number, unit: string) => (diff < 0 ? `${v} ${unit}${v === 1 ? '' : 's'} ago` : `in ${v} ${unit}${v === 1 ? '' : 's'}`);
  if (mins < 1) return 'just now';
  if (mins < 60) return fmt(mins, 'min');
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return fmt(hrs, 'hour');
  const days = Math.round(hrs / 24);
  if (days < 30) return fmt(days, 'day');
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const AVATAR_TONES = ['from-blue-500 to-blue-700', 'from-sky-500 to-blue-600', 'from-indigo-500 to-blue-700', 'from-slate-500 to-slate-700', 'from-cyan-600 to-blue-700'];

export function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  const tone = AVATAR_TONES[(name || '').split('').reduce((s, c) => s + c.charCodeAt(0), 0) % AVATAR_TONES.length];
  return (
    <span className={cn('inline-grid flex-shrink-0 place-items-center rounded-full bg-gradient-to-br font-bold text-white', tone)} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </span>
  );
}

const PILL_TONES = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  silver: 'bg-silver-100 text-silver-700 ring-silver-300',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  red: 'bg-rose-50 text-rose-700 ring-rose-200',
  indigo: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200',
} as const;
export type PillTone = keyof typeof PILL_TONES;

export function Pill({ tone = 'silver', children, className }: { tone?: PillTone; children: React.ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset', PILL_TONES[tone], className)}>{children}</span>;
}

export function PageHeader({
  icon: Icon, title, subtitle, actions, children,
}: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle?: string; actions?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl bg-gradient-to-br from-blue-600 to-navy-800 text-white shadow-md shadow-blue-900/20">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-[22px] font-extrabold leading-tight tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-0.5 text-[13px] text-silver-600">{subtitle}</p>}
          {children}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Btn({
  variant = 'secondary', className, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3 text-[13px] font-semibold transition-all active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50',
        variant === 'primary' && 'bg-blue-600 text-white shadow-sm shadow-blue-900/20 hover:bg-blue-700',
        variant === 'secondary' && 'border border-silver-300 bg-white text-slate-700 shadow-sm hover:border-silver-400 hover:bg-silver-50',
        variant === 'ghost' && 'text-silver-700 hover:bg-silver-100',
        variant === 'danger' && 'border border-rose-200 bg-white text-rose-600 hover:bg-rose-50',
        className,
      )}
    />
  );
}

export function StatStrip({ items }: { items: Array<{ label: string; value: React.ReactNode; hint?: string; tone?: 'blue' | 'green' | 'amber' | 'silver' }> }) {
  const tones = { blue: 'before:bg-blue-600', green: 'before:bg-emerald-500', amber: 'before:bg-amber-500', silver: 'before:bg-silver-400' };
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className={cn('relative overflow-hidden rounded-xl border border-silver-200 bg-white px-4 py-3 shadow-sm before:absolute before:inset-y-0 before:left-0 before:w-1', tones[it.tone || 'blue'])}>
          <div className="text-[11px] font-bold uppercase tracking-wider text-silver-500">{it.label}</div>
          <div className="mt-1 text-[22px] font-extrabold leading-none text-slate-900">{it.value}</div>
          {it.hint && <div className="mt-1 text-[11px] text-silver-600">{it.hint}</div>}
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ art, title, body, action }: { art?: React.ReactNode; title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      {art}
      <h3 className="mt-2 text-[16px] font-bold text-slate-900">{title}</h3>
      <p className="max-w-sm text-[13px] text-silver-600">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function Field({ label, children, hint, error, className }: { label: string; children: React.ReactNode; hint?: string; error?: string; className?: string }) {
  return (
    <label className={cn('flex flex-col gap-1', className)}>
      <span className="text-[11px] font-bold uppercase tracking-wide text-silver-600">{label}</span>
      {children}
      {error ? <span className="text-[11px] font-semibold text-rose-600">{error}</span> : hint && <span className="text-[11px] text-silver-500">{hint}</span>}
    </label>
  );
}

export const inputCls = 'h-9 w-full rounded-md border border-silver-300 bg-white px-2.5 text-[13px] text-slate-900 placeholder:text-silver-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15';

/** Right-side slide-over used for record details and create forms. */
export function SidePanel({ open, onClose, title, subtitle, children, footer, width = 560 }: {
  open: boolean; onClose: () => void; title: React.ReactNode; subtitle?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; width?: number;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close panel" className="absolute inset-0 bg-navy-900/40 backdrop-blur-[1px]" onClick={onClose} />
      <aside role="dialog" aria-modal="true" className="absolute inset-y-0 right-0 flex w-full flex-col bg-silver-50 shadow-2xl animate-[obPanelIn_.22s_ease-out]" style={{ maxWidth: width }}>
        <div className="flex items-start justify-between gap-3 border-b border-silver-200 bg-white px-5 py-4">
          <div className="min-w-0">
            <div className="truncate text-[17px] font-extrabold text-slate-900">{title}</div>
            {subtitle && <div className="mt-0.5 text-[12px] text-silver-600">{subtitle}</div>}
          </div>
          <button type="button" onClick={onClose} className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-md text-silver-500 hover:bg-silver-100 hover:text-slate-900" aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-silver-200 bg-white px-5 py-3">{footer}</div>}
      </aside>
    </div>
  );
}

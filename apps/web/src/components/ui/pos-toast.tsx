'use client';

import * as React from 'react';
import { AlertTriangle, CheckCircle2, CloudOff, Info, RefreshCw, X, XCircle, type LucideIcon } from 'lucide-react';

export type ToastKind = 'success' | 'error' | 'warning' | 'info' | 'offline' | 'sync';

export interface ToastItem {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
  duration: number;
  action?: { label: string; onClick: () => void };
}

export type NotifyFn = (
  kind: ToastKind,
  title: string,
  message?: string,
  options?: { duration?: number; action?: ToastItem['action'] },
) => void;

const ICONS: Record<ToastKind, LucideIcon> = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  offline: CloudOff,
  sync: RefreshCw,
};

const DEFAULT_TITLES: Record<ToastKind, string> = {
  success: 'Done',
  error: 'That didn’t work',
  warning: 'Heads up',
  info: 'Good to know',
  offline: 'You’re offline',
  sync: 'Syncing',
};

/** Guess a toast kind from legacy plain-text messages. */
export function inferToastKind(message: string): ToastKind {
  const m = message.toLowerCase();
  if (message.startsWith('✓') || /\b(saved|added|updated|restored|downloaded|exported|installed|synced|switched)\b/.test(m)) return 'success';
  if (/(could not|couldn’t|failed|invalid|error|blocked|allow pop-ups|cannot|exceeded)/.test(m)) return 'error';
  if (/(only \d|out of stock|enter |must be|no new|dismissed|disabled)/.test(m)) return 'warning';
  if (/offline/.test(m)) return 'offline';
  return 'info';
}

export function useToasts() {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const counter = React.useRef(0);

  const dismiss = React.useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const notify = React.useCallback<NotifyFn>((kind, title, message, options) => {
    counter.current += 1;
    const id = counter.current;
    const duration = options?.duration ?? (kind === 'error' || kind === 'offline' ? 6000 : 4200);
    setToasts((list) => {
      // Collapse identical toasts instead of stacking duplicates
      const filtered = list.filter((t) => !(t.title === title && t.message === message));
      return [...filtered, { id, kind, title, message, duration, action: options?.action }].slice(-4);
    });
  }, []);

  /** Backwards-compatible: accepts legacy plain strings. Empty string clears all toasts. */
  const legacyToast = React.useCallback((text: string) => {
    if (!text) {
      setToasts([]);
      return;
    }
    const clean = text.replace(/^✓\s*/, '');
    const kind = inferToastKind(text);
    notify(kind, DEFAULT_TITLES[kind], clean);
  }, [notify]);

  return { toasts, notify, dismiss, legacyToast };
}

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const Icon = ICONS[toast.kind];
  const [paused, setPaused] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);
  const remaining = React.useRef(toast.duration);
  const startedAt = React.useRef(Date.now());

  const close = React.useCallback(() => {
    setLeaving(true);
    window.setTimeout(() => onDismiss(toast.id), 180);
  }, [onDismiss, toast.id]);

  React.useEffect(() => {
    if (paused) return;
    startedAt.current = Date.now();
    const timer = window.setTimeout(close, remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [paused, close]);

  return (
    <div
      className={`ob-toast ob-toast-${toast.kind} ${leaving ? 'ob-toast-leave' : ''}`}
      role={toast.kind === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span className="ob-toast-icon"><Icon size={18} /></span>
      <div className="ob-toast-body">
        <b>{toast.title}</b>
        {toast.message && <p>{toast.message}</p>}
        {toast.action && (
          <button type="button" className="ob-toast-action" onClick={() => { toast.action?.onClick(); close(); }}>
            {toast.action.label}
          </button>
        )}
      </div>
      <button type="button" className="ob-toast-close" onClick={close} aria-label="Dismiss notification">
        <X size={15} />
      </button>
      <span
        className="ob-toast-progress"
        style={{ animationDuration: `${toast.duration}ms`, animationPlayState: paused ? 'paused' : 'running' }}
      />
    </div>
  );
}

export function ToastStack({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  if (!toasts.length) return null;
  return (
    <div className="ob-toast-stack" aria-live="polite">
      {toasts.map((t) => <ToastCard key={t.id} toast={t} onDismiss={onDismiss} />)}
    </div>
  );
}

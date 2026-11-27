'use client';

import * as React from 'react';
import { ToastStack, useToasts, type NotifyFn } from './pos-toast';

const ToastContext = React.createContext<NotifyFn>(() => undefined);

/** App-wide toasts (same look as the offline billing counter). */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const { toasts, notify, dismiss } = useToasts();
  return (
    <ToastContext.Provider value={notify}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useNotify() {
  return React.useContext(ToastContext);
}

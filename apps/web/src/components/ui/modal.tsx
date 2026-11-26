'use client';

import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface ModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  icon?: React.ReactNode;
}

/**
 * Standard OneBill Enterprise Form Modal (Popup Style)
 * Precision 4px/6px geometry, crisp borders, and zero gradients.
 * Uses createPortal to mount directly to document.body, ensuring it is never
 * clipped or trapped by parent transforms or overflow containers.
 */
export function Modal({
  isOpen,
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth,
  size,
  icon,
}: ModalProps) {
  const isVisible = isOpen ?? open ?? false;
  const effectiveMaxWidth = maxWidth ?? size ?? 'lg';
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background body scroll and listen for Escape key
  React.useEffect(() => {
    if (!isVisible) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isVisible, onClose]);

  if (!mounted || !isVisible) return null;

  const maxWidthMap = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
    '2xl': 'max-w-3xl',
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
      aria-modal="true"
      role="dialog"
    >
      {/* Dimmed Backdrop across entire screen */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Window */}
      <div
        className={cn(
          'relative w-full rounded-[4px] bg-white border border-[#CBD5E1] shadow-2xl overflow-hidden my-auto z-10 flex flex-col max-h-[min(90vh,720px)] animate-pop-in',
          maxWidthMap[effectiveMaxWidth]
        )}
        aria-labelledby="modal-title"
      >
        {/* Top Accent Blue Line */}
        <div className="h-[3px] bg-[#0066FF] w-full flex-shrink-0" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] px-5 py-3.5 bg-white flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0 pr-2">
            {icon && (
              <div className="h-7 w-7 rounded-[3px] bg-[#E6F4FF] text-[#0066FF] border border-[#91CAFF] flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h3 id="modal-title" className="text-[15px] sm:text-[16px] font-bold text-[#0F172A] leading-tight truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-[12px] text-[#64748B] mt-0.5 line-clamp-1">{subtitle}</p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-[3px] p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors cursor-pointer flex-shrink-0"
            title="Close dialog"
            aria-label="Close dialog"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Modal Body with smooth internal scrolling if height is constrained */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

/**
 * Standard Modal Form Field with Proper Border and Placeholder Colors
 */
export function FormField({
  label,
  required,
  error,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label className="text-[13px] font-semibold text-[#334155] block">
        {label}
        {required && <span className="text-[#DC2626] ml-1">*</span>}
      </label>
      {children}
      {error && (
        <span className="text-[12px] text-[#DC2626] font-medium block mt-1">
          {error}
        </span>
      )}
    </div>
  );
}

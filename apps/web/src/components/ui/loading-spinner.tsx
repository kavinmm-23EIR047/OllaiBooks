'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'brand' | 'pulse' | 'glow';
  label?: string;
}

/**
 * OneBill Enterprise Loading Spinner
 * Crafted with dual-tone precision arcs and smooth easing.
 */
export function LoadingSpinner({
  className,
  size = 'md',
  variant = 'brand',
  label,
  ...props
}: LoadingSpinnerProps) {
  const sizeMap = {
    xs: 'h-3.5 w-3.5',
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const strokeMap = {
    xs: 2.5,
    sm: 2.5,
    md: 3,
    lg: 3.5,
    xl: 4,
  };

  const strokeWidth = strokeMap[size];

  return (
    <div className={cn('inline-flex flex-col items-center justify-center gap-2', className)} {...props}>
      <div className={cn('relative flex items-center justify-center', sizeMap[size])}>
        {/* Outer Track Ring */}
        <svg
          className="w-full h-full animate-spin"
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle Background Track */}
          <circle
            cx="20"
            cy="20"
            r="16"
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            className="opacity-60"
          />

          {/* Primary High-Vibrancy Blue Arc */}
          <path
            d="M 20 4 A 16 16 0 0 1 36 20"
            stroke="#0066FF"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Secondary Luminous Cyan Accent Arc */}
          <path
            d="M 36 20 A 16 16 0 0 1 28 34"
            stroke="#00A3FF"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>

        {/* Ambient Center Glow on 'glow' or 'brand' variant */}
        {(variant === 'glow' || variant === 'brand') && size !== 'xs' && (
          <div className="absolute inset-1.5 rounded-full bg-[#0066FF]/10 animate-pulse pointer-events-none" />
        )}
      </div>

      {label && (
        <span className="text-[13px] font-semibold text-[#334155] animate-pulse select-none">
          {label}
        </span>
      )}
    </div>
  );
}

/**
 * Full-page or Container Skeleton Overlay Loader with OneBill Spinner
 */
export function LoadingOverlay({ message = 'Loading workspace data...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-pop-in">
      <div className="p-3.5 rounded-[6px] bg-white border border-[#E2E8F0] shadow-sm mb-3">
        <LoadingSpinner size="lg" variant="glow" />
      </div>
      <p className="text-[14px] font-semibold text-[#0F172A]">{message}</p>
      <span className="text-[12px] text-[#64748B] mt-1">Connecting to OneBill multi-tenant cluster...</span>
    </div>
  );
}


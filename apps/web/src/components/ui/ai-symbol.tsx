'use client';

import * as React from 'react';

export interface AiSymbolProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  variant?: 'solid' | 'gradient' | 'outline';
}

export function AiSymbol({ className = 'h-4 w-4', variant = 'solid', ...props }: AiSymbolProps) {
  if (variant === 'gradient') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        {...props}
      >
        <defs>
          <linearGradient id="ak-thin-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="50%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#7c3aed" />
          </linearGradient>
        </defs>
        <path
          d="M 12 4 L 20 12 M 12 4 L 4 12"
          stroke="url(#ak-thin-gradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 12 11 L 18 17 M 12 11 L 6 17"
          stroke="url(#ak-thin-gradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.8"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Outer primary chevron */}
      <path d="M 12 4 L 20 12 M 12 4 L 4 12" />
      {/* Inner secondary chevron */}
      <path d="M 12 11 L 18 17 M 12 11 L 6 17" opacity="0.8" strokeWidth="2" />
    </svg>
  );
}

export function AiSparklePair({ className = 'h-4 w-4', ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Primary chevron symbol */}
      <path d="M 9.5 3 L 17 10.5 M 9.5 3 L 2 10.5" />
      <path d="M 9.5 8.5 L 14.5 13.5 M 9.5 8.5 L 4.5 13.5" opacity="0.8" strokeWidth="1.75" />

      {/* Secondary accent top-right */}
      <path d="M 18.5 12 L 22 15.5 M 18.5 12 L 15 15.5" opacity="0.85" strokeWidth="1.5" />
    </svg>
  );
}
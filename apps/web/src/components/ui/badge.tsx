import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info';
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  // Sharp flat enterprise badge: 2px radius, accessible 12px font, high contrast
  const variants = {
    default: 'bg-[#E6F4FF] text-[#0066FF] border-[#91CAFF]',
    info: 'bg-[#E6F4FF] text-[#0066FF] border-[#91CAFF]',
    secondary: 'bg-[#F1F5F9] text-[#334155] border-[#CBD5E1]',
    destructive: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA]',
    outline: 'bg-white text-[#334155] border-[#CBD5E1]',
    success: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]',
    warning: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-[2px] border px-2 py-0.5 text-[12px] font-semibold leading-tight select-none',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge };

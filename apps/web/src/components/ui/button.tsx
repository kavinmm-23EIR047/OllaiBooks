import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    // Sharp enterprise button: 3px radius, legible 14px font, active scale pop, zero gradients
    const baseStyles =
      'inline-flex items-center justify-center whitespace-nowrap rounded-[3px] text-[14px] font-semibold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer';

    const variants = {
      default:
        'bg-[#0066FF] text-white hover:bg-[#0052CC] active:bg-[#0040A8] border-none shadow-sm hover:shadow-[0_2px_8px_rgba(0,102,255,0.25)]',
      primary:
        'bg-[#0066FF] text-white hover:bg-[#0052CC] active:bg-[#0040A8] border-none shadow-sm hover:shadow-[0_2px_8px_rgba(0,102,255,0.25)]',
      destructive:
        'bg-[#DC2626] text-white hover:bg-[#B91C1C] active:bg-[#991B1B] border-none shadow-sm hover:shadow-[0_2px_8px_rgba(220,38,38,0.25)]',
      // Brighter Secondary Action Button: Crisp White + Vibrant Sky Border & Blue Text
      outline:
        'border border-[#91CAFF] bg-white text-[#0066FF] hover:bg-[#E6F4FF] hover:border-[#0066FF] active:bg-[#BAE0FF] shadow-xs hover:shadow-[0_2px_6px_rgba(0,136,255,0.15)]',
      secondary:
        'border border-[#91CAFF] bg-white text-[#0066FF] hover:bg-[#E6F4FF] hover:border-[#0066FF] active:bg-[#BAE0FF] shadow-xs hover:shadow-[0_2px_6px_rgba(0,136,255,0.15)]',
      ghost:
        'text-[#334155] hover:bg-[#F1F5F9] hover:text-[#0F172A] active:bg-[#EEF6FF]',
      link:
        'text-[#0066FF] underline-offset-4 hover:underline font-medium p-0 h-auto',
    };

    const sizes = {
      default: 'h-[38px] px-4 text-[14px]',
      sm: 'h-[32px] px-3 text-[13px]',
      lg: 'h-[44px] px-6 text-[15px]',
      icon: 'h-[34px] w-[34px] p-0',
    };

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button };

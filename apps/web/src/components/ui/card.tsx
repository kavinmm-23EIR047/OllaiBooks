import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'modern' | 'interactive' | 'accent' | 'emerald';
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants = {
      default:
        'rounded-[6px] border border-[#E2E8F0] bg-white text-[#0F172A] shadow-xs transition-all duration-150',
      modern:
        'card-modern text-[#0F172A]',
      interactive:
        'card-modern card-accent-top cursor-pointer text-[#0F172A]',
      accent:
        'card-modern card-accent-top text-[#0F172A]',
      emerald:
        'card-modern card-accent-top card-accent-emerald text-[#0F172A]',
    };

    return (
      <div
        ref={ref}
        className={cn(variants[variant], className)}
        {...props}
      />
    );
  },
);
Card.displayName = 'Card';

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1 p-4 pb-2 sm:p-5 sm:pb-3', className)}
      {...props}
    />
  ),
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-[16px] font-bold text-[#0F172A] leading-tight tracking-tight', className)}
      {...props}
    />
  ),
);
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-[13px] text-[#475569] leading-normal', className)}
      {...props}
    />
  ),
);
CardDescription.displayName = 'CardDescription';

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4 pt-0 sm:p-5 sm:pt-0', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-4 pt-0 sm:p-5 sm:pt-0 border-t border-[#E2E8F0] mt-3', className)}
      {...props}
    />
  ),
);
CardFooter.displayName = 'CardFooter';

/**
 * Dedicated Card Note Strip Component
 * Gives cards that sleek "Note / Callout" element requested!
 */
export function CardNote({
  children,
  className,
  icon,
}: {
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'card-note-strip border-t border-[#E2E8F0] bg-[#F8FAFC] text-[12px] font-medium text-[#334155]',
        className,
      )}
    >
      {icon && <span className="flex-shrink-0 text-[#0066FF]">{icon}</span>}
      <div className="truncate flex-1">{children}</div>
    </div>
  );
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };

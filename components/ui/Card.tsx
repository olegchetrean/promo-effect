import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive';
}

export const Card = ({ children, className, variant = 'default', ...props }: CardProps) => {
  return (
    <div
      className={cn(
        'bg-white dark:bg-neutral-800 rounded-xl',
        {
          'shadow-card border border-neutral-200/50 dark:border-neutral-700/50': variant === 'default',
          'shadow-lg border border-neutral-200/50 dark:border-neutral-700/50': variant === 'elevated',
          'border-2 border-neutral-200 dark:border-neutral-700 shadow-none': variant === 'outlined',
          'shadow-card border border-neutral-200/50 dark:border-neutral-700/50 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1 cursor-pointer': variant === 'interactive',
        },
        'p-5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('text-lg font-semibold text-primary-800 dark:text-white', className)} {...props}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn('text-sm text-neutral-500 dark:text-neutral-400', className)} {...props}>
    {children}
  </p>
);

export const CardContent = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('', className)} {...props}>
    {children}
  </div>
);

export const CardFooter = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex items-center pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-700', className)} {...props}>
    {children}
  </div>
);
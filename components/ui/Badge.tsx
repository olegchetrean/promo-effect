import React from 'react';
import { cn } from '../../lib/utils';

// FIX: Changed BadgeProps to a type alias to correctly inherit all div attributes.
export type BadgeProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'default' | 'blue' | 'green' | 'red' | 'yellow' | 'purple' | 'teal' | 'orange';
};

export const Badge = ({ className, variant = 'default', ...props }: BadgeProps) => {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold transition-colors',
        variant === 'default' && 'border-transparent bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200',
        variant === 'blue' && 'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        variant === 'green' && 'border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        variant === 'red' && 'border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        variant === 'yellow' && 'border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        variant === 'purple' && 'border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        variant === 'teal' && 'border-transparent bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300',
        variant === 'orange' && 'border-transparent bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
        className
      )}
      {...props}
    />
  );
};
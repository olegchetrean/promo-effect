import React from 'react';
import { cn } from '../../lib/utils';

export const Input = ({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <input
      className={cn(
        'w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm text-sm',
        'bg-white dark:bg-neutral-800',
        'focus:ring-primary-500 focus:border-primary-500 focus:outline-none focus:ring-2',
        'transition-colors duration-200',
        className
      )}
      {...props}
    />
  );
};
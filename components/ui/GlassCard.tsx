
import React from 'react';
import { cn } from '../../lib/utils';

export const GlassCard = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div 
      className={cn(
        'backdrop-blur-lg bg-white/70',
        'border border-white/20',
        'rounded-2xl shadow-xl',
        'transition-all duration-300',
        'hover:shadow-2xl hover:scale-[1.01]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

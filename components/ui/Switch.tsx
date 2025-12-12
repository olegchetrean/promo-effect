import React from 'react';
import { cn } from '../../lib/utils';

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
}

export const Switch = ({ checked, onCheckedChange, id }: SwitchProps) => {
  return (
    <label htmlFor={id} className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        id={id}
        className="sr-only peer"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
      <div className={cn(
        "relative w-11 h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full",
        "peer peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800",
        "peer-checked:after:translate-x-full peer-checked:after:border-white",
        "after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all",
        "dark:border-neutral-600 peer-checked:bg-primary-600"
      )}></div>
    </label>
  );
};
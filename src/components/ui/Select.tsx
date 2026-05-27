import type { SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Props = SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: Props) {
  return (
    <select
      className={cn(
        'flex h-11 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-card-foreground shadow-sm',
        'focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type Props = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: Props) {
  return (
    <input
      className={cn(
        'flex h-10 w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-card-foreground',
        '[box-shadow:var(--shadow-xs)]',
        'placeholder:text-muted-foreground',
        'transition-[border-color,box-shadow] duration-150',
        'focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  );
}

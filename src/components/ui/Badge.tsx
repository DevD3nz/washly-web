import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Tone = 'default' | 'success' | 'warning' | 'danger' | 'muted';

const tones: Record<Tone, string> = {
  default: 'bg-primary/10 text-primary dark:bg-primary/20',
  success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  danger:  'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  muted:   'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
};

export function Badge({
  children,
  tone = 'default',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tracking-wide',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

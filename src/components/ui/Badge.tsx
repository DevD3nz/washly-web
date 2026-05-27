import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';

type Tone = 'default' | 'success' | 'warning' | 'muted';

const tones: Record<Tone, string> = {
  default: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300',
  success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  warning: 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200',
  muted: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
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
        'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

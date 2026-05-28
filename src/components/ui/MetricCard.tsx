import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import { Card } from './Card';

type Tone = 'teal' | 'blue' | 'violet' | 'amber' | 'rose' | 'emerald';

const iconBg: Record<Tone, string> = {
  teal:    'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  blue:    'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  violet:  'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300',
  amber:   'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  rose:    'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
  emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
};

type Props = {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: LucideIcon;
  tone?: Tone;
  className?: string;
};

export function MetricCard({ label, value, hint, icon: Icon, tone = 'teal', className }: Props) {
  return (
    <Card className={cn('flex flex-col gap-2 p-4', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {Icon && (
          <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl', iconBg[tone])}>
            <Icon className="h-4 w-4" aria-hidden />
          </span>
        )}
      </div>
      <p className="text-2xl font-bold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      {hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
    </Card>
  );
}

import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/cn';

type Props = {
  to: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  variant?: 'default' | 'primary';
};

export function QuickActionCard({
  to,
  title,
  description,
  icon: Icon,
  variant = 'default',
}: Props) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-3 rounded-2xl border p-4 transition',
        variant === 'primary'
          ? 'border-primary/20 bg-accent text-accent-foreground hover:bg-accent/80'
          : 'border-border bg-card text-card-foreground hover:bg-muted/50',
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          variant === 'primary' ? 'bg-primary/15 text-primary' : 'bg-muted text-foreground',
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block font-medium">{title}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {description}
          </span>
        )}
      </span>
    </Link>
  );
}

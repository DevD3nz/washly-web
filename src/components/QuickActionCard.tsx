import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/cn';

type Props = {
  to: string;
  title: string;
  description?: string;
  icon: LucideIcon;
  variant?: 'default' | 'primary';
};

export function QuickActionCard({ to, title, description, icon: Icon, variant = 'default' }: Props) {
  return (
    <Link
      to={to}
      className={cn(
        'group flex items-center gap-3 rounded-2xl border p-4 transition-all duration-150',
        '[box-shadow:var(--shadow-xs)] hover:[box-shadow:var(--shadow-md)]',
        variant === 'primary'
          ? 'border-primary/20 bg-primary/5 text-accent-foreground hover:bg-primary/10'
          : 'border-border bg-card text-card-foreground hover:border-primary/30',
      )}
    >
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
          variant === 'primary'
            ? 'bg-primary/15 text-primary'
            : 'bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary',
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-muted-foreground">{description}</span>
        )}
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
    </Link>
  );
}

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

type Props = {
  title: string;
  href?: string;
  linkLabel?: string;
  action?: ReactNode;
};

export function SectionHeader({ title, href, linkLabel = 'View all', action }: Props) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>
      {action}
      {href && !action && (
        <Link to={href} className="text-xs font-semibold text-primary hover:underline">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

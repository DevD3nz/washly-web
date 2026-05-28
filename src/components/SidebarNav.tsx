import { NavLink } from 'react-router-dom';
import { ownerNav, staffNav, type NavItem } from '../lib/navigation';
import { cn } from '../lib/cn';

const sideLink = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
    isActive
      ? 'bg-accent text-accent-foreground'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  );

type Props = {
  variant: 'owner' | 'staff';
  companyName?: string;
};

export function SidebarNav({ variant, companyName }: Props) {
  const items: NavItem[] = variant === 'staff' ? staffNav : ownerNav;

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <div className="border-b border-border px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          WashLy
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-foreground">
          {companyName ?? 'Dashboard'}
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={sideLink}
          >
            <item.icon className="h-5 w-5 shrink-0" aria-hidden />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

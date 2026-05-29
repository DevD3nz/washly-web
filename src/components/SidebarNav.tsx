import { NavLink } from 'react-router-dom';
import { ownerNav, riderNav, staffNav, type NavItem } from '../lib/navigation';
import { cn } from '../lib/cn';

const sideLink = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
    isActive
      ? 'bg-primary text-primary-foreground [box-shadow:0_2px_6px_rgb(13_148_136/0.35)]'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  );

type Props = {
  variant: 'owner' | 'staff' | 'rider';
  companyName?: string;
};

export function SidebarNav({ variant, companyName }: Props) {
  const items: NavItem[] =
    variant === 'rider' ? riderNav : variant === 'staff' ? staffNav : ownerNav;

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-card lg:flex">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground text-sm font-bold">
          W
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">WashLy</p>
          <p className="truncate text-sm font-semibold text-foreground">
            {companyName ?? 'Dashboard'}
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={sideLink}>
            <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-4 py-3">
        <p className="text-xs text-muted-foreground">
          {variant === 'rider'
            ? 'Rider Portal'
            : variant === 'staff'
              ? 'Staff Portal'
              : 'Owner Portal'}
        </p>
      </div>
    </aside>
  );
}

import { NavLink } from 'react-router-dom';
import { ownerNav, staffNav } from '../lib/navigation';
import { cn } from '../lib/cn';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition',
    isActive
      ? 'font-semibold text-primary'
      : 'text-muted-foreground hover:text-foreground',
  );

type Props = {
  variant: 'owner' | 'staff';
};

/** Phone & tablet portrait — hidden on `lg`+ (see SidebarNav). */
export function BottomNav({ variant }: Props) {
  const items = variant === 'staff' ? staffNav : ownerNav;

  return (
    <nav
      className={cn(
        'fixed bottom-0 inset-x-0 z-20 flex border-t border-border bg-card lg:hidden',
        'pb-[env(safe-area-inset-bottom)]',
      )}
    >
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
          <item.icon className="h-5 w-5" aria-hidden />
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}

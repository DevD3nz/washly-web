import { NavLink } from 'react-router-dom';
import { ownerNav, riderNav, staffNav } from '../lib/navigation';
import { cn } from '../lib/cn';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-all duration-150',
    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
  );

type Props = {
  variant: 'owner' | 'staff' | 'rider';
};

export function BottomNav({ variant }: Props) {
  const items =
    variant === 'rider' ? riderNav : variant === 'staff' ? staffNav : ownerNav;

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-20 flex border-t border-border bg-card/95 backdrop-blur',
        'pb-[env(safe-area-inset-bottom)]',
        '[box-shadow:0_-1px_0_var(--border),var(--shadow-lg)]',
        'lg:hidden',
      )}
    >
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
          {({ isActive }) => (
            <>
              <span
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-xl transition-all duration-150',
                  isActive ? 'bg-primary/10' : '',
                )}
              >
                <item.icon
                  className={cn('h-5 w-5 transition-all', isActive ? 'text-primary' : '')}
                  aria-hidden
                />
              </span>
              {item.label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

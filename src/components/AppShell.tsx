import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isStaffPortalRole, subscriptionStatusLabel } from '../lib/roles';
import { BottomNav } from './BottomNav';
import { SidebarNav } from './SidebarNav';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/Button';

export function AppShell() {
  const { user, account, logout } = useAuth();
  const variant = isStaffPortalRole(user?.role) ? 'staff' : 'owner';

  return (
    <div className="flex min-h-dvh bg-background">
      <SidebarNav
        variant={variant}
        companyName={account?.company_name}
      />

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-border bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-2 sm:max-w-xl md:max-w-2xl lg:max-w-none">
            <div className="min-w-0 flex-1 lg:hidden">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                WashLy
              </p>
              <h1 className="truncate text-lg font-semibold text-foreground">
                {account?.company_name ?? 'Loading…'}
              </h1>
            </div>
            <div className="hidden min-w-0 flex-1 lg:block">
              <p className="text-sm text-muted-foreground">
                Signed in as{' '}
                <span className="font-medium text-foreground">{user?.name}</span>
              </p>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => void logout()}
              >
                Logout
              </Button>
            </div>
          </div>
          {account?.subscription && (
            <p className="mx-auto mt-1 max-w-lg text-xs text-muted-foreground sm:max-w-xl md:max-w-2xl lg:max-w-none lg:px-0">
              {account.subscription.plan?.name ?? 'Plan'} ·{' '}
              {subscriptionStatusLabel(account.subscription.status)}
            </p>
          )}
        </header>

        <main className="flex-1 px-4 pb-24 pt-4 md:px-6 md:pb-24 lg:px-8 lg:pb-8">
          <div className="mx-auto w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-5xl xl:max-w-6xl">
            <Outlet />
          </div>
        </main>

        <BottomNav variant={variant} />
      </div>
    </div>
  );
}

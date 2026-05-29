import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscriptionStatusLabel } from '../lib/roles';
import { BottomNav } from './BottomNav';
import { SidebarNav } from './SidebarNav';
import { ThemeToggle } from './ThemeToggle';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

export function AppShell() {
  const { user, account, logout } = useAuth();

  const subStatus = account?.subscription.status;
  const isWarning = subStatus && ['grace', 'suspended', 'payment_pending'].includes(subStatus);
  const isTrial = subStatus === 'trial';
  const graceEndsAt = account?.subscription.grace_ends_at;
  const showGraceBanner = subStatus === 'grace' || subStatus === 'payment_pending';

  return (
    <div className="flex min-h-dvh bg-background">
      <SidebarNav variant="owner" companyName={account?.company_name} />

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        {/* Top stripe */}
        <div className="h-0.5 bg-gradient-to-r from-primary via-teal-400 to-primary/40" />

        <header className="sticky top-0.5 z-10 border-b border-border bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/85 md:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-2 sm:max-w-xl md:max-w-2xl lg:max-w-none">
            {/* Mobile: show company name */}
            <div className="min-w-0 flex-1 lg:hidden">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground">
                  W
                </span>
                <h1 className="truncate text-base font-bold text-foreground">
                  {account?.company_name ?? 'WashLy'}
                </h1>
              </div>
            </div>

            {/* Desktop: show signed-in user */}
            <div className="hidden min-w-0 flex-1 lg:flex lg:items-center lg:gap-3">
              <p className="text-sm text-muted-foreground">
                Signed in as{' '}
                <span className="font-semibold text-foreground">{user?.name}</span>
              </p>
              {isTrial && (
                <Badge tone="warning">Trial</Badge>
              )}
              {isWarning && (
                <Badge tone="danger">{subscriptionStatusLabel(subStatus)}</Badge>
              )}
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
        </header>

        {showGraceBanner && (
          <div className="border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100 md:px-6 lg:px-8">
            {subStatus === 'grace' ? (
              <span>
                Subscription grace period
                {graceEndsAt && (
                  <> until {new Date(graceEndsAt).toLocaleDateString()}</>
                )}
                . Renew to avoid suspension.
              </span>
            ) : (
              <span>Payment pending — submit proof to activate your plan.</span>
            )}{' '}
            <Link to="/subscription" className="font-semibold underline">
              View plan
            </Link>
          </div>
        )}

        <main className="flex-1 px-4 pb-28 pt-5 md:px-6 md:pb-28 lg:px-8 lg:pb-8">
          <div className="mx-auto w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-5xl xl:max-w-6xl">
            <Outlet />
          </div>
        </main>

        <BottomNav variant="owner" />
      </div>
    </div>
  );
}

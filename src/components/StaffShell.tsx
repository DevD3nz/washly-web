import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { SidebarNav } from './SidebarNav';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/Button';
import { useStaffAuth } from '../context/StaffAuthContext';

export function StaffShell() {
  const { employee, logout } = useStaffAuth();

  return (
    <div className="flex min-h-dvh bg-background">
      <SidebarNav variant="staff" companyName={employee?.branch?.name} />

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-border bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 md:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-2 sm:max-w-xl md:max-w-2xl lg:max-w-none">
            <div className="min-w-0 flex-1 lg:hidden">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                WashLy Staff
              </p>
              <h1 className="truncate text-lg font-semibold text-foreground">
                {employee?.branch?.name ?? 'Loading…'}
              </h1>
            </div>
            <div className="hidden min-w-0 flex-1 lg:block">
              <p className="text-sm text-muted-foreground">
                Signed in as{' '}
                <span className="font-medium text-foreground">
                  {employee?.name}
                </span>
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
        </header>

        <main className="flex-1 px-4 pb-24 pt-4 md:px-6 md:pb-24 lg:px-8 lg:pb-8">
          <div className="mx-auto w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-5xl xl:max-w-6xl">
            <Outlet />
          </div>
        </main>

        <BottomNav variant="staff" />
      </div>
    </div>
  );
}

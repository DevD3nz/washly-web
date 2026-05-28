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
        {/* Top stripe */}
        <div className="h-0.5 bg-gradient-to-r from-primary via-teal-400 to-primary/40" />

        <header className="sticky top-0.5 z-10 border-b border-border bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/85 md:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-2 sm:max-w-xl md:max-w-2xl lg:max-w-none">
            {/* Mobile */}
            <div className="min-w-0 flex-1 lg:hidden">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary text-[10px] font-bold text-primary-foreground">
                  W
                </span>
                <h1 className="truncate text-base font-bold text-foreground">
                  {employee?.branch?.name ?? 'WashLy Staff'}
                </h1>
              </div>
            </div>

            {/* Desktop */}
            <div className="hidden min-w-0 flex-1 lg:block">
              <p className="text-sm text-muted-foreground">
                Signed in as{' '}
                <span className="font-semibold text-foreground">{employee?.name}</span>
                {employee?.branch?.name && (
                  <span className="ml-1 text-muted-foreground">· {employee.branch.name}</span>
                )}
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

        <main className="flex-1 px-4 pb-28 pt-5 md:px-6 md:pb-28 lg:px-8 lg:pb-8">
          <div className="mx-auto w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-5xl xl:max-w-6xl">
            <Outlet />
          </div>
        </main>

        <BottomNav variant="staff" />
      </div>
    </div>
  );
}

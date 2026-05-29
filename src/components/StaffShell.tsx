import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { SidebarNav } from './SidebarNav';
import { ThemeToggle } from './ThemeToggle';
import { Button } from './ui/Button';
import { useStaffAuth } from '../context/StaffAuthContext';
import { STAFF_ATTENDANT_PATHS } from '../lib/navigation';
import { isRiderJobTitle } from '../lib/roles';

export function StaffShell() {
  const { employee, logout } = useStaffAuth();
  const location = useLocation();
  const isRider = isRiderJobTitle(employee?.job_title);

  const isAttendantOnlyRoute = STAFF_ATTENDANT_PATHS.some((path) =>
    location.pathname.startsWith(path),
  );

  if (isRider && isAttendantOnlyRoute) {
    return <Navigate to="/staff/rider/deliveries" replace />;
  }

  const navVariant = isRider ? 'rider' : 'staff';

  return (
    <div className="flex min-h-dvh bg-background">
      <SidebarNav variant={navVariant} companyName={employee?.branch?.name} />

      <div className="flex min-h-dvh min-w-0 flex-1 flex-col overflow-x-hidden">
        <div className="h-0.5 bg-gradient-to-r from-primary via-teal-400 to-primary/40" />

        <header className="sticky top-0.5 z-10 border-b border-border bg-card/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-card/85 md:px-6 lg:px-8">
          <div className="mx-auto flex w-full min-w-0 max-w-full items-center justify-between gap-2 lg:max-w-none">
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

        <main className="flex-1 min-w-0 overflow-x-hidden px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-5 md:px-6 lg:px-8 lg:pb-8">
          <div className="mx-auto w-full min-w-0 max-w-full lg:max-w-6xl xl:max-w-[90rem]">
            <Outlet />
          </div>
        </main>

        <BottomNav variant={navVariant} />
      </div>
    </div>
  );
}

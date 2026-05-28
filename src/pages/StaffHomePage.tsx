import { useCallback, useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { useStaffAuth } from '../context/StaffAuthContext';
import { fetchStaffOpenTimecard, staffClock, type StaffTimecard } from '../lib/api';

export function StaffHomePage() {
  const { employee } = useStaffAuth();
  const [timecard, setTimecard] = useState<StaffTimecard | null>(null);
  const [loadingTimecard, setLoadingTimecard] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isClockedIn =
    timecard?.clocked_in_at != null && timecard.clocked_out_at == null;

  const loadTimecard = useCallback(async () => {
    setLoadingTimecard(true);
    setError('');
    try {
      const open = await fetchStaffOpenTimecard();
      setTimecard(open);
    } catch (e) {
      setTimecard(null);
      setError(e instanceof Error ? e.message : 'Could not load timecard');
    } finally {
      setLoadingTimecard(false);
    }
  }, []);

  useEffect(() => {
    if (employee) {
      void loadTimecard();
    } else {
      setTimecard(null);
      setLoadingTimecard(false);
    }
  }, [employee, loadTimecard]);

  const onClock = useCallback(
    async (action: 'clock_in' | 'clock_out') => {
      setBusy(true);
      setError('');
      try {
        const tc = await staffClock(action);
        setTimecard(tc);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Clock action failed');
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hello, ${employee?.name ?? 'Staff'}`}
        description={
          employee?.branch?.name
            ? `${employee.branch.name} · ${employee.employee_code}`
            : 'Your branch assignment'
        }
      />

      <Card className="space-y-4 p-4">
        <h2 className="text-sm font-semibold text-foreground">Timecard</h2>
        <p className="text-sm text-muted-foreground">
          {loadingTimecard
            ? 'Loading shift status…'
            : isClockedIn
              ? 'You are clocked in.'
              : 'Clock in when your shift starts, clock out when you leave.'}
        </p>
        {timecard?.clocked_in_at && (
          <p className="text-xs text-muted-foreground">
            In: {new Date(timecard.clocked_in_at).toLocaleString()}
            {timecard.clocked_out_at &&
              ` · Out: ${new Date(timecard.clocked_out_at).toLocaleString()}`}
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={busy || loadingTimecard || isClockedIn}
            onClick={() => void onClock('clock_in')}
          >
            Clock in
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={busy || loadingTimecard || !isClockedIn}
            onClick={() => void onClock('clock_out')}
          >
            Clock out
          </Button>
        </div>
      </Card>
    </div>
  );
}

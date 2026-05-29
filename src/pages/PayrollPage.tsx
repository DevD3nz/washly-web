import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { useAuth } from '../context/AuthContext';
import { usePayroll } from '../features/payroll/hooks/usePayroll';
import type { PayrollLineKind, PayrollRun } from '../features/payroll/types';
import { api } from '../lib/api';
import { canManageBranches, isAttendantRole } from '../lib/roles';

type Branch = { id: number; name: string };

function peso(cents: number): string {
  return `₱${(cents / 100).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function kindLabel(kind: PayrollLineKind): string {
  if (kind === 'hourly') return 'Hourly';
  if (kind === 'daily_flat') return 'Daily flat';
  return 'Commission';
}

function statusTone(status: PayrollRun['status']): 'warning' | 'success' {
  return status === 'draft' ? 'warning' : 'success';
}

export function PayrollPage() {
  const { user } = useAuth();
  const canManage = canManageBranches(user?.role);
  const isAttendant = isAttendantRole(user?.role);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchFilter, setBranchFilter] = useState<number | 'all'>('all');
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().slice(0, 10));
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const branchIdForApi = branchFilter === 'all' ? null : branchFilter;

  const { runs, loading, saving, error, createFromPeriod, postPayroll } = usePayroll({
    branchId: branchIdForApi,
  });

  useEffect(() => {
    void api<Branch[]>('/branches')
      .then((rows) => {
        setBranches(rows);
        if (isAttendant && user?.branch_id) {
          setBranchFilter(user.branch_id);
        }
      })
      .catch(() => setBranches([]));
  }, [isAttendant, user?.branch_id]);

  const draftCount = useMemo(() => runs.filter((r) => r.status === 'draft').length, [runs]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    await createFromPeriod({
      period_start: periodStart,
      period_end: periodEnd,
      branch_id: branchFilter === 'all' ? null : branchFilter,
    });
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Payroll"
        description="Pay runs from closed timecards, daily rates, and rider per-drop commissions."
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-36 flex-1">
          <Label htmlFor="payroll_branch" className="text-xs">
            Branch
          </Label>
          <Select
            id="payroll_branch"
            className="mt-1"
            value={branchFilter === 'all' ? 'all' : String(branchFilter)}
            disabled={isAttendant}
            onChange={(e) => {
              const v = e.target.value;
              setBranchFilter(v === 'all' ? 'all' : Number(v));
            }}
          >
            <option value="all">All branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>
        {draftCount > 0 && (
          <Badge tone="warning">{draftCount} draft run{draftCount === 1 ? '' : 's'}</Badge>
        )}
      </div>

      {canManage && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border bg-muted/40 px-4 py-3">
            <h2 className="text-sm font-semibold">Create pay run</h2>
            <p className="text-xs text-muted-foreground">
              Builds lines from closed timecards and delivered rider drops in the period.
            </p>
          </div>
          <form className="grid gap-3 p-4 sm:grid-cols-2" onSubmit={onCreate}>
            <div>
              <Label htmlFor="period_start">Period start</Label>
              <Input
                id="period_start"
                type="date"
                required
                className="mt-1"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="period_end">Period end</Label>
              <Input
                id="period_end"
                type="date"
                required
                className="mt-1"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? 'Creating…' : 'Create draft run'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border bg-muted/40 px-4 py-3">
          <h2 className="text-sm font-semibold">Payroll runs</h2>
        </div>
        <div className="divide-y divide-border">
          {loading && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</p>
          )}
          {!loading && runs.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No payroll runs yet.
            </p>
          )}
          {runs.map((run) => (
            <div key={run.id} className="px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">
                      {run.period_start} → {run.period_end}
                    </p>
                    <Badge tone={statusTone(run.status)}>{run.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {run.branch?.name ?? 'All branches'}
                    {run.total_cents != null ? ` · ${peso(run.total_cents)} total` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {run.lines && run.lines.length > 0 && (
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-7 px-2.5 text-xs"
                      onClick={() =>
                        setExpandedId((id) => (id === run.id ? null : run.id))
                      }
                    >
                      {expandedId === run.id ? 'Hide lines' : 'View lines'}
                    </Button>
                  )}
                  {canManage && run.status === 'draft' && (
                    <Button
                      type="button"
                      className="h-7 px-2.5 text-xs"
                      disabled={saving}
                      onClick={() => void postPayroll(run.id)}
                    >
                      Post
                    </Button>
                  )}
                </div>
              </div>
              {expandedId === run.id && run.lines && (
                <ul className="mt-3 space-y-2 rounded-lg bg-muted/30 p-3">
                  {run.lines.map((line) => (
                    <li
                      key={line.id}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span>
                        {line.employee?.name ?? `Employee #${line.employee_id}`} ·{' '}
                        {kindLabel(line.kind)}
                        {line.quantity > 1 ? ` ×${line.quantity}` : ''}
                      </span>
                      <span className="font-semibold tabular-nums">{peso(line.amount_cents)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

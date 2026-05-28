import {
  Activity,
  AlertTriangle,
  Building2,
  DollarSign,
  Package,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QuickActionCard } from '../components/QuickActionCard';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { Label } from '../components/ui/Label';
import { MetricCard } from '../components/ui/MetricCard';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Select } from '../components/ui/Select';
import { useAuth } from '../context/AuthContext';
import { useCommandCenter } from '../features/command-center/hooks/useCommandCenter';
import type {
  AccountFeatureToggles,
  ReportPeriod,
} from '../features/command-center/types';
import { api } from '../lib/api';
import { subscriptionStatusLabel } from '../lib/roles';

type Branch = { id: number; name: string };

function formatPeso(cents: number): string {
  return `₱${(cents / 100).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

type ToggleRowProps = {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
};

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: ToggleRowProps) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border px-3 py-3 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
      <input
        type="checkbox"
        className="mt-1 h-4 w-4 rounded border-input accent-primary"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

export function CommandCenterPage() {
  const { user, account } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchFilter, setBranchFilter] = useState<'all' | number>('all');
  const [period, setPeriod] = useState<ReportPeriod>('today');

  const { data, loading, error, toggleBusy, updateToggle } = useCommandCenter({
    branchId: branchFilter,
    period,
  });

  useEffect(() => {
    void api<Branch[]>('/branches')
      .then(setBranches)
      .catch(() => setBranches([]));
  }, []);

  const planName = account?.subscription.plan?.name ?? 'Plan';
  const trialEnds = account?.subscription.trial_ends_at;

  const onToggle = (key: keyof AccountFeatureToggles) => (value: boolean) => {
    void updateToggle(key, value);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hi, ${user?.name?.split(' ')[0] ?? 'there'}`}
        description="Command Center — revenue pulse, branch filter, remote toggles."
      />

      {account?.subscription.status === 'trial' && trialEnds && (
        <Card className="flex items-center justify-between gap-2 border-primary/20 bg-accent px-4 py-3">
          <div>
            <p className="text-sm font-medium text-accent-foreground">
              Free trial active
            </p>
            <p className="text-xs text-muted-foreground">
              Trial ends {new Date(trialEnds).toLocaleDateString()} · {planName}
            </p>
          </div>
          <Badge tone="default">{planName}</Badge>
        </Card>
      )}

      <Card className="grid gap-3 p-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="branch_filter">Branch</Label>
          <Select
            id="branch_filter"
            className="mt-1"
            value={branchFilter === 'all' ? 'all' : String(branchFilter)}
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
        <div>
          <Label htmlFor="period_filter">Period</Label>
          <Select
            id="period_filter"
            className="mt-1"
            value={period}
            onChange={(e) => setPeriod(e.target.value as ReportPeriod)}
          >
            <option value="today">Today</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </Select>
        </div>
      </Card>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <MetricCard
          label="Revenue"
          value={loading ? '…' : formatPeso(data?.pulse.revenue_cents ?? 0)}
          hint="Settled orders in period"
          icon={DollarSign}
        />
        <MetricCard
          label="Settled"
          value={loading ? '…' : (data?.pulse.orders_settled ?? 0)}
          hint={`${data?.pulse.orders_created ?? 0} created`}
          icon={Package}
        />
        <MetricCard
          label="In progress"
          value={loading ? '…' : (data?.pulse.orders_in_progress ?? 0)}
          hint="Active pipeline"
          icon={Activity}
        />
        <MetricCard
          label="Ready"
          value={loading ? '…' : (data?.pulse.orders_ready ?? 0)}
          hint={subscriptionStatusLabel(account?.subscription.status ?? '')}
          icon={Building2}
        />
      </div>

      {data && data.compare.length > 0 && (
        <section className="space-y-3">
          <SectionHeader title="Branch compare" />
          <Card className="divide-y divide-border">
            {data.compare.map((row) => (
              <div
                key={row.branch_id}
                className="flex items-center justify-between gap-2 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium">{row.branch_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.orders_settled} settled
                  </p>
                </div>
                <p className="text-sm font-semibold tabular-nums">
                  {formatPeso(row.revenue_cents)}
                </p>
              </div>
            ))}
          </Card>
        </section>
      )}

      {data && data.alerts.length > 0 && (
        <section className="space-y-3">
          <SectionHeader title="Alerts" />
          <Card className="divide-y divide-border">
            {data.alerts.map((alert) => (
              <div
                key={alert.type}
                className="flex items-start gap-3 px-4 py-3"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p className="text-sm">{alert.message}</p>
              </div>
            ))}
          </Card>
        </section>
      )}

      <section className="space-y-3">
        <SectionHeader title="Remote toggles" />
        <p className="text-xs text-muted-foreground">
          Owner-only · enforced in later phases
        </p>
        <Card className="space-y-2 p-3">
          <ToggleRow
            label="Staff inventory editing"
            description="Allow attendants to edit inventory (Phase 5)"
            checked={data?.settings.staff_inventory_editing ?? true}
            disabled={toggleBusy || loading}
            onChange={onToggle('staff_inventory_editing')}
          />
          <ToggleRow
            label="Staff expense logging"
            description="Allow attendants to log expenses (Phase 4)"
            checked={data?.settings.staff_expense_logging ?? true}
            disabled={toggleBusy || loading}
            onChange={onToggle('staff_expense_logging')}
          />
          <ToggleRow
            label="Payroll modifications"
            description="Allow payroll edits from staff roles (Phase 6)"
            checked={data?.settings.payroll_modifications ?? true}
            disabled={toggleBusy || loading}
            onChange={onToggle('payroll_modifications')}
          />
        </Card>
      </section>

      <section className="space-y-3">
        <SectionHeader title="Quick actions" />
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            to="/branches"
            title="Branches"
            description="Locations & limits"
            icon={Building2}
            variant="primary"
          />
          <QuickActionCard
            to="/employees"
            title="Staff"
            description="Profiles, PIN, pay rates"
            icon={Users}
          />
          <QuickActionCard
            to="/activity"
            title="Activity"
            description="Audit timeline"
            icon={Activity}
          />
        </div>
      </section>

      <p className="text-center text-xs text-muted-foreground">
        <Link to="/activity" className="text-primary hover:underline">
          View full activity log
        </Link>
      </p>
    </div>
  );
}

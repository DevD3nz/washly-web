import {
  Activity,
  Building2,
  ChevronRight,
  Package,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { QuickActionCard } from '../components/QuickActionCard';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { MetricCard } from '../components/ui/MetricCard';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionHeader } from '../components/ui/SectionHeader';
import { useAuth } from '../context/AuthContext';
import { api, fetchOrdersForBranch } from '../lib/api';
import { subscriptionStatusLabel } from '../lib/roles';
import { isOrderCreatedToday } from '../types/order';

type Branch = { id: number; name: string };
type Employee = { id: number; branch_id: number; employment_status: string };
type AuditRow = {
  id: number;
  action: string;
  created_at: string;
  user?: { name: string };
};

export function OwnerHomePage() {
  const { user, account } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [staffCount, setStaffCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<AuditRow[]>([]);
  const [ordersTodayCount, setOrdersTodayCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const maxBranches = account?.subscription.plan?.max_branches;
  const maxStaffPerBranch = account?.subscription.plan?.max_staff_per_branch;
  const trialEnds = account?.subscription.trial_ends_at;
  const planName = account?.subscription.plan?.name ?? 'Plan';

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [brs, emps, logs] = await Promise.all([
          api<Branch[]>('/branches'),
          api<Employee[]>('/employees'),
          api<{ data: AuditRow[] }>('/audit-logs?per_page=5'),
        ]);
        if (cancelled) {
          return;
        }
        setBranches(brs);
        setStaffCount(
          emps.filter((e) => e.employment_status === 'active').length,
        );
        setRecentActivity(logs.data);

        const bid = user?.branch_id ?? brs[0]?.id;
        if (bid != null) {
          const orders = await fetchOrdersForBranch(bid).catch(() => []);
          if (!cancelled) {
            setOrdersTodayCount(orders.filter(isOrderCreatedToday).length);
          }
        } else if (!cancelled) {
          setOrdersTodayCount(0);
        }
      } catch {
        if (!cancelled) {
          /* keep partial UI */
          setOrdersTodayCount(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [user?.branch_id]);

  const branchLabel =
    maxBranches != null
      ? `${branches.length} / ${maxBranches}`
      : String(branches.length);

  const trialHint = trialEnds
    ? `Trial ends ${new Date(trialEnds).toLocaleDateString()}`
    : `${planName} · ${account?.subscription.status ?? ''}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hi, ${user?.name?.split(' ')[0] ?? 'there'}`}
        description="Overview sa imong laundry business."
      />

      {account?.subscription.status === 'trial' && trialEnds && (
        <Card className="flex items-center justify-between gap-2 border-primary/20 bg-accent px-4 py-3">
          <div>
            <p className="text-sm font-medium text-accent-foreground">
              Free trial active
            </p>
            <p className="text-xs text-muted-foreground">{trialHint}</p>
          </div>
          <Badge tone="default">{planName}</Badge>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <MetricCard
          label="Branches"
          value={loading ? '…' : branchLabel}
          hint={maxBranches != null ? 'Plan limit' : 'All locations'}
          icon={Building2}
        />
        <MetricCard
          label="Active staff"
          value={loading ? '…' : staffCount}
          hint={
            maxStaffPerBranch != null
              ? `Max ${maxStaffPerBranch} per branch`
              : 'PIN counter login'
          }
          icon={Users}
        />
        <MetricCard
          label="Orders today"
          value={
            loading
              ? '…'
              : ordersTodayCount ?? '—'
          }
          hint="First assigned branch lang · local date"
          icon={Package}
        />
        <MetricCard
          label="Plan"
          value={planName}
          hint={subscriptionStatusLabel(account?.subscription.status ?? '')}
          icon={Activity}
        />
      </div>

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

      <section className="space-y-3">
        <SectionHeader title="Recent activity" href="/activity" />
        <Card className="divide-y divide-border">
          {loading && (
            <p className="p-4 text-sm text-muted-foreground">Loading…</p>
          )}
          {!loading && recentActivity.length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">
              No activity yet. Actions appear here when you manage branches or
              staff.
            </p>
          )}
          {recentActivity.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between gap-2 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{row.action}</p>
                <p className="text-xs text-muted-foreground">
                  {row.user?.name ?? 'System'} ·{' '}
                  {new Date(row.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))}
          {!loading && recentActivity.length > 0 && (
            <Link
              to="/activity"
              className="flex items-center justify-center gap-1 py-3 text-xs font-medium text-primary hover:underline"
            >
              View all activity
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </Card>
      </section>
    </div>
  );
}

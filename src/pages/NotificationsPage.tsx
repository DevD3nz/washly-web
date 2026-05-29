import { Link } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionHeader } from '../components/ui/SectionHeader';
import { useNotifications } from '../features/notifications/hooks/useNotifications';

type ToggleRowProps = {
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
};

function ToggleRow({ label, description, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/50 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
      <span className="relative shrink-0">
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          className={[
            'block h-5 w-9 rounded-full transition-colors duration-200',
            checked ? 'bg-primary' : 'bg-muted-foreground/30',
          ].join(' ')}
        />
        <span
          className={[
            'absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform duration-200 [box-shadow:0_1px_3px_rgb(0_0_0/0.2)]',
            checked ? 'translate-x-4' : 'translate-x-0',
          ].join(' ')}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

function creditsHint(balance: number, reason: string | null): string {
  if (balance <= 0) {
    return reason === 'credits_exhausted'
      ? 'SMS auto-disabled — credits used up. Subscribe or renew to get more.'
      : 'No SMS credits. Pay subscription to receive credits (e.g. 500 on Standard).';
  }
  if (balance < 20) {
    return 'Low credits — SMS will stop when balance hits zero.';
  }
  return 'Each customer SMS uses 1 credit.';
}

export function NotificationsPage() {
  const { settings, loading, busy, error, updateSettings } = useNotifications();
  const noCredits = (settings?.sms_credits_balance ?? 0) <= 0;

  const onSmsMaster = (enabled: boolean) => {
    void updateSettings({ sms_enabled: enabled });
  };

  const onTrigger = (key: 'sms_trigger_order_received' | 'sms_trigger_order_ready' | 'sms_trigger_order_settled') =>
    (enabled: boolean) => {
      void updateSettings({ [key]: enabled });
    };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading notifications…</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications & SMS"
        description="Control customer SMS. Credits come with your subscription — when they run out, SMS turns off until you renew."
      />

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Card className="space-y-3 p-4">
        <SectionHeader title="SMS credits" />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-2xl font-semibold tabular-nums">
            {settings?.sms_credits_balance ?? 0}
          </span>
          <span className="text-sm text-muted-foreground">credits remaining</span>
          {noCredits && <Badge tone="warning">No credits</Badge>}
          {!settings?.sms_enabled && <Badge tone="muted">SMS off</Badge>}
        </div>
        <p className="text-xs text-muted-foreground">
          {creditsHint(settings?.sms_credits_balance ?? 0, settings?.sms_disabled_reason ?? null)}
          {settings?.sms_credits_included_on_plan
            ? ` Standard plan includes ${settings.sms_credits_included_on_plan} per payment.`
            : null}
        </p>
      </Card>

      <Card className="space-y-3 p-4">
        <SectionHeader title="SMS notifications" />
        <ToggleRow
          label="SMS enabled"
          description="Master switch. Requires credits to turn on."
          checked={settings?.sms_enabled ?? false}
          disabled={busy || (noCredits && !settings?.sms_enabled)}
          onChange={onSmsMaster}
        />
        <ToggleRow
          label="Order received (Trigger 01)"
          description="When a new order is verified at the counter."
          checked={settings?.sms_trigger_order_received ?? true}
          disabled={busy || !settings?.sms_enabled}
          onChange={onTrigger('sms_trigger_order_received')}
        />
        <ToggleRow
          label="Order ready (Trigger 02)"
          description="Pickup ready or delivery dispatch."
          checked={settings?.sms_trigger_order_ready ?? true}
          disabled={busy || !settings?.sms_enabled}
          onChange={onTrigger('sms_trigger_order_ready')}
        />
        <ToggleRow
          label="Payment & points (Trigger 03)"
          description="When order is completed and settled (Suki points text if applicable)."
          checked={settings?.sms_trigger_order_settled ?? true}
          disabled={busy || !settings?.sms_enabled}
          onChange={onTrigger('sms_trigger_order_settled')}
        />
      </Card>

      <Card className="space-y-2 p-4 text-sm">
        <SectionHeader title="Subscription & billing" />
        <p className="text-muted-foreground">
          Plan status, payment instructions, and proof upload live on the Plan page.
        </p>
        <Link to="/subscription" className="font-semibold text-primary underline">
          Open subscription page
        </Link>
      </Card>
    </div>
  );
}

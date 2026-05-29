import { useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Select } from '../components/ui/Select';
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
  const { settings, plans, proofs, loading, busy, error, updateSettings, submitProof } =
    useNotifications();
  const [planSlug, setPlanSlug] = useState('standard');
  const [reference, setReference] = useState('');
  const [amountPhp, setAmountPhp] = useState('');

  const selectedPlan = plans.find((p) => p.slug === planSlug) ?? plans[0];
  const noCredits = (settings?.sms_credits_balance ?? 0) <= 0;

  const onSmsMaster = (enabled: boolean) => {
    void updateSettings({ sms_enabled: enabled });
  };

  const onTrigger = (key: 'sms_trigger_order_received' | 'sms_trigger_order_ready' | 'sms_trigger_order_settled') =>
    (enabled: boolean) => {
      void updateSettings({ [key]: enabled });
    };

  const handleSubmitProof = () => {
    const cents = Math.round(parseFloat(amountPhp || '0') * 100);
    if (!reference.trim() || cents <= 0 || !selectedPlan) return;
    void submitProof({
      subscription_plan_slug: selectedPlan.slug,
      amount_cents: cents,
      payment_reference: reference.trim(),
    }).then(() => {
      setReference('');
      setAmountPhp('');
    });
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

      <Card className="space-y-4 p-4">
        <SectionHeader title="Subscription payment" />
        <p className="text-xs text-muted-foreground">
          Upload proof after GCash/bank transfer. Admin approval adds SMS credits.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="plan">Plan</Label>
            <Select
              id="plan"
              value={planSlug}
              onChange={(e) => setPlanSlug(e.target.value)}
            >
              {plans.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name} — {p.sms_credits_included} SMS credits
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="amount">Amount paid (PHP)</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              value={amountPhp}
              onChange={(e) => setAmountPhp(e.target.value)}
              placeholder="999.00"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="ref">Payment reference</Label>
            <Input
              id="ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="GCash ref # or bank transfer ID"
            />
          </div>
        </div>
        <Button type="button" disabled={busy} onClick={handleSubmitProof}>
          Submit payment proof
        </Button>
        {proofs.length > 0 && (
          <ul className="space-y-2 text-sm">
            {proofs.map((p) => (
              <li key={p.id} className="flex justify-between rounded-lg border border-border px-3 py-2">
                <span>
                  {p.plan?.name ?? 'Plan'} · {p.payment_reference}
                </span>
                <Badge tone={p.status === 'approved' ? 'success' : 'muted'}>{p.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

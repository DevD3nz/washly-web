import { CreditCard } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { useSubscription } from '../features/subscription/hooks/useSubscription';
import { subscriptionStatusLabel } from '../lib/roles';

export function SubscriptionPage() {
  const { data, loading, busy, error, submitProof } = useSubscription();
  const [planSlug, setPlanSlug] = useState('standard');
  const [amountPhp, setAmountPhp] = useState('');
  const [reference, setReference] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);

  const handleSubmit = () => {
    const cents = Math.round(parseFloat(amountPhp || '0') * 100);
    if (!reference.trim() || cents <= 0) {
      return;
    }
    const form = new FormData();
    form.append('subscription_plan_slug', planSlug);
    form.append('amount_cents', String(cents));
    form.append('payment_reference', reference.trim());
    if (attachment) {
      form.append('attachment', attachment);
    }
    void submitProof(form).then(() => {
      setReference('');
      setAmountPhp('');
      setAttachment(null);
    });
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading subscription…</p>;
  }

  const pi = data?.payment_instructions;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription"
        description="Plan status, payment instructions, and proof upload for WashLy billing."
      />

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Card className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          <span className="font-semibold">{data?.plan?.name ?? 'Plan'}</span>
          {data?.status && (
            <Badge tone={data.status === 'suspended' ? 'danger' : data.status === 'grace' ? 'warning' : 'default'}>
              {subscriptionStatusLabel(data.status)}
            </Badge>
          )}
        </div>
        {data?.trial_ends_at && data.status === 'trial' && (
          <p className="text-sm text-muted-foreground">
            Trial ends {new Date(data.trial_ends_at).toLocaleDateString()}
          </p>
        )}
        {data?.subscription_ends_at && (
          <p className="text-sm text-muted-foreground">
            Paid through {new Date(data.subscription_ends_at).toLocaleDateString()}
          </p>
        )}
        {data?.grace_ends_at && data.status === 'grace' && (
          <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
            Grace period until {new Date(data.grace_ends_at).toLocaleDateString()}
          </p>
        )}
        {data?.plan && (
          <p className="text-sm">
            Includes <strong>{data.plan.sms_credits_included}</strong> SMS credits per payment.
          </p>
        )}
      </Card>

      {pi && (
        <Card className="space-y-2 p-4 text-sm">
          <p className="font-semibold">Payment instructions</p>
          <p>GCash: {pi.gcash_number} ({pi.gcash_name})</p>
          <p>
            Bank: {pi.bank_name} — {pi.bank_account} ({pi.bank_account_name})
          </p>
        </Card>
      )}

      <Card className="space-y-4 p-4">
        <p className="font-semibold">Submit payment proof</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor="sub-plan">Plan</Label>
            <Select id="sub-plan" value={planSlug} onChange={(e) => setPlanSlug(e.target.value)}>
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
              <option value="enterprise">Enterprise</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="sub-amount">Amount (PHP)</Label>
            <Input
              id="sub-amount"
              type="number"
              min="0"
              step="0.01"
              value={amountPhp}
              onChange={(e) => setAmountPhp(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="sub-ref">Reference</Label>
            <Input
              id="sub-ref"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="GCash or bank reference"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="sub-file">Screenshot (optional)</Label>
            <Input
              id="sub-file"
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>
        <Button type="button" disabled={busy} onClick={handleSubmit}>
          Submit proof
        </Button>
      </Card>

      {data?.proofs && data.proofs.length > 0 && (
        <Card className="p-4">
          <p className="mb-3 font-semibold">Payment history</p>
          <ul className="space-y-2 text-sm">
            {data.proofs.map((p) => (
              <li key={p.id} className="flex justify-between rounded-lg border border-border px-3 py-2">
                <span>
                  {p.payment_reference}
                  {p.attachment_path && (
                    <span className="ml-2 text-xs text-muted-foreground">(attachment)</span>
                  )}
                </span>
                <Badge tone={p.status === 'approved' ? 'success' : p.status === 'rejected' ? 'danger' : 'muted'}>
                  {p.status}
                </Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { api } from '../lib/api';

type SetupStatus = {
  configured: boolean;
  message: string;
};

export function SetupPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<SetupStatus>('/setup')
      .then(setStatus)
      .catch((e) => setError(e instanceof Error ? e.message : 'Cannot reach API'));
  }, []);

  if (status?.configured) {
    return <Navigate to="/login" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const res = await api<{ message: string }>('/setup', {
        method: 'POST',
        body: JSON.stringify({
          company_name: companyName,
          owner_name: ownerName,
          owner_email: ownerEmail,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });
      setSuccess(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <Card className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          WashLy setup
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One-time: create your laundry business and owner account.
        </p>

        {status && !status.configured && (
          <p className="mt-3 rounded-xl border border-border bg-accent px-3 py-2 text-xs text-accent-foreground">
            Fill out this form — dili i-open ang{' '}
            <code className="rounded bg-muted px-1 font-mono text-[11px]">/api/v1/setup</code>{' '}
            sa browser address bar.
          </p>
        )}

        {success ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-primary">{success}</p>
            <Button type="button" className="w-full" onClick={() => navigate('/login')}>
              Go to login
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="company_name">Company / shop name</Label>
              <Input
                id="company_name"
                required
                className="mt-1"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="owner_name">Owner name</Label>
              <Input
                id="owner_name"
                required
                className="mt-1"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="owner_email">Owner email</Label>
              <Input
                id="owner_email"
                type="email"
                required
                autoComplete="email"
                className="mt-1"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password">Password (min 8)</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password_confirmation">Confirm password</Label>
              <Input
                id="password_confirmation"
                type="password"
                required
                autoComplete="new-password"
                className="mt-1"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
              />
            </div>
            {error && (
              <p
                className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300"
                role="alert"
              >
                {error}
              </p>
            )}
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Creating…' : 'Create account'}
            </Button>
          </form>
        )}

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already set up?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}

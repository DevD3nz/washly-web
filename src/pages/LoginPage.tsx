import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { useAuth } from '../context/AuthContext';
import { fetchSetupStatus } from '../lib/api';

export function LoginPage() {
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [setupAvailable, setSetupAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    void fetchSetupStatus()
      .then((status) => setSetupAvailable(!status.configured))
      .catch(() => setSetupAvailable(null));
  }, []);

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <Card className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Owner or manager account
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1.5"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1.5"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400" role="alert">
              {error}
            </div>
          )}

          <Button type="submit" disabled={submitting} size="lg" className="mt-2 w-full">
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <div className="mt-5 space-y-2 text-center">
          <p className="text-sm text-muted-foreground">
            <Link to="/staff/login" className="font-semibold text-primary hover:underline">
              Staff PIN login
            </Link>
            {' · '}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Sign up your laundry
            </Link>
          </p>
          {setupAvailable === false && (
            <p className="text-xs text-muted-foreground">
              New laundry shop? Use Sign up to create a separate account.
            </p>
          )}
        </div>
      </Card>
    </AuthLayout>
  );
}

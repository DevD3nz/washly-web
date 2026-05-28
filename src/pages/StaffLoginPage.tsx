import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { useStaffAuth } from '../context/StaffAuthContext';
import { cn } from '../lib/cn';

export function StaffLoginPage() {
  const { employee, loading, login } = useStaffAuth();
  const [branchId, setBranchId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [pin, setPin] = useState('');
  const [useEmployeeId, setUseEmployeeId] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && employee) {
    return <Navigate to="/staff" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const branch = Number(branchId);
      if (useEmployeeId) {
        await login({ branch_id: branch, employee_id: Number(employeeId), pin });
      } else {
        await login({ branch_id: branch, pin });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <Card className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Staff PIN</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in with your branch and PIN
        </p>

        {/* Mode toggle */}
        <div className="mt-5 flex rounded-xl border border-border bg-muted p-1">
          {[
            { label: 'Branch + PIN', value: false },
            { label: 'Employee # + PIN', value: true },
          ].map(({ label, value }) => (
            <button
              key={label}
              type="button"
              onClick={() => setUseEmployeeId(value)}
              className={cn(
                'flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150',
                useEmployeeId === value
                  ? 'bg-card text-foreground [box-shadow:var(--shadow-xs)]'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="branch_id">Branch ID</Label>
            <Input
              id="branch_id"
              inputMode="numeric"
              required
              className="mt-1.5"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
            />
          </div>

          {useEmployeeId && (
            <div>
              <Label htmlFor="employee_id">Employee #</Label>
              <Input
                id="employee_id"
                inputMode="numeric"
                required
                className="mt-1.5"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Numeric ID from your manager (not the EMP- code).
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="pin">4-digit PIN</Label>
            <Input
              id="pin"
              type="password"
              inputMode="numeric"
              pattern="\d{4}"
              maxLength={4}
              required
              autoComplete="off"
              className="mt-1.5 tracking-[0.5em] text-center text-lg font-bold"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
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

        <p className="mt-5 text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Owner / manager login
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}

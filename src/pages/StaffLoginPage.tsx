import { useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { useStaffAuth } from '../context/StaffAuthContext';

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
        await login({
          branch_id: branch,
          employee_id: Number(employeeId),
          pin,
        });
      } else {
        await login({
          branch_id: branch,
          pin,
        });
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Staff PIN
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in with branch + PIN, or branch + employee # + PIN.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              className={
                !useEmployeeId
                  ? 'font-semibold text-primary'
                  : 'text-muted-foreground'
              }
              onClick={() => setUseEmployeeId(false)}
            >
              Branch + PIN
            </button>
            <span className="text-muted-foreground">·</span>
            <button
              type="button"
              className={
                useEmployeeId
                  ? 'font-semibold text-primary'
                  : 'text-muted-foreground'
              }
              onClick={() => setUseEmployeeId(true)}
            >
              Employee # + PIN
            </button>
          </div>

          <div>
            <Label htmlFor="branch_id">Branch ID</Label>
            <Input
              id="branch_id"
              inputMode="numeric"
              required
              className="mt-1"
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
                className="mt-1"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Numeric ID from your manager (not EMP- code).
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
              className="mt-1 tracking-widest"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">
            Owner / manager login
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}

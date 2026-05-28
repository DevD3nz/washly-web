import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { useAuth } from '../context/AuthContext';
import { postRegister } from '../lib/api';

export function RegisterPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [companyName, setCompanyName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchNameEdited, setBranchNameEdited] = useState(false);
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdBranchName, setCreatedBranchName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!authLoading && user) {
    return <Navigate to="/" replace />;
  }

  function onCompanyNameChange(value: string) {
    setCompanyName(value);
    if (!branchNameEdited) {
      setBranchName(value);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const trimmedBranch = branchName.trim() || companyName.trim();
      const res = await postRegister({
        company_name: companyName.trim(),
        branch_name: trimmedBranch,
        owner_name: ownerName.trim(),
        owner_email: ownerEmail.trim(),
        password,
        password_confirmation: passwordConfirmation,
      });
      setCreatedBranchName(res.primary_branch.name);
      setSuccess(res.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <Card className="p-6 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Sign up your laundry
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a new WashLy account — your shop, main branch, and owner login.
          Each laundry business gets its own isolated data.
        </p>

        {success ? (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-primary">{success}</p>
            {createdBranchName && (
              <p className="rounded-xl border border-primary/20 bg-accent px-3 py-2 text-sm text-accent-foreground">
                Main branch: <strong>{createdBranchName}</strong>
              </p>
            )}
            <Button type="button" className="w-full" onClick={() => navigate('/login')}>
              Go to login
            </Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <Label htmlFor="company_name">Company / shop name *</Label>
              <Input
                id="company_name"
                required
                className="mt-1"
                value={companyName}
                onChange={(e) => onCompanyNameChange(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="branch_name">Main branch name *</Label>
              <Input
                id="branch_name"
                required
                className="mt-1"
                placeholder="Same as shop name by default"
                value={branchName}
                onChange={(e) => {
                  setBranchNameEdited(true);
                  setBranchName(e.target.value);
                }}
              />
            </div>
            <div>
              <Label htmlFor="owner_name">Owner name *</Label>
              <Input
                id="owner_name"
                required
                className="mt-1"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="owner_email">Owner email *</Label>
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
              <Label htmlFor="password">Password (min 8) *</Label>
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
              <Label htmlFor="password_confirmation">Confirm password *</Label>
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
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </AuthLayout>
  );
}

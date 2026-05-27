import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';

type Branch = {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
};

export function BranchesPage() {
  const { user } = useAuth();
  const canEdit = user?.role === 'owner' || user?.role === 'manager';
  const [branches, setBranches] = useState<Branch[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const data = await api<Branch[]>('/branches');
    setBranches(data);
  }, []);

  useEffect(() => {
    void load().catch((e) => setError(String(e)));
  }, [load]);

  async function onAdd(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await api('/branches', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setName('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Branches"
        description="Shop locations · plan limit applies"
      />

      {canEdit && (
        <form onSubmit={onAdd} className="flex gap-2">
          <Input
            className="flex-1"
            placeholder="New branch name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Button type="submit" className="shrink-0">
            Add
          </Button>
        </form>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <ul className="space-y-2">
        {branches.map((b) => (
          <li key={b.id}>
            <Card className="px-3 py-2">
              <p className="font-medium">{b.name}</p>
              {b.address && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {b.address}
                </p>
              )}
            </Card>
          </li>
        ))}
        {branches.length === 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No branches yet.
          </p>
        )}
      </ul>
    </div>
  );
}

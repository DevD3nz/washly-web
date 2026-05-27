import { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { api } from '../lib/api';

type AuditRow = {
  id: number;
  action: string;
  created_at: string;
  user?: { name: string; email: string };
};

type Paginated = {
  data: AuditRow[];
};

export function ActivityPage() {
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api<Paginated>('/audit-logs')
      .then((res) => setRows(res.data))
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Activity"
        description="Who did what — audit log"
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.id}>
            <Card className="px-3 py-2 text-sm">
              <p className="font-medium">{row.action}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {row.user?.name ?? 'System'} ·{' '}
                {new Date(row.created_at).toLocaleString()}
              </p>
            </Card>
          </li>
        ))}
        {rows.length === 0 && !error && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No activity yet.
          </p>
        )}
      </ul>
    </div>
  );
}

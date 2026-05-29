import { useCallback, useEffect, useState } from 'react';
import { createRun, listPayrollRuns, postRun } from '../api/payrollApi';
import type { PayrollRun, PayrollRunCreatePayload } from '../types';

type UsePayrollOptions = {
  branchId: number | null;
  statusFilter?: 'draft' | 'posted' | 'all';
};

export function usePayroll({ branchId, statusFilter = 'all' }: UsePayrollOptions) {
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params: { branch_id?: number; status?: 'draft' | 'posted' } = {};
      if (branchId != null) {
        params.branch_id = branchId;
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      setRuns(await listPayrollRuns(params));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load payroll runs');
    } finally {
      setLoading(false);
    }
  }, [branchId, statusFilter]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createFromPeriod = useCallback(
    async (payload: PayrollRunCreatePayload) => {
      setSaving(true);
      setError('');
      try {
        await createRun(payload);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create payroll run');
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  const postPayroll = useCallback(
    async (runId: number) => {
      setSaving(true);
      setError('');
      try {
        await postRun(runId);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to post payroll run');
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  return { runs, loading, saving, error, reload, createFromPeriod, postPayroll };
}

import { useCallback, useEffect, useState } from 'react';
import {
  closeCashShift,
  createExpense,
  fetchCashShifts,
  fetchDailyCloseSummary,
  fetchExpenses,
  issueExpenseValidationCode,
  openCashShift,
  postExpense,
  updateExpense,
  voidExpense,
} from '../api/expensesApi';
import type { CashShift, DailyCloseSummary, Expense, ExpenseCategory } from '../types';

type UseBranchExpensesOptions = {
  branchId: number | null;
  date?: string;
};

export function useBranchExpenses({ branchId, date }: UseBranchExpensesOptions) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [shifts, setShifts] = useState<CashShift[]>([]);
  const [dailyClose, setDailyClose] = useState<DailyCloseSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!branchId) {
      setExpenses([]);
      setShifts([]);
      setDailyClose(null);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [expenseData, shiftData, closeData] = await Promise.all([
        fetchExpenses(branchId, date),
        fetchCashShifts(branchId, date),
        fetchDailyCloseSummary(branchId, date),
      ]);
      setExpenses(expenseData);
      setShifts(shiftData);
      setDailyClose(closeData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [branchId, date]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addExpense = useCallback(
    async (payload: {
      category: ExpenseCategory;
      amount_cents: number;
      expense_date: string;
      notes?: string;
      owner_validation_code?: string;
    }) => {
      if (!branchId) {
        return;
      }
      setSaving(true);
      setError('');
      try {
        await createExpense(branchId, payload);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save expense');
      } finally {
        setSaving(false);
      }
    },
    [branchId, reload],
  );

  const openShift = useCallback(
    async (openingCashCents: number) => {
      if (!branchId) {
        return;
      }
      setSaving(true);
      setError('');
      try {
        await openCashShift(branchId, openingCashCents);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to open cash shift');
      } finally {
        setSaving(false);
      }
    },
    [branchId, reload],
  );

  const closeShift = useCallback(
    async (cashShiftId: number, closingCashCents: number) => {
      setSaving(true);
      setError('');
      try {
        await closeCashShift(cashShiftId, closingCashCents);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to close cash shift');
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  const generateValidationCode = useCallback(async (): Promise<string> => {
    if (!branchId) {
      throw new Error('Select a branch first.');
    }
    const issued = await issueExpenseValidationCode(branchId);
    return `${issued.code} (expires ${new Date(issued.expires_at).toLocaleTimeString()})`;
  }, [branchId]);

  const approveExpense = useCallback(
    async (expenseId: number) => {
      setSaving(true);
      setError('');
      try {
        await postExpense(expenseId);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to post expense');
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  const cancelExpense = useCallback(
    async (expenseId: number) => {
      setSaving(true);
      setError('');
      try {
        await voidExpense(expenseId);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to void expense');
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  const editExpense = useCallback(
    async (
      expenseId: number,
      payload: {
        category?: ExpenseCategory;
        amount_cents?: number;
        expense_date?: string;
        notes?: string | null;
      },
    ) => {
      setSaving(true);
      setError('');
      try {
        await updateExpense(expenseId, payload);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update expense');
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  return {
    expenses,
    shifts,
    dailyClose,
    loading,
    saving,
    error,
    reload,
    addExpense,
    openShift,
    closeShift,
    generateValidationCode,
    approveExpense,
    cancelExpense,
    editExpense,
  };
}

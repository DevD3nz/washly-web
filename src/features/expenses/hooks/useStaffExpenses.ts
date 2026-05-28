import { useCallback, useEffect, useState } from 'react';
import {
  closeStaffCashShift,
  createStaffExpense,
  fetchStaffCashShifts,
  fetchStaffDailyCloseSummary,
  fetchStaffExpenses,
  openStaffCashShift,
} from '../api/expensesApi';
import type { CashShift, DailyCloseSummary, Expense, ExpenseCategory } from '../types';

export function useStaffExpenses(date?: string) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [shifts, setShifts] = useState<CashShift[]>([]);
  const [dailyClose, setDailyClose] = useState<DailyCloseSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [expenseData, shiftData, closeData] = await Promise.all([
        fetchStaffExpenses(date),
        fetchStaffCashShifts(date),
        fetchStaffDailyCloseSummary(date),
      ]);
      setExpenses(expenseData);
      setShifts(shiftData);
      setDailyClose(closeData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load branch expenses');
    } finally {
      setLoading(false);
    }
  }, [date]);

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
      setSaving(true);
      setError('');
      try {
        await createStaffExpense(payload);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save expense');
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  const openShift = useCallback(
    async (openingCashCents: number) => {
      setSaving(true);
      setError('');
      try {
        await openStaffCashShift(openingCashCents);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to open cash shift');
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  const closeShift = useCallback(
    async (cashShiftId: number, closingCashCents: number) => {
      setSaving(true);
      setError('');
      try {
        await closeStaffCashShift(cashShiftId, closingCashCents);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to close cash shift');
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
    addExpense,
    openShift,
    closeShift,
  };
}

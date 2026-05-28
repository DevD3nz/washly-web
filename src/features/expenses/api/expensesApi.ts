import { api, staffApi } from '../../../lib/api';
import type { CashShift, DailyCloseSummary, Expense, ExpenseCategory } from '../types';

type ExpenseCreatePayload = {
  category: ExpenseCategory;
  amount_cents: number;
  expense_date: string;
  notes?: string;
  owner_validation_code?: string;
};

type ExpenseUpdatePayload = {
  category?: ExpenseCategory;
  amount_cents?: number;
  expense_date?: string;
  notes?: string | null;
};

export async function fetchExpenses(branchId: number, date?: string): Promise<Expense[]> {
  const query = new URLSearchParams({ branch_id: String(branchId) });
  if (date) query.set('date', date);
  const res = await api<{ data: Expense[] }>(`/expenses?${query.toString()}`);
  return res.data;
}

export async function createExpense(branchId: number, payload: ExpenseCreatePayload): Promise<Expense> {
  const res = await api<{ data: Expense }>('/expenses', {
    method: 'POST',
    body: JSON.stringify({ ...payload, branch_id: branchId }),
  });
  return res.data;
}

export async function postExpense(expenseId: number): Promise<Expense> {
  const res = await api<{ data: Expense }>(`/expenses/${expenseId}/post`, { method: 'POST' });
  return res.data;
}

export async function voidExpense(expenseId: number): Promise<Expense> {
  const res = await api<{ data: Expense }>(`/expenses/${expenseId}/void`, { method: 'POST' });
  return res.data;
}

export async function updateExpense(expenseId: number, payload: ExpenseUpdatePayload): Promise<Expense> {
  const res = await api<{ data: Expense }>(`/expenses/${expenseId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function issueExpenseValidationCode(branchId: number): Promise<{ code: string; expires_at: string }> {
  return api<{ code: string; expires_at: string }>('/expenses/validation-codes', {
    method: 'POST',
    body: JSON.stringify({ branch_id: branchId }),
  });
}

export async function fetchCashShifts(branchId: number, date?: string): Promise<CashShift[]> {
  const query = new URLSearchParams({ branch_id: String(branchId) });
  if (date) query.set('date', date);
  const res = await api<{ data: CashShift[] }>(`/cash-shifts?${query.toString()}`);
  return res.data;
}

export async function openCashShift(branchId: number, openingCashCents: number): Promise<CashShift> {
  const res = await api<{ data: CashShift }>('/cash-shifts/open', {
    method: 'POST',
    body: JSON.stringify({ branch_id: branchId, opening_cash_cents: openingCashCents }),
  });
  return res.data;
}

export async function closeCashShift(cashShiftId: number, closingCashCents: number): Promise<CashShift> {
  const res = await api<{ data: CashShift }>(`/cash-shifts/${cashShiftId}/close`, {
    method: 'POST',
    body: JSON.stringify({ closing_cash_cents: closingCashCents }),
  });
  return res.data;
}

export async function fetchDailyCloseSummary(branchId: number, date?: string): Promise<DailyCloseSummary> {
  const query = new URLSearchParams({ branch_id: String(branchId) });
  if (date) {
    query.set('date', date);
  }
  return api<DailyCloseSummary>(`/cash-shifts/daily-close?${query.toString()}`);
}

export async function fetchStaffExpenses(date?: string): Promise<Expense[]> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  const res = await staffApi<{ data: Expense[] }>(`/staff/expenses${query}`);
  return res.data;
}

export async function createStaffExpense(payload: ExpenseCreatePayload): Promise<Expense> {
  const res = await staffApi<{ data: Expense }>('/staff/expenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function fetchStaffCashShifts(date?: string): Promise<CashShift[]> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  const res = await staffApi<{ data: CashShift[] }>(`/staff/cash-shifts${query}`);
  return res.data;
}

export async function openStaffCashShift(openingCashCents: number): Promise<CashShift> {
  const res = await staffApi<{ data: CashShift }>('/staff/cash-shifts/open', {
    method: 'POST',
    body: JSON.stringify({ opening_cash_cents: openingCashCents }),
  });
  return res.data;
}

export async function closeStaffCashShift(cashShiftId: number, closingCashCents: number): Promise<CashShift> {
  const res = await staffApi<{ data: CashShift }>(`/staff/cash-shifts/${cashShiftId}/close`, {
    method: 'POST',
    body: JSON.stringify({ closing_cash_cents: closingCashCents }),
  });
  return res.data;
}

export async function fetchStaffDailyCloseSummary(date?: string): Promise<DailyCloseSummary> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  return staffApi<DailyCloseSummary>(`/staff/cash-shifts/daily-close${query}`);
}

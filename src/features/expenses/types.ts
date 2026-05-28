export type ExpenseCategory =
  | 'rent'
  | 'water_utility'
  | 'power_utility'
  | 'chemical_procurement'
  | 'lpg'
  | 'other_operational';

export type ExpenseStatus = 'pending' | 'posted' | 'void';

export type Expense = {
  id: number;
  account_id: number;
  branch_id: number;
  created_by_user_id: number | null;
  created_by_employee_id: number | null;
  category: ExpenseCategory;
  amount_cents: number;
  expense_date: string;
  notes: string | null;
  status: ExpenseStatus;
  created_at: string;
  updated_at: string;
};

export type CashShift = {
  id: number;
  account_id: number;
  branch_id: number;
  shift_date: string;
  opening_cash_cents: number;
  closing_cash_cents: number | null;
  opened_by_user_id: number | null;
  opened_by_employee_id: number | null;
  closed_by_user_id: number | null;
  closed_by_employee_id: number | null;
  opened_at: string;
  closed_at: string | null;
};

export type DailyCloseSummary = {
  date: string;
  branch_id: number;
  shift: CashShift | null;
  expenses_cents: number;
};

import { useMemo, useState, type FormEvent } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { useStaffAuth } from '../context/StaffAuthContext';
import { useStaffExpenses } from '../features/expenses/hooks/useStaffExpenses';
import { resolveCashShiftState } from '../features/expenses/cashShiftState';
import type { ExpenseCategory, ExpenseStatus } from '../features/expenses/types';

const CATEGORIES: Array<{ value: ExpenseCategory; label: string; icon: string }> = [
  { value: 'rent', label: 'Rent', icon: '🏠' },
  { value: 'water_utility', label: 'Water', icon: '💧' },
  { value: 'power_utility', label: 'Power', icon: '⚡' },
  { value: 'chemical_procurement', label: 'Chemicals', icon: '🧴' },
  { value: 'lpg', label: 'LPG', icon: '🔥' },
  { value: 'other_operational', label: 'Other', icon: '📦' },
];

function peso(cents: number): string {
  return `₱${(cents / 100).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function categoryLabel(value: ExpenseCategory): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value.replaceAll('_', ' ');
}

function categoryIcon(value: ExpenseCategory): string {
  return CATEGORIES.find((c) => c.value === value)?.icon ?? '📦';
}

function statusLabel(status: ExpenseStatus): string {
  if (status === 'pending') return 'Pending';
  if (status === 'posted') return 'Posted';
  return 'Void';
}

function statusTone(status: ExpenseStatus): 'warning' | 'success' | 'muted' {
  if (status === 'pending') return 'warning';
  if (status === 'posted') return 'success';
  return 'muted';
}

export function StaffExpensesPage() {
  const { employee } = useStaffAuth();
  const [category, setCategory] = useState<ExpenseCategory>('rent');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [amountPeso, setAmountPeso] = useState('');
  const [notes, setNotes] = useState('');
  const [ownerValidationCode, setOwnerValidationCode] = useState('');
  const [openingPeso, setOpeningPeso] = useState('');
  const [closingPeso, setClosingPeso] = useState('');

  const { expenses, shifts, dailyClose, loading, saving, error, addExpense, openShift, closeShift } =
    useStaffExpenses(date);

  const { openShift: openShiftRecord, closedShift: closedShiftRecord } = useMemo(
    () => resolveCashShiftState(shifts, dailyClose?.shift),
    [shifts, dailyClose?.shift],
  );

  async function submitExpense(e: FormEvent) {
    e.preventDefault();
    const amount = Number.parseFloat(amountPeso);
    if (!Number.isFinite(amount) || amount <= 0) return;
    await addExpense({
      category,
      amount_cents: Math.round(amount * 100),
      expense_date: date,
      notes: notes.trim() || undefined,
      owner_validation_code: ownerValidationCode.trim() || undefined,
    });
    setAmountPeso('');
    setNotes('');
    setOwnerValidationCode('');
  }

  const totalPostedToday = expenses
    .filter((e) => e.status === 'posted')
    .reduce((sum, e) => sum + e.amount_cents, 0);
  const pendingCount = expenses.filter((e) => e.status === 'pending').length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Branch Expenses"
        description={employee?.branch?.name ?? 'Your branch'}
      />

      {/* Date picker */}
      <div className="flex items-center gap-3">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-44 text-sm"
        />
        {dailyClose && (
          <span className="text-sm text-muted-foreground">
            Today's total: <strong className="text-foreground">{peso(dailyClose.expenses_cents)}</strong>
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Cash shift card */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
          <h2 className="text-sm font-semibold">Cash Shift</h2>
          <Badge tone={openShiftRecord ? 'success' : closedShiftRecord ? 'muted' : 'warning'}>
            {openShiftRecord ? '● Open' : closedShiftRecord ? '○ Closed' : '○ Not opened'}
          </Badge>
        </div>
        <div className="p-4">
          {openShiftRecord ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Opened with <strong className="text-foreground">{peso(openShiftRecord.opening_cash_cents)}</strong>
                {' '}at {new Date(openShiftRecord.opened_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Closing cash (₱)"
                  value={closingPeso}
                  onChange={(e) => setClosingPeso(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    const amount = Number.parseFloat(closingPeso);
                    if (Number.isFinite(amount) && amount >= 0) {
                      void closeShift(openShiftRecord.id, Math.round(amount * 100));
                      setClosingPeso('');
                    }
                  }}
                >
                  Close shift
                </Button>
              </div>
            </div>
          ) : closedShiftRecord ? (
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                Opened with <strong className="text-foreground">{peso(closedShiftRecord.opening_cash_cents)}</strong>
                {' '}at {new Date(closedShiftRecord.opened_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
              </p>
              {closedShiftRecord.closing_cash_cents != null && (
                <p>
                  Closed with <strong className="text-foreground">{peso(closedShiftRecord.closing_cash_cents)}</strong>
                  {closedShiftRecord.closed_at && (
                    <>
                      {' '}at {new Date(closedShiftRecord.closed_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                    </>
                  )}
                </p>
              )}
              <p className="text-xs">This date&apos;s cash shift is closed. A new shift can be opened on the next business day.</p>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="Opening cash (₱)"
                value={openingPeso}
                onChange={(e) => setOpeningPeso(e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                disabled={saving}
                onClick={() => {
                  const amount = Number.parseFloat(openingPeso);
                  if (Number.isFinite(amount) && amount >= 0) {
                    void openShift(Math.round(amount * 100));
                    setOpeningPeso('');
                  }
                }}
              >
                Open shift
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Log expense card */}
      <Card className="overflow-hidden p-0">
        <div className="border-b border-border bg-muted/40 px-4 py-3">
          <h2 className="text-sm font-semibold">Log Expense</h2>
        </div>
        <form className="grid gap-4 p-4 sm:grid-cols-2" onSubmit={submitExpense}>
          <div>
            <Label htmlFor="expense_date">Date</Label>
            <Input
              id="expense_date"
              className="mt-1"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Select
              id="category"
              className="mt-1"
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            >
              {CATEGORIES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.icon} {item.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="amount">Amount (₱)</Label>
            <Input
              id="amount"
              className="mt-1"
              type="number"
              min="0"
              step="0.01"
              required
              placeholder="0.00"
              value={amountPeso}
              onChange={(e) => setAmountPeso(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="validation_code">Owner validation code</Label>
            <Input
              id="validation_code"
              className="mt-1"
              value={ownerValidationCode}
              onChange={(e) => setOwnerValidationCode(e.target.value)}
              placeholder="Required if expense logging is off"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" className="mt-1" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
              {saving ? 'Saving…' : 'Save expense'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Expense history */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
          <h2 className="text-sm font-semibold">Expense History</h2>
          {expenses.length > 0 && (
            <span className="text-xs font-medium text-muted-foreground">
              {peso(totalPostedToday)} posted
              {pendingCount > 0 ? ` · ${pendingCount} pending` : ''}
            </span>
          )}
        </div>
        <div className="divide-y divide-border">
          {loading && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</p>
          )}
          {!loading && expenses.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No expenses logged for this date.
            </p>
          )}
          {expenses.map((expense) => (
            <div key={expense.id} className="flex items-center gap-3 px-4 py-3">
              <span className="text-xl">{categoryIcon(expense.category)}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{categoryLabel(expense.category)}</p>
                  <Badge tone={statusTone(expense.status)}>{statusLabel(expense.status)}</Badge>
                </div>
                {expense.notes && (
                  <p className="truncate text-xs text-muted-foreground">{expense.notes}</p>
                )}
              </div>
              <span className={`text-sm font-semibold tabular-nums ${expense.status === 'void' ? 'text-muted-foreground line-through' : ''}`}>
                {peso(expense.amount_cents)}
              </span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { useBranchExpenses } from '../features/expenses/hooks/useBranchExpenses';
import type { Expense, ExpenseCategory, ExpenseStatus } from '../features/expenses/types';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { canManageBranches, isAttendantRole, isOwnerRole } from '../lib/roles';
import { resolveCashShiftState } from '../features/expenses/cashShiftState';

type Branch = { id: number; name: string };

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

export function ExpensesPage() {
  const { user } = useAuth();
  const canModerateExpenses = canManageBranches(user?.role);
  const isOwner = isOwnerRole(user?.role);
  const isAttendant = isAttendantRole(user?.role);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [category, setCategory] = useState<ExpenseCategory>('rent');
  const [amountPeso, setAmountPeso] = useState('');
  const [notes, setNotes] = useState('');
  const [closingPeso, setClosingPeso] = useState('');
  const [openingPeso, setOpeningPeso] = useState('');
  const [validationCode, setValidationCode] = useState('');
  const [validationCodeInfo, setValidationCodeInfo] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editCategory, setEditCategory] = useState<ExpenseCategory>('rent');
  const [editAmountPeso, setEditAmountPeso] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const {
    expenses,
    shifts,
    dailyClose,
    loading,
    saving,
    error,
    addExpense,
    openShift,
    closeShift,
    generateValidationCode,
    approveExpense,
    cancelExpense,
    editExpense,
  } = useBranchExpenses({ branchId, date });

  useEffect(() => {
    void api<Branch[]>('/branches')
      .then((rows) => {
        setBranches(rows);
        if (isAttendant && user?.branch_id) {
          setBranchId(user.branch_id);
          return;
        }
        if (rows[0]) setBranchId(rows[0].id);
      })
      .catch(() => setBranches([]));
  }, [isAttendant, user?.branch_id]);

  const { openShift: openShiftRecord, closedShift: closedShiftRecord } = useMemo(
    () => resolveCashShiftState(shifts, dailyClose?.shift),
    [shifts, dailyClose?.shift],
  );

  const totalPostedToday = expenses
    .filter((e) => e.status === 'posted')
    .reduce((sum, e) => sum + e.amount_cents, 0);
  const pendingCount = expenses.filter((e) => e.status === 'pending').length;

  async function submitExpense(e: FormEvent) {
    e.preventDefault();
    const amount = Number.parseFloat(amountPeso);
    if (!Number.isFinite(amount) || amount <= 0) return;
    await addExpense({
      category,
      amount_cents: Math.round(amount * 100),
      expense_date: date,
      notes: notes.trim() || undefined,
      owner_validation_code: validationCode.trim() || undefined,
    });
    setAmountPeso('');
    setNotes('');
    setValidationCode('');
  }

  async function issueCode() {
    try {
      const info = await generateValidationCode();
      setValidationCodeInfo(info);
    } catch (e) {
      setValidationCodeInfo(e instanceof Error ? e.message : 'Unable to issue code');
    }
  }

  function startEdit(expense: Expense) {
    setEditingId(expense.id);
    setEditCategory(expense.category);
    setEditAmountPeso((expense.amount_cents / 100).toFixed(2));
    setEditDate(expense.expense_date);
    setEditNotes(expense.notes ?? '');
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (editingId === null) return;
    const amount = Number.parseFloat(editAmountPeso);
    if (!Number.isFinite(amount) || amount <= 0) return;
    try {
      await editExpense(editingId, {
        category: editCategory,
        amount_cents: Math.round(amount * 100),
        expense_date: editDate,
        notes: editNotes.trim() || null,
      });
      setEditingId(null);
    } catch {
      // error shown via hook
    }
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Expenses & Cash Shift"
        description="Branch expense logs, validation codes, and daily close summary."
      />

      {/* Filters row */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-36">
          <Label htmlFor="branch" className="text-xs">Branch</Label>
          <Select
            id="branch"
            className="mt-1"
            value={branchId ? String(branchId) : ''}
            disabled={isAttendant}
            onChange={(e) => setBranchId(Number(e.target.value))}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="expense_date" className="text-xs">Date</Label>
          <Input
            id="expense_date"
            className="mt-1 w-44"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        {dailyClose && (
          <div className="ml-auto text-right">
            <p className="text-xs text-muted-foreground">Total expenses</p>
            <p className="text-lg font-bold tabular-nums">{peso(dailyClose.expenses_cents)}</p>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Cash shift */}
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

        {/* Log expense */}
        <Card className="overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
            <h2 className="text-sm font-semibold">Log Expense</h2>
            {isOwner && (
              <Button type="button" variant="secondary" onClick={() => void issueCode()} className="h-7 px-2.5 text-xs">
                Issue validation code
              </Button>
            )}
          </div>
          {validationCodeInfo && (
            <div className="border-b border-border bg-amber-50 px-4 py-2 text-xs font-mono text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              {validationCodeInfo}
            </div>
          )}
          <form className="grid gap-3 p-4 sm:grid-cols-2" onSubmit={submitExpense}>
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
            <div className="sm:col-span-2">
              <Label htmlFor="owner_code">Validation code</Label>
              <Input
                id="owner_code"
                className="mt-1"
                value={validationCode}
                onChange={(e) => setValidationCode(e.target.value)}
                placeholder="Leave blank if not needed"
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
      </div>

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
              No expenses for this date.
            </p>
          )}
          {expenses.map((expense) => (
            <div key={expense.id} className="px-4 py-3">
              {editingId === expense.id ? (
                <form className="grid gap-3 sm:grid-cols-2" onSubmit={saveEdit}>
                  <div>
                    <Label htmlFor={`edit-category-${expense.id}`} className="text-xs">Category</Label>
                    <Select
                      id={`edit-category-${expense.id}`}
                      className="mt-1"
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value as ExpenseCategory)}
                    >
                      {CATEGORIES.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.icon} {item.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor={`edit-amount-${expense.id}`} className="text-xs">Amount (₱)</Label>
                    <Input
                      id={`edit-amount-${expense.id}`}
                      className="mt-1"
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      value={editAmountPeso}
                      onChange={(e) => setEditAmountPeso(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`edit-date-${expense.id}`} className="text-xs">Date</Label>
                    <Input
                      id={`edit-date-${expense.id}`}
                      className="mt-1"
                      type="date"
                      required
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`edit-notes-${expense.id}`} className="text-xs">Notes</Label>
                    <Input
                      id={`edit-notes-${expense.id}`}
                      className="mt-1"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                  <div className="flex gap-2 sm:col-span-2">
                    <Button type="submit" disabled={saving} className="h-8 px-3 text-xs">
                      {saving ? 'Saving…' : 'Save changes'}
                    </Button>
                    <Button type="button" variant="secondary" disabled={saving} className="h-8 px-3 text-xs" onClick={cancelEdit}>
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="flex items-center gap-3">
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
                  <div className="flex items-center gap-2">
                    {canModerateExpenses && expense.status !== 'void' && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-7 px-2.5 text-xs"
                        disabled={saving}
                        onClick={() => startEdit(expense)}
                      >
                        Edit
                      </Button>
                    )}
                    {canModerateExpenses && expense.status === 'pending' && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-7 px-2.5 text-xs"
                        disabled={saving}
                        onClick={() => void approveExpense(expense.id)}
                      >
                        Post
                      </Button>
                    )}
                    {canModerateExpenses && expense.status !== 'void' && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-7 px-2.5 text-xs"
                        disabled={saving}
                        onClick={() => void cancelExpense(expense.id)}
                      >
                        Void
                      </Button>
                    )}
                    <span className={`text-sm font-semibold tabular-nums ${expense.status === 'void' ? 'text-muted-foreground line-through' : ''}`}>
                      {peso(expense.amount_cents)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, UserPlus, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Select } from '../components/ui/Select';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { canManageBranches } from '../lib/roles';
import {
  employeeFormSchema,
  toEmployeePayload,
  type EmployeeFormValues,
} from '../schemas/employee';
import {
  JOB_TITLE_LABELS,
  STATUS_LABELS,
  type Employee,
  type EmploymentStatus,
  type JobTitle,
} from '../types/employee';

type Branch = { id: number; name: string };

const defaultValues: EmployeeFormValues = {
  name: '',
  branch_id: 0,
  employee_code: '',
  phone: '',
  email: '',
  job_title: 'attendant',
  employment_status: 'active',
  hire_date: '',
  pin: '',
  daily_rate: '',
  hourly_rate: '',
  commission_per_drop: '',
  notes: '',
  emergency_contact_name: '',
  emergency_contact_phone: '',
};

const EMPLOYMENT_STATUSES = ['active', 'inactive', 'on_leave'] as const;

function statusTone(status: EmploymentStatus): 'success' | 'warning' | 'muted' {
  if (status === 'active') return 'success';
  if (status === 'on_leave') return 'warning';
  return 'muted';
}

export function EmployeesPage() {
  const { user, account } = useAuth();
  const canEdit = canManageBranches(user?.role);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);

  const maxStaffPerBranch = account?.subscription.plan?.max_staff_per_branch;

  function activeCountForBranch(branchId: number): number {
    return employees.filter(
      (e) => e.branch_id === branchId && e.employment_status === 'active',
    ).length;
  }

  function isAtStaffLimit(branchId: number): boolean {
    return (
      maxStaffPerBranch != null &&
      activeCountForBranch(branchId) >= maxStaffPerBranch
    );
  }

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues,
  });

  const formBranchId = form.watch('branch_id');
  const formJobTitle = form.watch('job_title');
  const atStaffLimitForForm =
    !editingId && formBranchId > 0 && isAtStaffLimit(formBranchId);

  const loadBranches = useCallback(async (): Promise<Branch[]> => {
    const brs = await api<Branch[]>('/branches');
    setBranches(brs);
    return brs;
  }, []);

  const load = useCallback(async () => {
    const [emps, brs] = await Promise.all([
      api<Employee[]>('/employees'),
      loadBranches(),
    ]);
    setEmployees(emps);
    if (brs[0] && form.getValues('branch_id') === 0) {
      form.setValue('branch_id', brs[0].id);
    }
  }, [form, loadBranches]);

  useEffect(() => {
    void load().catch((e) => setError(String(e)));
  }, [load]);

  async function openCreate() {
    setEditingId(null);
    setError('');
    const brs = await loadBranches().catch((e) => {
      setError(e instanceof Error ? e.message : 'Failed to load branches');
      return [] as Branch[];
    });
    form.reset({
      ...defaultValues,
      branch_id: brs[0]?.id ?? 0,
    });
    setShowForm(true);
  }

  async function openEdit(emp: Employee) {
    setEditingId(emp.id);
    setError('');
    await loadBranches().catch((e) => {
      setError(e instanceof Error ? e.message : 'Failed to load branches');
    });
    form.reset({
      name: emp.name,
      branch_id: emp.branch_id,
      employee_code: emp.employee_code ?? '',
      phone: emp.phone ?? '',
      email: emp.email ?? '',
      job_title: emp.job_title,
      employment_status: emp.employment_status,
      hire_date: emp.hire_date ?? '',
      pin: '',
      daily_rate: emp.daily_rate_php != null ? String(emp.daily_rate_php) : '',
      hourly_rate: emp.hourly_rate_php != null ? String(emp.hourly_rate_php) : '',
      commission_per_drop:
        emp.commission_per_drop_php != null ? String(emp.commission_per_drop_php) : '',
      notes: emp.notes ?? '',
      emergency_contact_name: emp.emergency_contact_name ?? '',
      emergency_contact_phone: emp.emergency_contact_phone ?? '',
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    form.reset(defaultValues);
  }

  async function onSubmit(values: EmployeeFormValues) {
    setError('');
    if (!editingId && (!values.pin || !/^\d{4}$/.test(values.pin))) {
      form.setError('pin', { message: 'PIN is required for new staff' });
      return;
    }
    try {
      const body = toEmployeePayload(values, {
        pinOptional: editingId !== null,
        isUpdate: editingId !== null,
      });
      if (editingId !== null) {
        await api(`/employees/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(body),
        });
      } else {
        await api('/employees', {
          method: 'POST',
          body: JSON.stringify(body),
        });
      }
      closeForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  function onInvalid(errors: typeof form.formState.errors) {
    const first =
      errors.name?.message ??
      errors.branch_id?.message ??
      errors.email?.message ??
      errors.daily_rate?.message ??
      errors.hourly_rate?.message ??
      errors.pin?.message ??
      'Please fix the highlighted fields.';
    setError(first);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Staff"
        description={
          maxStaffPerBranch != null
            ? `Branch attendants & riders · up to ${maxStaffPerBranch} active per branch`
            : 'Branch attendants & riders · PIN counter login'
        }
        action={
          canEdit ? (
            <Button type="button" size="sm" onClick={openCreate}>
              <UserPlus className="h-4 w-4" />
              Add
            </Button>
          ) : undefined
        }
      />

      {showForm && canEdit && (
        <Card className="space-y-4 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">
              {editingId ? 'Edit employee' : 'New employee'}
            </h3>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form
            onSubmit={form.handleSubmit(onSubmit, onInvalid)}
            className="space-y-4"
          >
            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                Basic
              </p>
              <div>
                <Label htmlFor="name">Full name *</Label>
                <Input id="name" className="mt-1" {...form.register('name')} />
                {form.formState.errors.name && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="employee_code">Staff ID</Label>
                  <Input
                    id="employee_code"
                    placeholder="Auto EMP-0001"
                    className="mt-1"
                    {...form.register('employee_code')}
                  />
                </div>
                <div>
                  <Label htmlFor="hire_date">Hire date</Label>
                  <Input id="hire_date" type="date" className="mt-1" {...form.register('hire_date')} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="branch_id">Branch *</Label>
                  <Controller
                    name="branch_id"
                    control={form.control}
                    render={({ field }) => (
                      <Select
                        id="branch_id"
                        className="mt-1"
                        value={field.value > 0 ? String(field.value) : ''}
                        onChange={(e) => {
                          const next = Number(e.target.value);
                          field.onChange(Number.isNaN(next) ? 0 : next);
                        }}
                      >
                        <option value="" disabled>
                          Select branch
                        </option>
                        {branches.map((b) => (
                          <option key={b.id} value={String(b.id)}>
                            {b.name}
                          </option>
                        ))}
                      </Select>
                    )}
                  />
                  {form.formState.errors.branch_id && (
                    <p className="mt-1 text-xs text-red-600">
                      {form.formState.errors.branch_id.message}
                    </p>
                  )}
                  {branches.length === 0 && (
                    <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                      No branches yet. Add one under Branches first.
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="job_title">Role</Label>
                  <Select id="job_title" className="mt-1" {...form.register('job_title')}>
                    {(Object.keys(JOB_TITLE_LABELS) as JobTitle[]).map((key) => (
                      <option key={key} value={key}>
                        {JOB_TITLE_LABELS[key]}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="employment_status">Status</Label>
                <Select id="employment_status" className="mt-1" {...form.register('employment_status')}>
                  {EMPLOYMENT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </Select>
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                Contact
              </p>
              <div>
                <Label htmlFor="phone">Mobile</Label>
                <Input id="phone" inputMode="tel" placeholder="09xx…" className="mt-1" {...form.register('phone')} />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  className="mt-1"
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="mt-1 text-xs text-red-600">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                Pay (₱) — for Phase 6 payroll
              </p>
              <p className="text-xs text-muted-foreground">
                Optional — fill daily or hourly only, or both.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="daily_rate">Daily rate</Label>
                  <Input
                    id="daily_rate"
                    inputMode="decimal"
                    placeholder="Optional"
                    className="mt-1"
                    {...form.register('daily_rate')}
                  />
                  {form.formState.errors.daily_rate && (
                    <p className="mt-1 text-xs text-red-600">
                      {form.formState.errors.daily_rate.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="hourly_rate">Hourly rate</Label>
                  <Input
                    id="hourly_rate"
                    inputMode="decimal"
                    placeholder="Optional"
                    className="mt-1"
                    {...form.register('hourly_rate')}
                  />
                  {form.formState.errors.hourly_rate && (
                    <p className="mt-1 text-xs text-red-600">
                      {form.formState.errors.hourly_rate.message}
                    </p>
                  )}
                </div>
              </div>
              {formJobTitle === 'rider' && (
                <div>
                  <Label htmlFor="commission_per_drop">Commission per drop (₱)</Label>
                  <Input
                    id="commission_per_drop"
                    inputMode="decimal"
                    placeholder="e.g. 50 per delivered order"
                    className="mt-1"
                    {...form.register('commission_per_drop')}
                  />
                  {form.formState.errors.commission_per_drop && (
                    <p className="mt-1 text-xs text-red-600">
                      {form.formState.errors.commission_per_drop.message}
                    </p>
                  )}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                PIN & emergency
              </p>
              <div>
                <Label htmlFor="pin">
                  4-digit PIN {editingId ? '(leave blank to keep)' : '*'}
                </Label>
                <Input
                  id="pin"
                  inputMode="numeric"
                  maxLength={4}
                  className="mt-1"
                  {...form.register('pin')}
                />
                {form.formState.errors.pin && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.pin.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="emergency_contact_name">Emergency contact</Label>
                <Input id="emergency_contact_name" className="mt-1" {...form.register('emergency_contact_name')} />
              </div>
              <div>
                <Label htmlFor="emergency_contact_phone">Emergency phone</Label>
                <Input id="emergency_contact_phone" className="mt-1" {...form.register('emergency_contact_phone')} />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  rows={2}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-900"
                  {...form.register('notes')}
                />
              </div>
            </section>

            {error && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
                {error}
              </p>
            )}

            {atStaffLimitForForm && (
              <p className="text-sm text-amber-700 dark:text-amber-400">
                Staff limit reached for this branch ({maxStaffPerBranch} active).
                Upgrade to Premium for unlimited staff.
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting || atStaffLimitForForm}
            >
              {form.formState.isSubmitting ? 'Saving…' : editingId ? 'Save changes' : 'Create employee'}
            </Button>
          </form>
        </Card>
      )}

      {error && (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      <ul className="space-y-3">
        {employees.map((emp) => (
          <li key={emp.id}>
            <Card className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{emp.name}</p>
                    {emp.employee_code && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {emp.employee_code}
                      </span>
                    )}
                    <Badge tone={statusTone(emp.employment_status)}>
                      {STATUS_LABELS[emp.employment_status]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                    {JOB_TITLE_LABELS[emp.job_title]} · {emp.branch?.name}
                  </p>
                  {emp.phone && (
                    <p className="mt-1 text-xs text-slate-500">{emp.phone}</p>
                  )}
                  {(emp.daily_rate_php != null ||
                    emp.hourly_rate_php != null ||
                    emp.commission_per_drop_php != null) && (
                    <p className="mt-1 text-xs text-slate-500">
                      {emp.daily_rate_php != null && `₱${emp.daily_rate_php}/day`}
                      {emp.daily_rate_php != null && emp.hourly_rate_php != null && ' · '}
                      {emp.hourly_rate_php != null && `₱${emp.hourly_rate_php}/hr`}
                      {emp.commission_per_drop_php != null &&
                        `${emp.daily_rate_php != null || emp.hourly_rate_php != null ? ' · ' : ''}₱${emp.commission_per_drop_php}/drop`}
                    </p>
                  )}
                </div>
                {canEdit && (
                  <Button type="button" variant="ghost" className="!p-2" onClick={() => openEdit(emp)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </Card>
          </li>
        ))}
        {employees.length === 0 && (
          <p className="text-center text-sm text-slate-500">No staff yet.</p>
        )}
      </ul>
    </div>
  );
}

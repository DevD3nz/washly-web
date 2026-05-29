export type PayrollRunStatus = 'draft' | 'posted';

export type PayrollLineKind = 'hourly' | 'daily_flat' | 'commission';

export type PayrollLineEmployee = {
  id: number;
  name: string;
  employee_code: string | null;
  job_title: string;
};

export type PayrollLine = {
  id: number;
  employee_id: number;
  kind: PayrollLineKind;
  amount_cents: number;
  quantity: number;
  meta: Record<string, unknown> | null;
  employee?: PayrollLineEmployee;
};

export type PayrollRun = {
  id: number;
  account_id: number;
  branch_id: number | null;
  period_start: string;
  period_end: string;
  status: PayrollRunStatus;
  posted_at: string | null;
  created_by_user_id: number | null;
  branch?: { id: number; name: string } | null;
  lines?: PayrollLine[];
  total_cents?: number;
  created_at: string | null;
  updated_at: string | null;
};

export type PayrollRunCreatePayload = {
  period_start: string;
  period_end: string;
  branch_id?: number | null;
};

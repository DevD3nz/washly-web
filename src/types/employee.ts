export type JobTitle =
  | 'washer'
  | 'ironer'
  | 'front_desk'
  | 'driver'
  | 'supervisor'
  | 'staff'
  | 'other';

export type EmploymentStatus = 'active' | 'inactive' | 'on_leave';

export type Employee = {
  id: number;
  employee_code: string | null;
  name: string;
  branch_id: number;
  phone: string | null;
  email: string | null;
  job_title: JobTitle;
  employment_status: EmploymentStatus;
  hire_date: string | null;
  hourly_rate_php: number | null;
  daily_rate_php: number | null;
  notes: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  branch?: { id: number; name: string };
};

export const JOB_TITLE_LABELS: Record<JobTitle, string> = {
  washer: 'Washer',
  ironer: 'Ironer / Finisher',
  front_desk: 'Front desk',
  driver: 'Delivery driver',
  supervisor: 'Supervisor',
  staff: 'General staff',
  other: 'Other',
};

export const STATUS_LABELS: Record<EmploymentStatus, string> = {
  active: 'Active',
  inactive: 'Inactive',
  on_leave: 'On leave',
};

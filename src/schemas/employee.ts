import { z } from 'zod';

/** Plain string from RHF — empty means no rate. */
const optionalRateInput = z.string().refine(
  (val) => val === '' || (!Number.isNaN(Number(val)) && Number(val) >= 0),
  { message: 'Enter a valid rate' },
);

export const employeeFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  branch_id: z.number().int().positive('Select a branch'),
  employee_code: z.string().max(32).optional().or(z.literal('')),
  phone: z.string().max(32).optional().or(z.literal('')),
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  job_title: z.enum([
    'attendant',
    'rider',
    'washer',
    'ironer',
    'front_desk',
    'driver',
    'supervisor',
    'staff',
    'other',
  ]),
  employment_status: z.enum(['active', 'inactive', 'on_leave']),
  hire_date: z.string().optional().or(z.literal('')),
  pin: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{4}$/.test(v), 'PIN must be 4 digits'),
  daily_rate: optionalRateInput,
  hourly_rate: optionalRateInput,
  commission_per_drop: optionalRateInput,
  notes: z.string().max(5000).optional().or(z.literal('')),
  emergency_contact_name: z.string().max(255).optional().or(z.literal('')),
  emergency_contact_phone: z.string().max(32).optional().or(z.literal('')),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

function parseRateForPayload(
  value: string | undefined,
  allowNull: boolean,
): number | null | undefined {
  if (value === undefined || value.trim() === '') {
    return allowNull ? null : undefined;
  }
  const n = Number(value);
  if (Number.isNaN(n)) {
    return allowNull ? null : undefined;
  }
  return n;
}

export function toEmployeePayload(
  values: EmployeeFormValues,
  options: { pinOptional?: boolean; isUpdate?: boolean } = {},
) {
  const { pinOptional = false, isUpdate = false } = options;
  const body: Record<string, unknown> = {
    name: values.name,
    branch_id: values.branch_id,
    job_title: values.job_title,
    employment_status: values.employment_status,
    phone: values.phone || null,
    email: values.email.trim(),
    hire_date: values.hire_date || null,
    notes: values.notes || null,
    emergency_contact_name: values.emergency_contact_name || null,
    emergency_contact_phone: values.emergency_contact_phone || null,
  };

  if (values.employee_code?.trim()) {
    body.employee_code = values.employee_code.trim();
  }

  if (values.pin && (!pinOptional || values.pin.length === 4)) {
    body.pin = values.pin;
  }

  const commission = parseRateForPayload(values.commission_per_drop, isUpdate);

  if (isUpdate) {
    body.daily_rate = parseRateForPayload(values.daily_rate, true);
    body.hourly_rate = parseRateForPayload(values.hourly_rate, true);
    if (values.job_title === 'rider' || commission !== undefined) {
      body.commission_per_drop = commission;
    }
  } else {
    const daily = parseRateForPayload(values.daily_rate, false);
    const hourly = parseRateForPayload(values.hourly_rate, false);
    if (daily !== undefined) {
      body.daily_rate = daily;
    }
    if (hourly !== undefined) {
      body.hourly_rate = hourly;
    }
    if (values.job_title === 'rider' && commission !== undefined) {
      body.commission_per_drop = commission;
    }
  }

  return body;
}

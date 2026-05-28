import { z } from 'zod';

export const employeeFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  branch_id: z.number().int().positive('Select a branch'),
  employee_code: z.string().max(32).optional().or(z.literal('')),
  phone: z.string().max(32).optional().or(z.literal('')),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
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
  daily_rate: z.union([z.number().min(0), z.nan()]).optional(),
  hourly_rate: z.union([z.number().min(0), z.nan()]).optional(),
  notes: z.string().max(5000).optional().or(z.literal('')),
  emergency_contact_name: z.string().max(255).optional().or(z.literal('')),
  emergency_contact_phone: z.string().max(32).optional().or(z.literal('')),
});

export type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

export function toEmployeePayload(values: EmployeeFormValues, pinOptional = false) {
  const body: Record<string, unknown> = {
    name: values.name,
    branch_id: values.branch_id,
    job_title: values.job_title,
    employment_status: values.employment_status,
    phone: values.phone || null,
    email: values.email || null,
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

  if (!Number.isNaN(values.daily_rate) && values.daily_rate !== undefined) {
    body.daily_rate = values.daily_rate;
  }

  if (!Number.isNaN(values.hourly_rate) && values.hourly_rate !== undefined) {
    body.hourly_rate = values.hourly_rate;
  }

  return body;
}

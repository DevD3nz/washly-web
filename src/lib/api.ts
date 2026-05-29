import type { PayrollRun } from '../features/payroll/types';
import type { JobTitle } from '../types/employee';
import type { Order, OrderBoard } from '../types/order';

/** Use Vite proxy in dev; set full URL in production build only. */
const API_BASE =
  import.meta.env.VITE_API_URL?.trim() || '/api/v1';

const OWNER_TOKEN_KEY = 'washly_token';
const STAFF_TOKEN_KEY = 'washly_staff_token';

export type UserRole = 'owner' | 'manager' | 'attendant' | 'rider';

export type SubscriptionStatus =
  | 'trial'
  | 'payment_pending'
  | 'active'
  | 'grace'
  | 'suspended';

export type ApiUser = {
  id: number;
  account_id: number;
  branch_id: number | null;
  name: string;
  email: string;
  role: UserRole;
};

export type StaffEmployee = {
  id: number;
  account_id: number;
  branch_id: number;
  employee_code: string;
  name: string;
  job_title: JobTitle;
  branch?: { id: number; name: string };
};

export type AccountInfo = {
  id: number;
  company_name: string;
  subscription: {
    status: SubscriptionStatus | string;
    trial_ends_at: string | null;
    subscription_ends_at?: string | null;
    grace_ends_at?: string | null;
    plan: {
      slug: string;
      name: string;
      price_label: string;
      max_branches: number | null;
      max_staff_per_branch: number | null;
    } | null;
  };
};

export type OrderReceipt = {
  order_id: number;
  order_number: string;
  fulfillment_type: string;
  status: string;
  customer_name: string | null;
  customer_phone: string | null;
  branch: { id: number; name: string } | null;
  items: Array<{
    description: string;
    quantity: number;
    unit_price_cents: number | null;
    line_total_cents: number | null;
  }>;
  total_cents: number | null;
  receipt_url: string;
};

export type StaffTimecard = {
  id: number;
  branch_id: number;
  employee_id: number;
  clocked_in_at: string | null;
  clocked_out_at: string | null;
};

export type SetupStatus = {
  configured: boolean;
  message: string;
};

export type SetupResponse = {
  message: string;
  primary_branch: { id: number; name: string };
};

function ownerAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(OWNER_TOKEN_KEY);
  return token
    ? { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    : { Accept: 'application/json' };
}

function staffAuthHeaders(): HeadersInit {
  const token = localStorage.getItem(STAFF_TOKEN_KEY);
  return token
    ? { Authorization: `Bearer ${token}`, Accept: 'application/json' }
    : { Accept: 'application/json' };
}

export class ApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
  }
}

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      (body as { message?: string }).message ??
      Object.values((body as { errors?: Record<string, string[]> }).errors ?? {})
        .flat()
        .join(' ') ??
      res.statusText;
    throw new ApiRequestError(message, res.status);
  }

  return body as T;
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...ownerAuthHeaders(),
      ...(options.headers ?? {}),
    },
  });

  return parseJsonResponse<T>(res);
}

export async function staffApi<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...staffAuthHeaders(),
      ...(options.headers ?? {}),
    },
  });

  return parseJsonResponse<T>(res);
}

export function setToken(token: string | null): void {
  if (token) {
    localStorage.setItem(OWNER_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(OWNER_TOKEN_KEY);
  }
}

export function setStaffToken(token: string | null): void {
  if (token) {
    localStorage.setItem(STAFF_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(STAFF_TOKEN_KEY);
  }
}

/** Public — no auth token (setup is once per server). */
export async function fetchSetupStatus(): Promise<SetupStatus> {
  const res = await fetch(`${API_BASE}/setup`, {
    headers: { Accept: 'application/json' },
  });
  return parseJsonResponse<SetupStatus>(res);
}

export async function postRegister(body: {
  company_name: string;
  branch_name: string;
  owner_name: string;
  owner_email: string;
  password: string;
  password_confirmation: string;
}): Promise<SetupResponse> {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return parseJsonResponse<SetupResponse>(res);
}

/** Public — first shop + owner + main branch. */
export async function postSetup(body: {
  company_name: string;
  branch_name: string;
  owner_name: string;
  owner_email: string;
  password: string;
  password_confirmation: string;
}): Promise<SetupResponse> {
  const res = await fetch(`${API_BASE}/setup`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return parseJsonResponse<SetupResponse>(res);
}

export async function fetchOrderBoard(branchId: number): Promise<OrderBoard> {
  return api<OrderBoard>(`/orders/board?branch_id=${branchId}`);
}

export async function fetchOrdersForBranch(branchId: number): Promise<Order[]> {
  const res = await api<{ data: Order[] }>(`/orders?branch_id=${branchId}`);
  return res.data;
}

export async function postOrderStatus(
  orderId: number,
  status: string,
): Promise<Order> {
  const res = await api<{ data: Order }>(`/orders/${orderId}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  });
  return res.data;
}

export async function assignOrderRider(
  orderId: number,
  employeeId: number | null,
): Promise<Order> {
  const res = await api<{ data: Order }>(`/orders/${orderId}/rider`, {
    method: 'PATCH',
    body: JSON.stringify({ employee_id: employeeId }),
  });
  return res.data;
}

export async function fetchPayrollRuns(params?: {
  branch_id?: number;
  status?: 'draft' | 'posted';
}): Promise<PayrollRun[]> {
  const search = new URLSearchParams();
  if (params?.branch_id != null) {
    search.set('branch_id', String(params.branch_id));
  }
  if (params?.status) {
    search.set('status', params.status);
  }
  const q = search.toString();
  const res = await api<{ data: PayrollRun[] }>(
    `/payroll-runs${q ? `?${q}` : ''}`,
  );
  return res.data;
}

export async function createPayrollRun(body: {
  period_start: string;
  period_end: string;
  branch_id?: number | null;
}): Promise<PayrollRun> {
  const res = await api<{ data: PayrollRun }>('/payroll-runs', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return res.data;
}

export async function fetchPayrollRun(id: number): Promise<PayrollRun> {
  const res = await api<{ data: PayrollRun }>(`/payroll-runs/${id}`);
  return res.data;
}

export async function postPayrollRun(id: number): Promise<PayrollRun> {
  const res = await api<{ data: PayrollRun }>(`/payroll-runs/${id}/post`, {
    method: 'POST',
  });
  return res.data;
}

export async function fetchStaffRiderDeliveries(): Promise<Order[]> {
  const res = await staffApi<{ data: Order[] }>('/staff/rider/deliveries');
  return res.data;
}

export async function postStaffRiderOrderStatus(
  orderId: number,
  status: string,
): Promise<Order> {
  const res = await staffApi<{ data: Order }>(
    `/staff/rider/orders/${orderId}/status`,
    {
      method: 'POST',
      body: JSON.stringify({ status }),
    },
  );
  return res.data;
}

export async function staffLogin(body: {
  branch_id?: number;
  employee_id?: number;
  pin: string;
}): Promise<{ token: string; employee: StaffEmployee }> {
  return staffApi('/staff/login', {
    method: 'POST',
    body: JSON.stringify({ ...body, device_name: 'washly-web-staff' }),
  });
}

export async function staffLogout(): Promise<void> {
  await staffApi('/staff/logout', { method: 'POST' });
}

export async function staffMe(): Promise<StaffEmployee> {
  return staffApi<StaffEmployee>('/staff/me');
}

export async function fetchStaffOrderBoard(): Promise<OrderBoard> {
  return staffApi<OrderBoard>('/staff/orders/board');
}

export async function postStaffOrder(body: {
  fulfillment_type: 'pickup' | 'delivery';
  customer_type?: 'guest' | 'suki';
  customer_name?: string;
  customer_phone?: string;
  points_redeemed?: number;
  notes?: string;
  delivery_address?: string;
  delivery_neighborhood?: string;
  items: Array<{
    description: string;
    quantity?: number;
    unit_price_cents?: number;
  }>;
}): Promise<Order> {
  const res = await staffApi<{ data: Order }>('/staff/orders', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return res.data;
}

export async function postStaffOrderStatus(
  orderId: number,
  status: string,
): Promise<Order> {
  const res = await staffApi<{ data: Order }>(
    `/staff/orders/${orderId}/status`,
    {
      method: 'POST',
      body: JSON.stringify({ status }),
    },
  );
  return res.data;
}

export async function fetchStaffOrderReceipt(
  orderId: number,
): Promise<OrderReceipt> {
  return staffApi<OrderReceipt>(`/staff/orders/${orderId}/receipt`);
}

export async function fetchStaffOpenTimecard(): Promise<StaffTimecard | null> {
  const res = await staffApi<{ timecard: StaffTimecard | null }>('/staff/clock');
  return res.timecard;
}

export async function staffClock(
  action: 'clock_in' | 'clock_out',
): Promise<StaffTimecard> {
  const res = await staffApi<{ timecard: StaffTimecard }>('/staff/clock', {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
  return res.timecard;
}

import type { Order, OrderBoard } from '../types/order';

/** Use Vite proxy in dev; set full URL in production build only. */
const API_BASE =
  import.meta.env.VITE_API_URL?.trim() || '/api/v1';

const OWNER_TOKEN_KEY = 'washly_token';
const STAFF_TOKEN_KEY = 'washly_staff_token';

export type ApiUser = {
  id: number;
  account_id: number;
  branch_id: number | null;
  name: string;
  email: string;
  role: 'owner' | 'manager' | 'staff';
};

export type StaffEmployee = {
  id: number;
  account_id: number;
  branch_id: number;
  employee_code: string;
  name: string;
  branch?: { id: number; name: string };
};

export type AccountInfo = {
  id: number;
  company_name: string;
  subscription: {
    status: string;
    trial_ends_at: string | null;
    plan: {
      slug: string;
      name: string;
      price_label: string;
      max_branches: number | null;
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

async function parseJsonResponse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));

  if (!res.ok) {
    const message =
      (body as { message?: string }).message ??
      Object.values((body as { errors?: Record<string, string[]> }).errors ?? {})
        .flat()
        .join(' ') ??
      res.statusText;
    throw new Error(message);
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
  customer_name?: string;
  items: Array<{ description: string; quantity?: number }>;
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

export async function staffClock(
  action: 'clock_in' | 'clock_out',
): Promise<StaffTimecard> {
  const res = await staffApi<{ timecard: StaffTimecard }>('/staff/clock', {
    method: 'POST',
    body: JSON.stringify({ action }),
  });
  return res.timecard;
}

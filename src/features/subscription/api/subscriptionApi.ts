import { api } from '../../../lib/api';
import type { SubscriptionOverview } from '../types';

const OWNER_TOKEN_KEY = 'washly_token';

export async function fetchSubscriptionOverview(): Promise<SubscriptionOverview> {
  return api<SubscriptionOverview>('/subscription');
}

export async function submitSubscriptionPaymentProof(form: FormData): Promise<void> {
  const token = localStorage.getItem(OWNER_TOKEN_KEY);
  const res = await fetch('/api/v1/subscription/payment-proofs', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? 'Could not submit payment proof');
  }
}

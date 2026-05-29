import { api } from '../../../lib/api';
import type { NotificationSettings, PaymentProof, SubscriptionPlanCatalog } from '../types';

export async function fetchNotificationSettings(): Promise<NotificationSettings> {
  return api<NotificationSettings>('/notifications/settings');
}

export async function patchNotificationSettings(
  body: Partial<NotificationSettings>,
): Promise<NotificationSettings> {
  return api<NotificationSettings>('/notifications/settings', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlanCatalog[]> {
  const res = await api<{ plans: SubscriptionPlanCatalog[] }>('/subscription-plans');
  return res.plans.filter((p) => p.slug !== 'trial');
}

export async function fetchPaymentProofs(): Promise<PaymentProof[]> {
  const res = await api<{ proofs: PaymentProof[] }>('/subscription/payment-proofs');
  return res.proofs;
}

export async function submitPaymentProof(body: {
  subscription_plan_slug: string;
  amount_cents: number;
  payment_reference: string;
}): Promise<PaymentProof> {
  const res = await api<{ proof: PaymentProof }>('/subscription/payment-proofs', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return res.proof;
}

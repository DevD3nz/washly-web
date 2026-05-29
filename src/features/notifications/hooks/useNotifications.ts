import { useCallback, useEffect, useState } from 'react';
import {
  fetchNotificationSettings,
  fetchPaymentProofs,
  fetchSubscriptionPlans,
  patchNotificationSettings,
  submitPaymentProof,
} from '../api/notificationsApi';
import type { NotificationSettings, PaymentProof, SubscriptionPlanCatalog } from '../types';

export function useNotifications() {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlanCatalog[]>([]);
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, p, pr] = await Promise.all([
        fetchNotificationSettings(),
        fetchSubscriptionPlans(),
        fetchPaymentProofs(),
      ]);
      setSettings(s);
      setPlans(p);
      setProofs(pr);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateSettings = useCallback(
    async (patch: Partial<NotificationSettings>) => {
      setBusy(true);
      setError(null);
      try {
        const updated = await patchNotificationSettings(patch);
        setSettings(updated);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save settings');
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const submitProof = useCallback(
    async (body: {
      subscription_plan_slug: string;
      amount_cents: number;
      payment_reference: string;
    }) => {
      setBusy(true);
      setError(null);
      try {
        await submitPaymentProof(body);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not submit proof');
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [reload],
  );

  return {
    settings,
    plans,
    proofs,
    loading,
    busy,
    error,
    reload,
    updateSettings,
    submitProof,
  };
}

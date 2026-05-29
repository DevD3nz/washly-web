import { useCallback, useEffect, useState } from 'react';
import { fetchSubscriptionOverview, submitSubscriptionPaymentProof } from '../api/subscriptionApi';
import type { SubscriptionOverview } from '../types';

export function useSubscription() {
  const [data, setData] = useState<SubscriptionOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchSubscriptionOverview());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load subscription');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const submitProof = useCallback(
    async (form: FormData) => {
      setBusy(true);
      setError(null);
      try {
        await submitSubscriptionPaymentProof(form);
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

  return { data, loading, busy, error, reload, submitProof };
}

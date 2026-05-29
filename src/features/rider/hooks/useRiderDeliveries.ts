import { useCallback, useEffect, useState } from 'react';
import { fetchStaffRiderDeliveries, postStaffRiderOrderStatus } from '../../../lib/api';
import { nextOrderStatus, type Order } from '../../../types/order';

export function useRiderDeliveries() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setOrders(await fetchStaffRiderDeliveries());
    } catch (e) {
      setOrders([]);
      setError(e instanceof Error ? e.message : 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const advance = useCallback(
    async (order: Order) => {
      const next = nextOrderStatus(order);
      if (!next) {
        return;
      }
      setBusyId(order.id);
      setError('');
      try {
        await postStaffRiderOrderStatus(order.id, next);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not update delivery');
      } finally {
        setBusyId(null);
      }
    },
    [reload],
  );

  return { orders, loading, busyId, error, reload, advance };
}

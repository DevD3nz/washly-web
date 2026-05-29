import { useCallback, useEffect, useState } from 'react';
import { fetchStaffRiderDeliveries, postStaffRiderOrderStatus } from '../../../lib/api';
import { nextOrderStatus, type Order } from '../../../types/order';
import { enqueueRiderStatusUpdate, listPendingRiderUpdates } from '../offline/riderStatusQueue';
import { syncRiderStatusQueue } from '../offline/syncRiderStatusQueue';

export function useRiderDeliveries() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const refreshPendingCount = useCallback(async () => {
    const pending = await listPendingRiderUpdates();
    setPendingCount(pending.length);
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (navigator.onLine) {
        const syncResult = await syncRiderStatusQueue();
        if (syncResult.message) {
          setError(syncResult.message);
        }
      }
      setOrders(await fetchStaffRiderDeliveries());
      await refreshPendingCount();
    } catch (e) {
      setOrders([]);
      setError(e instanceof Error ? e.message : 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const onOnline = () => {
      setIsOnline(true);
      void reload();
    };
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [reload]);

  const advance = useCallback(
    async (order: Order) => {
      const next = nextOrderStatus(order);
      if (!next) {
        return;
      }
      setBusyId(order.id);
      setError('');

      if (!navigator.onLine) {
        await enqueueRiderStatusUpdate(order.id, next);
        setOrders((prev) =>
          prev.map((o) => (o.id === order.id ? { ...o, status: next } : o)),
        );
        await refreshPendingCount();
        setBusyId(null);
        return;
      }

      try {
        await postStaffRiderOrderStatus(order.id, next);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not update delivery');
      } finally {
        setBusyId(null);
      }
    },
    [reload, refreshPendingCount],
  );

  return {
    orders,
    loading,
    busyId,
    error,
    pendingCount,
    isOnline,
    reload,
    advance,
  };
}

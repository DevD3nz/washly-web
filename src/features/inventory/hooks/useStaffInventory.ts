import { useCallback, useEffect, useState } from 'react';
import {
  adjustStaffInventoryItem,
  createStaffInventoryItem,
  fetchStaffInventoryItems,
} from '../api/inventoryApi';
import type { InventoryItem, InventoryItemCreatePayload } from '../types';

export function useStaffInventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setItems(await fetchStaffInventoryItems());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addItem = useCallback(
    async (payload: InventoryItemCreatePayload) => {
      setSaving(true);
      setError('');
      try {
        await createStaffInventoryItem(payload);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create item');
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  const adjustItem = useCallback(
    async (itemId: number, deltaUnits: number, notes?: string) => {
      setSaving(true);
      setError('');
      try {
        await adjustStaffInventoryItem(itemId, deltaUnits, notes);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to adjust stock');
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  return { items, loading, saving, error, reload, addItem, adjustItem };
}

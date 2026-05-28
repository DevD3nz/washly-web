import { useCallback, useEffect, useState } from 'react';
import {
  adjustInventoryItem,
  createInventoryItem,
  deleteInventoryItem,
  fetchInventoryItems,
  updateInventoryItem,
} from '../api/inventoryApi';
import type { InventoryItem, InventoryItemCreatePayload, InventoryItemUpdatePayload } from '../types';

type UseBranchInventoryOptions = {
  branchId: number | null;
};

export function useBranchInventory({ branchId }: UseBranchInventoryOptions) {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    if (!branchId) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      setItems(await fetchInventoryItems(branchId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addItem = useCallback(
    async (payload: InventoryItemCreatePayload) => {
      if (!branchId) return;
      setSaving(true);
      setError('');
      try {
        await createInventoryItem(branchId, payload);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to create item');
      } finally {
        setSaving(false);
      }
    },
    [branchId, reload],
  );

  const editItem = useCallback(
    async (itemId: number, payload: InventoryItemUpdatePayload) => {
      setSaving(true);
      setError('');
      try {
        await updateInventoryItem(itemId, payload);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to update item');
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  const removeItem = useCallback(
    async (itemId: number) => {
      setSaving(true);
      setError('');
      try {
        await deleteInventoryItem(itemId);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to delete item');
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
        await adjustInventoryItem(itemId, deltaUnits, notes);
        await reload();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to adjust stock');
      } finally {
        setSaving(false);
      }
    },
    [reload],
  );

  return { items, loading, saving, error, reload, addItem, editItem, removeItem, adjustItem };
}

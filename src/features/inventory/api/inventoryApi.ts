import { api, staffApi } from '../../../lib/api';
import type {
  InventoryAdjustment,
  InventoryItem,
  InventoryItemCreatePayload,
  InventoryItemUpdatePayload,
} from '../types';

export async function fetchInventoryItems(branchId: number): Promise<InventoryItem[]> {
  const res = await api<{ data: InventoryItem[] }>(`/inventory?branch_id=${branchId}`);
  return res.data;
}

export async function createInventoryItem(
  branchId: number,
  payload: InventoryItemCreatePayload,
): Promise<InventoryItem> {
  const res = await api<{ data: InventoryItem }>('/inventory', {
    method: 'POST',
    body: JSON.stringify({ ...payload, branch_id: branchId }),
  });
  return res.data;
}

export async function updateInventoryItem(
  itemId: number,
  payload: InventoryItemUpdatePayload,
): Promise<InventoryItem> {
  const res = await api<{ data: InventoryItem }>(`/inventory/${itemId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function deleteInventoryItem(itemId: number): Promise<void> {
  await api(`/inventory/${itemId}`, { method: 'DELETE' });
}

export async function adjustInventoryItem(
  itemId: number,
  deltaUnits: number,
  notes?: string,
): Promise<InventoryItem> {
  const res = await api<{ data: InventoryItem }>(`/inventory/${itemId}/adjust`, {
    method: 'POST',
    body: JSON.stringify({ delta_units: deltaUnits, notes }),
  });
  return res.data;
}

export async function fetchInventoryAdjustments(itemId: number): Promise<InventoryAdjustment[]> {
  const res = await api<{ data: InventoryAdjustment[] }>(`/inventory/${itemId}/adjustments`);
  return res.data;
}

export async function fetchStaffInventoryItems(): Promise<InventoryItem[]> {
  const res = await staffApi<{ data: InventoryItem[] }>('/staff/inventory');
  return res.data;
}

export async function createStaffInventoryItem(payload: InventoryItemCreatePayload): Promise<InventoryItem> {
  const res = await staffApi<{ data: InventoryItem }>('/staff/inventory', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return res.data;
}

export async function adjustStaffInventoryItem(
  itemId: number,
  deltaUnits: number,
  notes?: string,
): Promise<InventoryItem> {
  const res = await staffApi<{ data: InventoryItem }>(`/staff/inventory/${itemId}/adjust`, {
    method: 'POST',
    body: JSON.stringify({ delta_units: deltaUnits, notes }),
  });
  return res.data;
}

export type InventoryItem = {
  id: number;
  account_id: number;
  branch_id: number;
  name: string;
  unit: string;
  quantity_units: number;
  reorder_level: number;
  consumption_per_order: number;
  is_low_stock: boolean;
  created_at: string;
  updated_at: string;
};

export type InventoryAdjustment = {
  id: number;
  inventory_item_id: number;
  order_id: number | null;
  delta_units: number;
  quantity_after: number;
  reason: string;
  notes: string | null;
  created_by_user_id: number | null;
  created_by_employee_id: number | null;
  created_at: string;
};

export type InventoryItemCreatePayload = {
  name: string;
  unit: string;
  quantity_units: number;
  reorder_level: number;
  consumption_per_order: number;
  notes?: string;
};

export type InventoryItemUpdatePayload = {
  name?: string;
  unit?: string;
  reorder_level?: number;
  consumption_per_order?: number;
};

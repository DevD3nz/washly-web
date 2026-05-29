export const PRODUCTION_STATUSES = ['received', 'washing', 'drying', 'ready'] as const;

export const PICKUP_STATUSES = [...PRODUCTION_STATUSES, 'claimed'] as const;

/** Full backend chain for delivery orders. */
export const DELIVERY_FLOW_STATUSES = [...PRODUCTION_STATUSES, 'out', 'delivered'] as const;

/** Delivery dispatch board columns (after production / ready). */
export const DELIVERY_DISPATCH_STATUSES = ['out', 'delivered'] as const;

export type FulfillmentType = 'pickup' | 'delivery';

export type PickupStatus = (typeof PICKUP_STATUSES)[number];
export type DeliveryDispatchStatus = (typeof DELIVERY_DISPATCH_STATUSES)[number];

export type OrderCustomerEmbed = {
  id: number;
  type: 'guest' | 'suki';
  name: string | null;
  phone: string;
  points_balance: number;
};

export type OrderItem = {
  id: number;
  description: string;
  quantity: number;
  unit_price_cents: number | null;
};

export type OrderBranchEmbed = {
  id: number;
  name: string;
};

export type OrderRiderEmbed = {
  id: number;
  name: string;
  employee_code: string | null;
};

export type Order = {
  id: number;
  account_id: number;
  branch_id: number;
  order_number: string | null;
  fulfillment_type: FulfillmentType;
  status: string;
  customer_name: string | null;
  customer_phone: string | null;
  points_redeemed: number | null;
  points_accrued: number | null;
  settled_at: string | null;
  customer?: OrderCustomerEmbed | null;
  notes: string | null;
  delivery_address: string | null;
  delivery_neighborhood: string | null;
  rider_employee_id: number | null;
  rider?: OrderRiderEmbed | null;
  items?: OrderItem[];
  branch?: OrderBranchEmbed;
  created_at: string | null;
  updated_at: string | null;
};

export type OrderBoard = {
  branch_id: number;
  pickup: Record<string, Order[]>;
  delivery: Record<string, Order[]>;
};

export function statusesForFulfillment(
  fulfillmentType: FulfillmentType,
): readonly string[] {
  return fulfillmentType === 'pickup' ? PICKUP_STATUSES : DELIVERY_FLOW_STATUSES;
}

export function nextOrderStatus(order: Pick<Order, 'fulfillment_type' | 'status'>): string | null {
  const chain = statusesForFulfillment(order.fulfillment_type);
  const i = chain.indexOf(order.status);
  if (i === -1 || i === chain.length - 1) {
    return null;
  }
  return chain[i + 1] ?? null;
}

export function isOrderCreatedToday(order: Pick<Order, 'created_at'>): boolean {
  if (!order.created_at) {
    return false;
  }
  const d = new Date(order.created_at);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

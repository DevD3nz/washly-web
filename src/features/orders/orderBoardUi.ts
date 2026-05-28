import type { Order } from '../../types/order';

export type StatusUi = {
  label: string;
  icon: string;
  headerClass: string;
  dotClass: string;
};

const STATUS_UI: Record<string, StatusUi> = {
  received: {
    label: 'Received',
    icon: '📥',
    headerClass: 'bg-slate-500/10 text-slate-700 dark:text-slate-300',
    dotClass: 'bg-slate-400',
  },
  washing: {
    label: 'Washing',
    icon: '🫧',
    headerClass: 'bg-sky-500/10 text-sky-800 dark:text-sky-300',
    dotClass: 'bg-sky-500',
  },
  drying: {
    label: 'Drying',
    icon: '💨',
    headerClass: 'bg-amber-500/10 text-amber-800 dark:text-amber-300',
    dotClass: 'bg-amber-500',
  },
  ready: {
    label: 'Ready',
    icon: '✅',
    headerClass: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300',
    dotClass: 'bg-emerald-500',
  },
  claimed: {
    label: 'Claimed',
    icon: '🏁',
    headerClass: 'bg-muted text-muted-foreground',
    dotClass: 'bg-muted-foreground',
  },
  out: {
    label: 'Out',
    icon: '🛵',
    headerClass: 'bg-orange-500/10 text-orange-800 dark:text-orange-300',
    dotClass: 'bg-orange-500',
  },
  delivered: {
    label: 'Delivered',
    icon: '🏁',
    headerClass: 'bg-muted text-muted-foreground',
    dotClass: 'bg-muted-foreground',
  },
};

export function statusUi(status: string): StatusUi {
  return (
    STATUS_UI[status] ?? {
      label: status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      icon: '•',
      headerClass: 'bg-muted/60 text-muted-foreground',
      dotClass: 'bg-muted-foreground',
    }
  );
}

export function formatPeso(cents: number): string {
  return `₱${(cents / 100).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function orderTotalCents(order: Order): number {
  if (!order.items?.length) {
    return 0;
  }
  const gross = order.items.reduce(
    (sum, item) => sum + (item.unit_price_cents ?? 0) * item.quantity,
    0,
  );
  return Math.max(0, gross - (order.points_redeemed ?? 0));
}

export function boardActiveCount(buckets: Record<string, Order[]>, statuses: readonly string[]): number {
  return statuses.reduce((sum, status) => sum + (buckets[status]?.length ?? 0), 0);
}

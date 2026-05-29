import { MapPin, RefreshCw } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { useStaffAuth } from '../context/StaffAuthContext';
import { formatPeso, statusUi } from '../features/orders/orderBoardUi';
import { useRiderDeliveries } from '../features/rider/hooks/useRiderDeliveries';
import { cn } from '../lib/cn';
import { buildDeliveryNavigationLinks } from '../lib/mapsLinks';
import { nextOrderStatus, type Order } from '../types/order';

function deliveryAddress(order: Order): string {
  return order.delivery_address ?? order.notes ?? 'No address';
}

export function RiderDeliveriesPage() {
  const { employee } = useStaffAuth();
  const { orders, loading, busyId, error, pendingCount, isOnline, reload, advance } =
    useRiderDeliveries();

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-start justify-between gap-3">
        <PageHeader
          title="My deliveries"
          description={
            employee?.branch?.name
              ? `${employee.branch.name} · Assigned routes`
              : 'Assigned delivery orders'
          }
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0"
          disabled={loading}
          onClick={() => void reload()}
        >
          <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
        </Button>
      </div>

      {!isOnline && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
          Offline — status updates are saved and will sync when you are back online.
          {pendingCount > 0 && ` (${pendingCount} pending)`}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}

      {loading && orders.length === 0 && (
        <Card className="px-4 py-10 text-center text-sm text-muted-foreground">
          Loading deliveries…
        </Card>
      )}

      {!loading && orders.length === 0 && (
        <Card className="px-4 py-10 text-center text-sm text-muted-foreground">
          No assigned deliveries right now.
        </Card>
      )}

      <ul className="space-y-3">
        {orders.map((order) => {
          const next = nextOrderStatus(order);
          const ui = statusUi(order.status);
          const nav = buildDeliveryNavigationLinks(
            order.delivery_address,
            order.delivery_neighborhood,
          );
          const total = order.items?.reduce(
            (sum, i) => sum + (i.unit_price_cents ?? 0) * i.quantity,
            0,
          );

          return (
            <li key={order.id}>
              <Card className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold tabular-nums">
                      {order.order_number ?? `#${order.id}`}
                    </p>
                    {order.customer_name && (
                      <p className="mt-0.5 text-sm font-medium">{order.customer_name}</p>
                    )}
                    {order.customer_phone && (
                      <p className="text-xs text-muted-foreground">{order.customer_phone}</p>
                    )}
                  </div>
                  <Badge tone={order.status === 'out' ? 'warning' : 'muted'}>
                    {ui.label}
                  </Badge>
                </div>

                <p className="mt-3 text-sm leading-relaxed text-foreground">
                  📍 {deliveryAddress(order)}
                </p>
                {order.delivery_neighborhood && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {order.delivery_neighborhood}
                  </p>
                )}

                {total != null && total > 0 && (
                  <p className="mt-2 text-sm font-semibold text-primary tabular-nums">
                    {formatPeso(total)}
                  </p>
                )}

                {nav && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a
                      href={nav.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
                    >
                      <MapPin className="h-3.5 w-3.5" />
                      Maps
                    </a>
                    <a
                      href={nav.wazeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
                    >
                      Waze
                    </a>
                  </div>
                )}

                {next ? (
                  <Button
                    type="button"
                    className="mt-4 h-11 w-full"
                    disabled={busyId === order.id}
                    onClick={() => void advance(order)}
                  >
                    {busyId === order.id
                      ? 'Updating…'
                      : `Mark ${statusUi(next).label}`}
                  </Button>
                ) : (
                  <div
                    className={cn(
                      'mt-4 flex items-center justify-center gap-1.5 rounded-lg bg-muted/50 py-2.5 text-xs text-muted-foreground',
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full', ui.dotClass)} />
                    Complete
                  </div>
                )}
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

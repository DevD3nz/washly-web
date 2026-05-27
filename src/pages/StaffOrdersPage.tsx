import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionHeader } from '../components/ui/SectionHeader';
import { useStaffAuth } from '../context/StaffAuthContext';
import {
  fetchStaffOrderBoard,
  fetchStaffOrderReceipt,
  postStaffOrder,
  postStaffOrderStatus,
} from '../lib/api';
import { cn } from '../lib/cn';
import {
  DELIVERY_STATUSES,
  nextOrderStatus,
  PICKUP_STATUSES,
  type Order,
  type OrderBoard,
} from '../types/order';

function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type KanbanStripeProps = {
  title: string;
  statuses: readonly string[];
  buckets: Record<string, Order[]>;
  onAdvance: (order: Order) => Promise<void>;
  onCopyReceipt: (order: Order) => Promise<void>;
  busyId: number | null;
  receiptBusyId: number | null;
};

function KanbanStripe({
  title,
  statuses,
  buckets,
  onAdvance,
  onCopyReceipt,
  busyId,
  receiptBusyId,
}: KanbanStripeProps) {
  const colCount = statuses.length >= 5 ? 'lg:grid-cols-5' : 'lg:grid-cols-3';

  return (
    <section className="space-y-3">
      <SectionHeader title={title} />
      <div
        className={cn(
          '-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:gap-4 lg:overflow-visible lg:px-0 lg:pb-0',
          colCount,
        )}
      >
        {statuses.map((status) => {
          const list = buckets[status] ?? [];
          return (
            <div
              key={status}
              className="flex w-[min(82vw,18rem)] shrink-0 flex-col gap-2 lg:min-w-0 lg:w-auto"
            >
              <div className="flex items-center gap-2 px-0.5">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {formatStatusLabel(status)}
                </h4>
                <Badge tone="muted">{list.length}</Badge>
              </div>
              <div className="flex flex-col gap-2">
                {list.map((order) => {
                  const next = nextOrderStatus(order);
                  const busy = busyId === order.id;
                  const receiptBusy = receiptBusyId === order.id;
                  return (
                    <Card key={order.id} className="min-h-[4.5rem] p-3 shadow-sm">
                      <p className="text-xs font-semibold text-foreground">
                        {order.order_number ?? `#${order.id}`}
                      </p>
                      {order.customer_name && (
                        <p className="mt-0.5 truncate text-sm text-muted-foreground">
                          {order.customer_name}
                        </p>
                      )}
                      {order.items && order.items.length > 0 && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {order.items
                            .map((i) => `${i.quantity}× ${i.description}`)
                            .join(' · ')}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-2">
                        {next ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={busy || receiptBusy}
                            onClick={() => void onAdvance(order)}
                          >
                            {busy ? '…' : `→ ${formatStatusLabel(next)}`}
                          </Button>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">
                            Done
                          </span>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={busy || receiptBusy}
                          onClick={() => void onCopyReceipt(order)}
                        >
                          {receiptBusy ? '…' : 'Receipt'}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function StaffOrdersPage() {
  const { employee } = useStaffAuth();
  const [board, setBoard] = useState<OrderBoard | null>(null);
  const [loadError, setLoadError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [receiptBusyId, setReceiptBusyId] = useState<number | null>(null);
  const [receiptMsg, setReceiptMsg] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadBoard = useCallback(async () => {
    setLoadError('');
    try {
      const data = await fetchStaffOrderBoard();
      setBoard(data);
    } catch (e) {
      setBoard(null);
      setLoadError(e instanceof Error ? e.message : 'Failed to load board');
    }
  }, []);

  useEffect(() => {
    if (employee) {
      void loadBoard();
    }
  }, [employee, loadBoard]);

  const onAdvance = useCallback(
    async (order: Order) => {
      const next = nextOrderStatus(order);
      if (!next) {
        return;
      }
      setBusyId(order.id);
      setLoadError('');
      try {
        await postStaffOrderStatus(order.id, next);
        await loadBoard();
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Could not advance order');
      } finally {
        setBusyId(null);
      }
    },
    [loadBoard],
  );

  const onCopyReceipt = useCallback(async (order: Order) => {
    setReceiptBusyId(order.id);
    setReceiptMsg('');
    try {
      const receipt = await fetchStaffOrderReceipt(order.id);
      await navigator.clipboard.writeText(receipt.receipt_url);
      setReceiptMsg(`Copied link for ${receipt.order_number}`);
    } catch (e) {
      setLoadError(
        e instanceof Error ? e.message : 'Could not copy receipt link',
      );
    } finally {
      setReceiptBusyId(null);
    }
  }, []);

  async function onCreateOrder(e: FormEvent) {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      await postStaffOrder({
        fulfillment_type: 'pickup',
        customer_name: customerName.trim() || undefined,
        items: [{ description: itemDescription.trim(), quantity: 1 }],
      });
      setCustomerName('');
      setItemDescription('');
      await loadBoard();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Could not create order');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description={
          employee?.branch?.name
            ? `${employee.branch.name} · Tap advance or copy receipt link`
            : 'Kanban for your branch'
        }
      />

      <Card className="space-y-4 p-4">
        <h2 className="text-sm font-semibold">New pickup order</h2>
        <form onSubmit={onCreateOrder} className="space-y-3">
          <div>
            <Label htmlFor="customer_name">Customer name</Label>
            <Input
              id="customer_name"
              className="mt-1"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="item_description">Item</Label>
            <Input
              id="item_description"
              required
              className="mt-1"
              placeholder="e.g. Wash & fold"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
            />
          </div>
          {createError && (
            <p className="text-sm text-red-600 dark:text-red-400">{createError}</p>
          )}
          <Button type="submit" disabled={creating}>
            {creating ? 'Creating…' : 'Create order'}
          </Button>
        </form>
      </Card>

      {loadError && (
        <p className="text-sm text-red-600 dark:text-red-400">{loadError}</p>
      )}
      {receiptMsg && (
        <p className="text-sm text-green-700 dark:text-green-400">{receiptMsg}</p>
      )}

      {board && (
        <div className="space-y-8">
          <KanbanStripe
            title="Pickup"
            statuses={PICKUP_STATUSES}
            buckets={board.pickup}
            onAdvance={onAdvance}
            onCopyReceipt={onCopyReceipt}
            busyId={busyId}
            receiptBusyId={receiptBusyId}
          />
          <KanbanStripe
            title="Delivery"
            statuses={DELIVERY_STATUSES}
            buckets={board.delivery}
            onAdvance={onAdvance}
            onCopyReceipt={onCopyReceipt}
            busyId={busyId}
            receiptBusyId={receiptBusyId}
          />
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { PageHeader } from '../components/ui/PageHeader';
import { SectionHeader } from '../components/ui/SectionHeader';
import { Select } from '../components/ui/Select';
import { useStaffAuth } from '../context/StaffAuthContext';
import { useCustomerLookup } from '../features/suki/hooks/useCustomerLookup';
import type { CustomerType } from '../features/suki/types';
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

function formatPeso(cents: number): string {
  return `₱${(cents / 100).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

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
                      {order.customer_phone && (
                        <p className="truncate text-xs text-muted-foreground">
                          {order.customer_phone}
                        </p>
                      )}
                      {order.customer?.type === 'suki' && (
                        <Badge tone="muted" className="mt-1">
                          Suki · {order.customer.points_balance} pts
                        </Badge>
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

  const [customerType, setCustomerType] = useState<CustomerType>('guest');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [unitPricePeso, setUnitPricePeso] = useState('');
  const [pointsRedeemed, setPointsRedeemed] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const { customer: lookedUp, loading: lookupLoading } = useCustomerLookup({
    phone: customerPhone,
    asStaff: true,
  });

  const grossCents = useMemo(() => {
    const peso = Number.parseFloat(unitPricePeso);
    if (!Number.isFinite(peso) || peso <= 0) {
      return 0;
    }
    return Math.round(peso * 100);
  }, [unitPricePeso]);

  const maxRedeemable = useMemo(() => {
    if (customerType !== 'suki' || !lookedUp) {
      return 0;
    }
    return Math.min(lookedUp.points_balance, grossCents);
  }, [customerType, lookedUp, grossCents]);

  useEffect(() => {
    if (lookedUp?.type === 'suki') {
      setCustomerType('suki');
      if (lookedUp.name) {
        setCustomerName(lookedUp.name);
      }
    }
  }, [lookedUp]);

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

    const phone = customerPhone.trim();
    if (!phone) {
      setCreateError('Phone is required for Guest or Suki intake.');
      return;
    }
    if (customerType === 'suki' && !customerName.trim()) {
      setCreateError('Name is required for Suki customers.');
      return;
    }

    const redeemed = Number.parseInt(pointsRedeemed, 10);
    const points =
      customerType === 'suki' && Number.isFinite(redeemed) && redeemed > 0
        ? redeemed
        : undefined;

    setCreating(true);
    try {
      await postStaffOrder({
        fulfillment_type: 'pickup',
        customer_type: customerType,
        customer_phone: phone,
        customer_name:
          customerType === 'suki' ? customerName.trim() : customerName.trim() || undefined,
        points_redeemed: points,
        items: [
          {
            description: itemDescription.trim(),
            quantity: 1,
            unit_price_cents: grossCents > 0 ? grossCents : undefined,
          },
        ],
      });
      setCustomerPhone('');
      setCustomerName('');
      setItemDescription('');
      setUnitPricePeso('');
      setPointsRedeemed('');
      setCustomerType('guest');
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
            <Label htmlFor="customer_type">Customer type</Label>
            <Select
              id="customer_type"
              className="mt-1"
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value as CustomerType)}
            >
              <option value="guest">Guest (phone only)</option>
              <option value="suki">Suki (name + phone · 2× points)</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="customer_phone">Phone</Label>
            <Input
              id="customer_phone"
              required
              className="mt-1"
              placeholder="09XXXXXXXXX"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
            />
            {lookupLoading && (
              <p className="mt-1 text-xs text-muted-foreground">Looking up…</p>
            )}
            {lookedUp && (
              <p className="mt-1 text-xs text-muted-foreground">
                Found {lookedUp.type === 'suki' ? 'Suki' : 'Guest'}
                {lookedUp.type === 'suki'
                  ? ` · ${lookedUp.points_balance} pts (${formatPeso(lookedUp.points_balance)})`
                  : ''}
              </p>
            )}
          </div>
          {customerType === 'suki' && (
            <div>
              <Label htmlFor="customer_name">Suki name</Label>
              <Input
                id="customer_name"
                required
                className="mt-1"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
          )}
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
          <div>
            <Label htmlFor="unit_price">Price (₱)</Label>
            <Input
              id="unit_price"
              type="number"
              min="0"
              step="0.01"
              className="mt-1"
              placeholder="e.g. 150"
              value={unitPricePeso}
              onChange={(e) => setUnitPricePeso(e.target.value)}
            />
          </div>
          {customerType === 'suki' && maxRedeemable > 0 && (
            <div>
              <Label htmlFor="points_redeemed">
                Redeem points (max {maxRedeemable} · 100 pts = ₱1)
              </Label>
              <Input
                id="points_redeemed"
                type="number"
                min="0"
                max={maxRedeemable}
                className="mt-1"
                value={pointsRedeemed}
                onChange={(e) => setPointsRedeemed(e.target.value)}
              />
            </div>
          )}
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

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { cn } from '../lib/cn';
import { useStaffAuth } from '../context/StaffAuthContext';
import { OrderKanbanBoard } from '../features/orders/components/OrderKanbanBoard';
import { formatPeso } from '../features/orders/orderBoardUi';
import { useCustomerLookup } from '../features/suki/hooks/useCustomerLookup';
import type { CustomerType } from '../features/suki/types';
import {
  fetchStaffOrderBoard,
  fetchStaffOrderReceipt,
  postStaffOrder,
  postStaffOrderStatus,
} from '../lib/api';
import { printOrderReceipt } from '../lib/printReceipt';
import {
  DELIVERY_DISPATCH_STATUSES,
  nextOrderStatus,
  PICKUP_STATUSES,
  type FulfillmentType,
  type Order,
  type OrderBoard,
} from '../types/order';

export function StaffOrdersPage() {
  const { employee } = useStaffAuth();
  const [board, setBoard] = useState<OrderBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [receiptBusyId, setReceiptBusyId] = useState<number | null>(null);
  const [receiptMsg, setReceiptMsg] = useState('');

  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('pickup');
  const [customerType, setCustomerType] = useState<CustomerType>('guest');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [unitPricePeso, setUnitPricePeso] = useState('');
  const [pointsRedeemed, setPointsRedeemed] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const isDelivery = fulfillmentType === 'delivery';

  const intakeHint = isDelivery
    ? 'Guest or Suki intake · lands in Received (production board), then Out when ready'
    : 'Guest or Suki intake · lands in Received (production board)';

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
    setLoading(true);
    try {
      const data = await fetchStaffOrderBoard();
      setBoard(data);
    } catch (e) {
      setBoard(null);
      setLoadError(e instanceof Error ? e.message : 'Failed to load board');
    } finally {
      setLoading(false);
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
      setLoadError(e instanceof Error ? e.message : 'Could not copy receipt link');
    } finally {
      setReceiptBusyId(null);
    }
  }, []);

  const onPrintReceipt = useCallback(async (order: Order) => {
    setReceiptBusyId(order.id);
    setReceiptMsg('');
    try {
      const receipt = await fetchStaffOrderReceipt(order.id);
      printOrderReceipt(receipt, employee?.branch?.name);
      setReceiptMsg(`Print dialog opened for ${receipt.order_number}`);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not print receipt');
    } finally {
      setReceiptBusyId(null);
    }
  }, [employee?.branch?.name]);

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
    if (isDelivery && !deliveryAddress.trim()) {
      setCreateError('Delivery address is required for delivery orders.');
      return;
    }

    const redeemed = Number.parseInt(pointsRedeemed, 10);
    const points =
      customerType === 'suki' && Number.isFinite(redeemed) && redeemed > 0 ? redeemed : undefined;

    const address = deliveryAddress.trim();
    const neighborhood =
      address.split(/\r?\n/)[0]?.split(',')[0]?.trim() || address;

    setCreating(true);
    try {
      await postStaffOrder({
        fulfillment_type: fulfillmentType,
        customer_type: customerType,
        customer_phone: phone,
        customer_name:
          customerType === 'suki' ? customerName.trim() : customerName.trim() || undefined,
        points_redeemed: points,
        ...(isDelivery
          ? {
              delivery_address: address,
              delivery_neighborhood: neighborhood,
            }
          : {}),
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
      setDeliveryAddress('');
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
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Orders"
          description={
            employee?.branch?.name
              ? `${employee.branch.name} · Swipe columns on phone, full board on laptop`
              : 'Branch order board'
          }
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0"
          disabled={loading}
          onClick={() => void loadBoard()}
        >
          <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
          Refresh
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border bg-muted/40 px-4 py-3">
          <h2 className="text-sm font-semibold">New order</h2>
          <p className="text-xs text-muted-foreground">{intakeHint}</p>
        </div>
        <form onSubmit={onCreateOrder} className="grid gap-3 p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Fulfillment</Label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <button
                type="button"
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                  fulfillmentType === 'pickup'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted/50',
                )}
                onClick={() => setFulfillmentType('pickup')}
              >
                <span className="font-semibold">Pickup</span>
                <span className="mt-0.5 block text-xs opacity-80">Customer collects at branch</span>
              </button>
              <button
                type="button"
                className={cn(
                  'rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
                  fulfillmentType === 'delivery'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card text-muted-foreground hover:bg-muted/50',
                )}
                onClick={() => setFulfillmentType('delivery')}
              >
                <span className="font-semibold">Delivery</span>
                <span className="mt-0.5 block text-xs opacity-80">Rider delivers to customer</span>
              </button>
            </div>
          </div>
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
          {isDelivery && (
            <div className="sm:col-span-2">
              <Label htmlFor="delivery_address">Delivery address</Label>
              <textarea
                id="delivery_address"
                required
                rows={2}
                className={cn(
                  'mt-1 flex w-full rounded-xl border border-input bg-card px-3 py-2 text-sm text-card-foreground',
                  '[box-shadow:var(--shadow-xs)] placeholder:text-muted-foreground',
                  'focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/20',
                )}
                placeholder="Street, barangay, landmarks…"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
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
            <div className="sm:col-span-2">
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
            <p className="text-sm text-red-600 sm:col-span-2 dark:text-red-400">{createError}</p>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={creating} className="w-full sm:w-auto">
              {creating ? 'Creating…' : isDelivery ? 'Create delivery order' : 'Create pickup order'}
            </Button>
          </div>
        </form>
      </Card>

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          {loadError}
        </div>
      )}
      {receiptMsg && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
          {receiptMsg}
        </div>
      )}

      {loading && !board && (
        <Card className="px-4 py-10 text-center text-sm text-muted-foreground">Loading board…</Card>
      )}

      {board && (
        <div className="space-y-5">
          <OrderKanbanBoard
            title="Production"
            subtitle="All orders · received → washing → drying → ready · pickup claims at end"
            statuses={PICKUP_STATUSES}
            buckets={board.pickup}
            onAdvance={onAdvance}
            onCopyReceipt={onCopyReceipt}
            onPrintReceipt={onPrintReceipt}
            busyId={busyId}
            receiptBusyId={receiptBusyId}
            showFulfillmentBadge
          />
          <OrderKanbanBoard
            title="Delivery dispatch"
            subtitle="After ready · out for delivery → delivered"
            statuses={DELIVERY_DISPATCH_STATUSES}
            buckets={board.delivery}
            onAdvance={onAdvance}
            onCopyReceipt={onCopyReceipt}
            onPrintReceipt={onPrintReceipt}
            busyId={busyId}
            receiptBusyId={receiptBusyId}
          />
        </div>
      )}
    </div>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { cn } from '../../../lib/cn';
import { nextOrderStatus, type Order } from '../../../types/order';
import { boardActiveCount, formatPeso, orderTotalCents, statusUi } from '../orderBoardUi';

type OrderKanbanBoardProps = {
  title: string;
  subtitle?: string;
  statuses: readonly string[];
  buckets: Record<string, Order[]>;
  onAdvance: (order: Order) => Promise<void>;
  onCopyReceipt: (order: Order) => Promise<void>;
  busyId: number | null;
  receiptBusyId: number | null;
  showFulfillmentBadge?: boolean;
};

function OrderKanbanCard({
  order,
  onAdvance,
  onCopyReceipt,
  busy,
  receiptBusy,
  showFulfillmentBadge,
}: {
  order: Order;
  onAdvance: (order: Order) => Promise<void>;
  onCopyReceipt: (order: Order) => Promise<void>;
  busy: boolean;
  receiptBusy: boolean;
  showFulfillmentBadge?: boolean;
}) {
  const next = nextOrderStatus(order);
  const total = orderTotalCents(order);
  const ui = statusUi(order.status);

  return (
    <div className="rounded-xl border border-border bg-card p-3 [box-shadow:var(--shadow-xs)]">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold tabular-nums text-foreground">
            {order.order_number ?? `#${order.id}`}
          </p>
          {order.customer_name && (
            <p className="mt-0.5 truncate text-sm text-foreground">{order.customer_name}</p>
          )}
          {order.customer_phone && (
            <p className="truncate text-xs text-muted-foreground">{order.customer_phone}</p>
          )}
        </div>
        {total > 0 && (
          <span className="shrink-0 text-sm font-bold tabular-nums text-primary">{formatPeso(total)}</span>
        )}
      </div>

      {showFulfillmentBadge && (
        <Badge tone={order.fulfillment_type === 'delivery' ? 'warning' : 'default'} className="mt-2">
          {order.fulfillment_type === 'delivery' ? 'Delivery' : 'Pickup'}
        </Badge>
      )}

      {order.customer?.type === 'suki' && (
        <Badge tone="default" className="mt-2">
          Suki · {order.customer.points_balance} pts
        </Badge>
      )}

      {order.fulfillment_type === 'delivery' && order.notes && (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          📍 {order.notes}
        </p>
      )}

      {order.items && order.items.length > 0 && (
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {order.items.map((i) => `${i.quantity}× ${i.description}`).join(' · ')}
        </p>
      )}

      <div className="mt-3 space-y-2">
        {next ? (
          <Button
            type="button"
            size="sm"
            className="h-10 w-full text-xs sm:h-9"
            disabled={busy || receiptBusy}
            onClick={() => void onAdvance(order)}
          >
            {busy ? 'Updating…' : `Move to ${statusUi(next).label}`}
          </Button>
        ) : (
          <div className="flex items-center gap-1.5 rounded-lg bg-muted/50 px-2.5 py-2 text-xs text-muted-foreground">
            <span className={cn('h-1.5 w-1.5 rounded-full', ui.dotClass)} />
            Complete
          </div>
        )}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-9 w-full text-xs text-muted-foreground"
          disabled={busy || receiptBusy}
          onClick={() => void onCopyReceipt(order)}
        >
          {receiptBusy ? 'Copying…' : 'Copy receipt link'}
        </Button>
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  orders,
  onAdvance,
  onCopyReceipt,
  busyId,
  receiptBusyId,
  scrollable,
  showFulfillmentBadge,
}: {
  status: string;
  orders: Order[];
  onAdvance: (order: Order) => Promise<void>;
  onCopyReceipt: (order: Order) => Promise<void>;
  busyId: number | null;
  receiptBusyId: number | null;
  scrollable: boolean;
  showFulfillmentBadge?: boolean;
}) {
  const ui = statusUi(status);

  return (
    <div
      data-kanban-column
      className={cn(
        'flex shrink-0 flex-col',
        scrollable ? 'kanban-column-scroll w-[min(78vw,17.5rem)] snap-center' : 'min-w-0',
      )}
    >
      <div className="flex min-h-[12rem] flex-col overflow-hidden rounded-2xl border border-border bg-muted/20 sm:min-h-[14rem]">
        <div className={cn('flex items-center gap-2 border-b border-border px-3 py-2.5', ui.headerClass)}>
          <span className="text-base leading-none" aria-hidden>
            {ui.icon}
          </span>
          <h4 className="min-w-0 flex-1 truncate text-xs font-bold uppercase tracking-wide">{ui.label}</h4>
          <Badge tone={orders.length > 0 ? 'default' : 'muted'}>{orders.length}</Badge>
        </div>
        <div className="flex flex-1 flex-col gap-2 p-2">
          {orders.length === 0 ? (
            <p className="flex flex-1 items-center justify-center px-2 py-6 text-center text-xs text-muted-foreground">
              No orders here
            </p>
          ) : (
            orders.map((order) => (
              <OrderKanbanCard
                key={order.id}
                order={order}
                onAdvance={onAdvance}
                onCopyReceipt={onCopyReceipt}
                busy={busyId === order.id}
                receiptBusy={receiptBusyId === order.id}
                showFulfillmentBadge={showFulfillmentBadge}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function useKanbanScroll() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollBack, setCanScrollBack] = useState(false);
  const [canScrollForward, setCanScrollForward] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) {
      setCanScrollBack(false);
      setCanScrollForward(false);
      return;
    }

    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollBack(el.scrollLeft > 4);
    setCanScrollForward(maxScroll > 4 && el.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) {
      return undefined;
    }

    updateScrollState();

    const onScroll = () => updateScrollState();
    el.addEventListener('scroll', onScroll, { passive: true });

    const ro = new ResizeObserver(() => updateScrollState());
    ro.observe(el);
    if (el.firstElementChild) {
      ro.observe(el.firstElementChild);
    }

    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, [updateScrollState]);

  const scrollByColumn = useCallback((direction: -1 | 1) => {
    const el = scrollerRef.current;
    if (!el) {
      return;
    }

    const column = el.querySelector<HTMLElement>('[data-kanban-column]');
    const step = column ? column.offsetWidth + 12 : el.clientWidth * 0.8;
    el.scrollBy({ left: direction * step, behavior: 'smooth' });
  }, []);

  return { scrollerRef, canScrollBack, canScrollForward, scrollByColumn, updateScrollState };
}

export function OrderKanbanBoard({
  title,
  subtitle,
  statuses,
  buckets,
  onAdvance,
  onCopyReceipt,
  busyId,
  receiptBusyId,
  showFulfillmentBadge,
}: OrderKanbanBoardProps) {
  const active = boardActiveCount(buckets, statuses);
  const wideBoard = statuses.length >= 5;
  const desktopGridClass = wideBoard ? 'kanban-board-wide' : 'kanban-board-narrow';
  const { scrollerRef, canScrollBack, canScrollForward, scrollByColumn, updateScrollState } =
    useKanbanScroll();

  useEffect(() => {
    updateScrollState();
  }, [statuses, buckets, updateScrollState]);

  return (
    <Card className={cn('min-w-0 p-0', desktopGridClass)}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/40 px-4 py-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        <Badge tone={active > 0 ? 'success' : 'muted'} className="shrink-0">
          {active} active
        </Badge>
      </div>

      <div className="kanban-board-controls flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2">
        <p className="text-[11px] text-muted-foreground">Swipe or use arrows for more columns</p>
        <div className="flex shrink-0 items-center gap-1">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={!canScrollBack}
            aria-label="Previous column"
            onClick={() => scrollByColumn(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-8 w-8 p-0"
            disabled={!canScrollForward}
            aria-label="Next column"
            onClick={() => scrollByColumn(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div ref={scrollerRef} className="kanban-scroll">
        <div className="kanban-scroll-track">
          {statuses.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              orders={buckets[status] ?? []}
              onAdvance={onAdvance}
              onCopyReceipt={onCopyReceipt}
              busyId={busyId}
              receiptBusyId={receiptBusyId}
              scrollable
              showFulfillmentBadge={showFulfillmentBadge}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}

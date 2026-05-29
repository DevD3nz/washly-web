import { useCallback, useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Label } from '../components/ui/Label';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { useAuth } from '../context/AuthContext';
import { OrderKanbanBoard } from '../features/orders/components/OrderKanbanBoard';
import { RiderAssignSelect } from '../features/orders/components/RiderAssignSelect';
import {
  DELIVERY_DISPATCH_STATUSES,
  nextOrderStatus,
  PICKUP_STATUSES,
  type Order,
  type OrderBoard,
} from '../types/order';
import { api, fetchOrderBoard, postOrderStatus } from '../lib/api';
import { canManageBranches, isAttendantRole } from '../lib/roles';

type Branch = { id: number; name: string };

export function OrdersPage() {
  const { user } = useAuth();
  const canAssignRider = canManageBranches(user?.role);
  const isAttendant = isAttendantRole(user?.role);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [board, setBoard] = useState<OrderBoard | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    void api<Branch[]>('/branches')
      .then((rows) => {
        setBranches(rows);
        if (isAttendant && user?.branch_id) {
          setBranchId(user.branch_id);
          return;
        }
        if (rows[0]) setBranchId(rows[0].id);
      })
      .catch(() => setBranches([]));
  }, [isAttendant, user?.branch_id]);

  const loadBoard = useCallback(async () => {
    if (!branchId) {
      setBoard(null);
      return;
    }
    setLoadError('');
    setLoading(true);
    try {
      setBoard(await fetchOrderBoard(branchId));
    } catch (e) {
      setBoard(null);
      setLoadError(e instanceof Error ? e.message : 'Failed to load board');
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    void loadBoard();
  }, [loadBoard]);

  const onAdvance = useCallback(
    async (order: Order) => {
      const next = nextOrderStatus(order);
      if (!next) return;
      setBusyId(order.id);
      setLoadError('');
      try {
        await postOrderStatus(order.id, next);
        await loadBoard();
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : 'Could not advance order');
      } finally {
        setBusyId(null);
      }
    },
    [loadBoard],
  );

  const onOrderUpdated = useCallback(
    (updated: Order) => {
      if (!board) return;
      const patchBucket = (buckets: Record<string, Order[]>) => {
        const next: Record<string, Order[]> = {};
        for (const [status, list] of Object.entries(buckets)) {
          next[status] = list.map((o) => (o.id === updated.id ? updated : o));
        }
        return next;
      };
      setBoard({
        ...board,
        pickup: patchBucket(board.pickup),
        delivery: patchBucket(board.delivery),
      });
    },
    [board],
  );

  const renderRiderAssign =
    canAssignRider && branchId
      ? (order: Order) => (
          <RiderAssignSelect
            order={order}
            branchId={branchId}
            disabled={busyId === order.id}
            onAssigned={onOrderUpdated}
          />
        )
      : undefined;

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          title="Orders"
          description="Production and delivery dispatch · assign riders on delivery orders"
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

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-36 flex-1">
          <Label htmlFor="orders_branch" className="text-xs">
            Branch
          </Label>
          <Select
            id="orders_branch"
            className="mt-1"
            value={branchId ? String(branchId) : ''}
            disabled={isAttendant}
            onChange={(e) => setBranchId(Number(e.target.value))}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {loadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          {loadError}
        </div>
      )}

      {loading && !board && (
        <Card className="px-4 py-10 text-center text-sm text-muted-foreground">
          Loading board…
        </Card>
      )}

      {board && (
        <div className="space-y-5">
          <OrderKanbanBoard
            title="Production"
            subtitle="Pickup and delivery · received through ready"
            statuses={PICKUP_STATUSES}
            buckets={board.pickup}
            onAdvance={onAdvance}
            onCopyReceipt={async () => {}}
            busyId={busyId}
            receiptBusyId={null}
            showFulfillmentBadge
            renderOrderExtras={renderRiderAssign}
          />
          <OrderKanbanBoard
            title="Delivery dispatch"
            subtitle="Out for delivery → delivered · assign riders before dispatch"
            statuses={DELIVERY_DISPATCH_STATUSES}
            buckets={board.delivery}
            onAdvance={onAdvance}
            onCopyReceipt={async () => {}}
            busyId={busyId}
            receiptBusyId={null}
            renderOrderExtras={renderRiderAssign}
          />
        </div>
      )}
    </div>
  );
}

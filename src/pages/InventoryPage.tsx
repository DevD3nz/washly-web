import { useEffect, useState, type FormEvent } from 'react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { useAuth } from '../context/AuthContext';
import { useBranchInventory } from '../features/inventory/hooks/useBranchInventory';
import type { InventoryItem } from '../features/inventory/types';
import { api } from '../lib/api';
import { canManageBranches, isAttendantRole } from '../lib/roles';

type Branch = { id: number; name: string };

export function InventoryPage() {
  const { user } = useAuth();
  const canDelete = canManageBranches(user?.role);
  const isAttendant = isAttendantRole(user?.role);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [quantity, setQuantity] = useState('');
  const [reorderLevel, setReorderLevel] = useState('');
  const [consumption, setConsumption] = useState('0');
  const [adjustDelta, setAdjustDelta] = useState<Record<number, string>>({});

  const { items, loading, saving, error, addItem, removeItem, adjustItem } = useBranchInventory({ branchId });

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

  async function submitItem(e: FormEvent) {
    e.preventDefault();
    const qty = Number.parseInt(quantity, 10);
    const reorder = Number.parseInt(reorderLevel, 10);
    const perOrder = Number.parseInt(consumption, 10);
    if (!Number.isFinite(qty) || qty < 0 || !Number.isFinite(reorder) || reorder < 0) return;
    await addItem({
      name: name.trim(),
      unit: unit.trim(),
      quantity_units: qty,
      reorder_level: reorder,
      consumption_per_order: Number.isFinite(perOrder) && perOrder >= 0 ? perOrder : 0,
    });
    setName('');
    setQuantity('');
    setReorderLevel('');
    setConsumption('0');
  }

  async function submitAdjust(item: InventoryItem) {
    const delta = Number.parseInt(adjustDelta[item.id] ?? '', 10);
    if (!Number.isFinite(delta) || delta === 0) return;
    await adjustItem(item.id, delta);
    setAdjustDelta((prev) => ({ ...prev, [item.id]: '' }));
  }

  const lowStockCount = items.filter((i) => i.is_low_stock).length;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventory"
        description="Track branch stock, reorder levels, and auto-deduct per settled order."
      />

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-36">
          <Label htmlFor="branch" className="text-xs">Branch</Label>
          <Select
            id="branch"
            className="mt-1"
            value={branchId ? String(branchId) : ''}
            disabled={isAttendant}
            onChange={(e) => setBranchId(Number(e.target.value))}
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
        </div>
        {lowStockCount > 0 && (
          <Badge tone="warning">{lowStockCount} low stock</Badge>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </div>
      )}

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border bg-muted/40 px-4 py-3">
          <h2 className="text-sm font-semibold">Add item</h2>
        </div>
        <form className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3" onSubmit={submitItem}>
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" className="mt-1" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="unit">Unit</Label>
            <Input id="unit" className="mt-1" required value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="pcs, L, kg" />
          </div>
          <div>
            <Label htmlFor="quantity">Initial qty</Label>
            <Input id="quantity" className="mt-1" type="number" min="0" required value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="reorder">Reorder level</Label>
            <Input id="reorder" className="mt-1" type="number" min="0" required value={reorderLevel} onChange={(e) => setReorderLevel(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="consumption">Deduct per order</Label>
            <Input id="consumption" className="mt-1" type="number" min="0" value={consumption} onChange={(e) => setConsumption(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add item'}</Button>
          </div>
        </form>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border bg-muted/40 px-4 py-3">
          <h2 className="text-sm font-semibold">Stock list</h2>
        </div>
        <div className="divide-y divide-border">
          {loading && <p className="px-4 py-6 text-center text-sm text-muted-foreground">Loading…</p>}
          {!loading && items.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">No inventory items yet.</p>
          )}
          {items.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{item.name}</p>
                  {item.is_low_stock && <Badge tone="warning">Low</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {item.quantity_units} {item.unit} · reorder {item.reorder_level}
                  {item.consumption_per_order > 0 ? ` · −${item.consumption_per_order}/order` : ''}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  type="number"
                  className="w-24"
                  placeholder="± qty"
                  value={adjustDelta[item.id] ?? ''}
                  onChange={(e) => setAdjustDelta((prev) => ({ ...prev, [item.id]: e.target.value }))}
                />
                <Button type="button" variant="secondary" className="h-8 px-2.5 text-xs" disabled={saving} onClick={() => void submitAdjust(item)}>
                  Adjust
                </Button>
                {canDelete && (
                  <Button type="button" variant="secondary" className="h-8 px-2.5 text-xs" disabled={saving} onClick={() => void removeItem(item.id)}>
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

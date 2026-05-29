import { useEffect, useState } from 'react';
import { Label } from '../../../components/ui/Label';
import { Select } from '../../../components/ui/Select';
import { api, assignOrderRider } from '../../../lib/api';
import type { Employee } from '../../../types/employee';
import type { Order } from '../../../types/order';

type RiderAssignSelectProps = {
  order: Order;
  branchId: number;
  disabled?: boolean;
  onAssigned: (order: Order) => void;
};

export function RiderAssignSelect({
  order,
  branchId,
  disabled,
  onAssigned,
}: RiderAssignSelectProps) {
  const [riders, setRiders] = useState<Employee[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void api<Employee[]>('/employees')
      .then((rows) =>
        setRiders(
          rows.filter(
            (e) =>
              e.branch_id === branchId &&
              e.job_title === 'rider' &&
              e.employment_status === 'active',
          ),
        ),
      )
      .catch(() => setRiders([]));
  }, [branchId]);

  async function onChange(employeeId: number | null) {
    setBusy(true);
    setError('');
    try {
      const updated = await assignOrderRider(order.id, employeeId);
      onAssigned(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not assign rider');
    } finally {
      setBusy(false);
    }
  }

  if (order.fulfillment_type !== 'delivery') {
    return null;
  }

  return (
    <div className="mt-2 space-y-1">
      <Label htmlFor={`rider-${order.id}`} className="text-[10px] uppercase tracking-wide text-muted-foreground">
        Rider
      </Label>
      <Select
        id={`rider-${order.id}`}
        className="h-8 text-xs"
        disabled={disabled || busy}
        value={order.rider_employee_id != null ? String(order.rider_employee_id) : ''}
        onChange={(e) => {
          const v = e.target.value;
          void onChange(v === '' ? null : Number(v));
        }}
      >
        <option value="">Unassigned</option>
        {riders.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
            {r.employee_code ? ` · ${r.employee_code}` : ''}
          </option>
        ))}
      </Select>
      {error && <p className="text-[10px] text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

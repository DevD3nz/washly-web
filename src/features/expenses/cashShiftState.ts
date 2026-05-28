import type { CashShift } from './types';

export function resolveCashShiftState(shifts: CashShift[], dailyCloseShift: CashShift | null | undefined) {
  const shiftForDate = dailyCloseShift ?? shifts[0] ?? null;
  const openShift = shifts.find((shift) => shift.closed_at === null) ?? null;
  const closedShift =
    openShift === null && shiftForDate?.closed_at != null ? shiftForDate : null;

  return { openShift, closedShift };
}

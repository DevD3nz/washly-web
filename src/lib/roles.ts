import type { UserRole } from './api';

export function isStaffPortalRole(role: UserRole | undefined): boolean {
  return role === 'attendant' || role === 'rider';
}

export function canManageBranches(role: UserRole | undefined): boolean {
  return role === 'owner' || role === 'manager';
}

const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  trial: 'Trial',
  payment_pending: 'Payment pending',
  active: 'Active',
  grace: 'Grace period',
  suspended: 'Suspended',
};

export function subscriptionStatusLabel(status: string): string {
  return SUBSCRIPTION_STATUS_LABELS[status] ?? status;
}

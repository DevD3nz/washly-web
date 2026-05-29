import { ApiRequestError, postStaffRiderOrderStatus } from '../../../lib/api';
import { listPendingRiderUpdates, removePendingRiderUpdate } from './riderStatusQueue';

export type RiderSyncResult = {
  synced: number;
  staleDropped: number;
  message: string | null;
};

export async function syncRiderStatusQueue(): Promise<RiderSyncResult> {
  const pending = await listPendingRiderUpdates();
  let synced = 0;
  let staleDropped = 0;
  let message: string | null = null;

  for (const item of pending) {
    try {
      await postStaffRiderOrderStatus(item.orderId, item.status);
      await removePendingRiderUpdate(item.id);
      synced++;
    } catch (e) {
      const status = e instanceof ApiRequestError ? e.status : 0;
      const errMessage = e instanceof Error ? e.message : '';
      const isSubscriptionSuspended =
        status === 403 &&
        errMessage.toLowerCase().includes('subscription is suspended');

      if (isSubscriptionSuspended) {
        message = errMessage;
        break;
      }

      if (status === 422) {
        await removePendingRiderUpdate(item.id);
        staleDropped++;
        message =
          'Some offline updates were already applied on the server. List refreshed.';
        continue;
      }

      if (!navigator.onLine) {
        break;
      }

      message = errMessage || 'Could not sync offline updates';
      break;
    }
  }

  return { synced, staleDropped, message };
}

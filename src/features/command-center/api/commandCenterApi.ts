import { api } from '../../../lib/api';
import type {
  AccountFeatureToggles,
  CommandCenterPayload,
  ReportPeriod,
} from '../types';

export async function fetchCommandCenter(params: {
  branchId: 'all' | number;
  period: ReportPeriod;
}): Promise<CommandCenterPayload> {
  const branchParam =
    params.branchId === 'all' ? 'all' : String(params.branchId);
  return api<CommandCenterPayload>(
    `/command-center?branch_id=${branchParam}&period=${params.period}`,
  );
}

export async function patchCommandCenterSettings(
  settings: Partial<AccountFeatureToggles>,
): Promise<{ settings: AccountFeatureToggles }> {
  return api<{ settings: AccountFeatureToggles }>(
    '/command-center/settings',
    {
      method: 'PATCH',
      body: JSON.stringify(settings),
    },
  );
}

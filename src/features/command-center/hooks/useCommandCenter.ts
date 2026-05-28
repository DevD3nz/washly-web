import { useCallback, useEffect, useState } from 'react';
import {
  fetchCommandCenter,
  patchCommandCenterSettings,
} from '../api/commandCenterApi';
import type {
  AccountFeatureToggles,
  CommandCenterPayload,
  ReportPeriod,
} from '../types';

type UseCommandCenterOptions = {
  branchId: 'all' | number;
  period: ReportPeriod;
};

export function useCommandCenter({ branchId, period }: UseCommandCenterOptions) {
  const [data, setData] = useState<CommandCenterPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toggleBusy, setToggleBusy] = useState(false);

  const reload = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      const payload = await fetchCommandCenter({ branchId, period });
      setData(payload);
    } catch (e) {
      setData(null);
      setError(e instanceof Error ? e.message : 'Failed to load command center');
    } finally {
      setLoading(false);
    }
  }, [branchId, period]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateToggle = useCallback(
    async (key: keyof AccountFeatureToggles, value: boolean) => {
      setToggleBusy(true);
      setError('');
      try {
        const res = await patchCommandCenterSettings({ [key]: value });
        setData((prev) =>
          prev ? { ...prev, settings: res.settings } : prev,
        );
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save setting');
      } finally {
        setToggleBusy(false);
      }
    },
    [],
  );

  return { data, loading, error, toggleBusy, reload, updateToggle };
}

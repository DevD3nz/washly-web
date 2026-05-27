import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  setStaffToken,
  staffLogin,
  staffLogout,
  staffMe,
  type StaffEmployee,
} from '../lib/api';

type StaffAuthState = {
  employee: StaffEmployee | null;
  loading: boolean;
  login: (body: {
    branch_id?: number;
    employee_id?: number;
    pin: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const StaffAuthContext = createContext<StaffAuthState | null>(null);

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const [employee, setEmployee] = useState<StaffEmployee | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('washly_staff_token');
    if (!token) {
      setEmployee(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);

    try {
      const me = await staffMe();
      setEmployee(me);
    } catch {
      setStaffToken(null);
      setEmployee(null);
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (body: {
      branch_id?: number;
      employee_id?: number;
      pin: string;
    }) => {
      const res = await staffLogin(body);
      setStaffToken(res.token);
      setEmployee(res.employee);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await staffLogout();
    } catch {
      /* ignore */
    }
    setStaffToken(null);
    setEmployee(null);
  }, []);

  const value = useMemo(
    () => ({ employee, loading, login, logout, refresh }),
    [employee, loading, login, logout, refresh],
  );

  return (
    <StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>
  );
}

export function useStaffAuth(): StaffAuthState {
  const ctx = useContext(StaffAuthContext);
  if (!ctx) {
    throw new Error('useStaffAuth must be used within StaffAuthProvider');
  }
  return ctx;
}

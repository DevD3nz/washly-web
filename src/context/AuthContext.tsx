import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, setToken, type AccountInfo, type ApiUser } from '../lib/api';

type AuthState = {
  user: ApiUser | null;
  account: AccountInfo | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = localStorage.getItem('washly_token');
    if (!token) {
      setUser(null);
      setAccount(null);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);

    try {
      const me = await api<ApiUser>('/me', { signal: controller.signal });
      const acct = await api<AccountInfo>('/account', {
        signal: controller.signal,
      });
      setUser(me);
      setAccount(acct);
    } catch {
      setToken(null);
      setUser(null);
      setAccount(null);
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api<{ token: string; user: ApiUser }>('/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, device_name: 'washly-web' }),
      });
      setToken(res.token);
      setUser(res.user);
      const acct = await api<AccountInfo>('/account');
      setAccount(acct);
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await api('/logout', { method: 'POST' });
    } catch {
      /* ignore */
    }
    setToken(null);
    setUser(null);
    setAccount(null);
  }, []);

  const value = useMemo(
    () => ({ user, account, loading, login, logout, refresh }),
    [user, account, loading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

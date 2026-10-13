import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, type User } from '../api/endpoints';
import { onSessionExpired } from '../api/client';
import { ApiError } from '../api/errors';

type Status = 'loading' | 'authed' | 'anon';
interface AuthValue { user: User | null; status: Status; login: (email: string, password: string) => Promise<void>; logout: () => Promise<void> }

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const queryClient = useQueryClient();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await api.me().catch(async (err: unknown) => {
          if (err instanceof ApiError && err.status === 401) return api.refresh(); // silent refresh on page load
          throw err;
        });
        if (alive) { setUser(me.user); setStatus('authed'); }
      } catch {
        if (alive) { setUser(null); setStatus('anon'); }
      }
    })();
    const off = onSessionExpired(() => { setUser(null); setStatus('anon'); queryClient.clear(); });
    return () => { alive = false; off(); };
  }, [queryClient]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    setUser(res.user);
    setStatus('authed');
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } finally { setUser(null); setStatus('anon'); queryClient.clear(); }
  }, [queryClient]);

  const value = useMemo(() => ({ user, status, login, logout }), [user, status, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

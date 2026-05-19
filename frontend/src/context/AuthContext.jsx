import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  const persistSession = useCallback((newToken, newUser) => {
    if (newToken) {
      localStorage.setItem('token', newToken);
      setToken(newToken);
    }
    setUser(newUser);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const { user: me } = await apiRequest('/auth/me');
        if (!cancelled) setUser(me);
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, clearSession]);

  const login = useCallback(
    async (email, password) => {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      persistSession(data.token, data.user);
      return data.user;
    },
    [persistSession]
  );

  const register = useCallback(
    async (payload) => {
      const data = await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      persistSession(data.token, data.user);
      return data.user;
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      isClient: user?.role === 'client',
      login,
      register,
      logout,
    }),
    [user, token, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

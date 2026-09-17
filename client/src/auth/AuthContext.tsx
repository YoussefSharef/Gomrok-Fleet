import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, getToken, setToken, ApiError } from '../api/client';
import type { Person } from '../domain/types';

interface AuthContextValue {
  person: Person | null;
  loading: boolean;
  loginError: boolean;
  login: (name: string, pin: string) => Promise<void>;
  logout: () => void;
  clearLoginError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [person, setPerson] = useState<Person | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginError, setLoginError] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get<{ person: Person }>('/auth/me')
      .then((res) => setPerson(res.person))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (name: string, pin: string) => {
    try {
      const res = await api.post<{ token: string; person: Person }>('/auth/login', { name, pin });
      setToken(res.token);
      setPerson(res.person);
      setLoginError(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setLoginError(true);
        return;
      }
      throw err;
    }
  };

  const logout = () => {
    setToken(null);
    setPerson(null);
  };

  return (
    <AuthContext.Provider value={{ person, loading, loginError, login, logout, clearLoginError: () => setLoginError(false) }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

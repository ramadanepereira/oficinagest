import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../api/cliente.ts';
import type { Utilizador } from '../api/types.ts';

interface AuthContextValue {
  usuario: Utilizador | null;
  carregando: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Utilizador | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    api.get<{ utilizador: Utilizador }>('/auth/me')
      .then(({ utilizador }) => setUsuario(utilizador))
      .catch(() => setUsuario(null))
      .finally(() => setCarregando(false));
  }, []);

  async function login(username: string, password: string) {
    const { utilizador } = await api.post<{ utilizador: Utilizador }>('/auth/login', { username, password });
    setUsuario(utilizador);
  }

  async function logout() {
    await api.post('/auth/logout').catch(() => undefined);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, carregando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
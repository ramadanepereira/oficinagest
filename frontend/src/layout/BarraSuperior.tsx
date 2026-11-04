import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, ChevronDown, Search, UserRound, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider.tsx';
import { api } from '../api/cliente.ts';
import type { DashboardResumo } from '../api/types.ts';
import { ToggleTema } from '../tema/ToggleTema.tsx';

// Barra superior: pesquisa, sino com badge de alertas, tema e menu do perfil (mockup 2).
export function BarraSuperior() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [menuAberto, setMenuAberto] = useState(false);

  const { data } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardResumo>('/dashboard/resumo'),
  });
  const nAlertas = data?.alertas.length ?? 0;

  if (!usuario) return null;

  function pesquisar(e: FormEvent) {
    e.preventDefault();
    navigate(`/inventario?query=${encodeURIComponent(query)}`);
  }

  const iniciais = usuario.nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <header className="relative flex h-16 shrink-0 items-center gap-4 border-b bg-card px-4 dark:bg-card-dark">
      <form onSubmit={pesquisar} className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Pesquisar material, código, categoria..."
          className="w-full rounded-lg border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary dark:bg-surface-dark"
        />
      </form>

      <div className="ml-auto flex items-center gap-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="relative rounded-full p-2 text-muted hover:bg-surface dark:hover:bg-surface-dark"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
          {nAlertas > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-state-error px-1 text-[10px] font-bold text-white">
              {nAlertas}
            </span>
          )}
        </button>

        <ToggleTema />

        <button
          onClick={() => setMenuAberto((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface dark:hover:bg-surface-dark"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
            {iniciais}
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <p className="text-sm font-medium">{usuario.nome}</p>
            <p className="text-xs capitalize text-muted">{usuario.perfil.toLowerCase()}</p>
          </span>
          <ChevronDown className="h-4 w-4 text-muted" />
        </button>
      </div>

      {menuAberto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuAberto(false)} />
          <div className="absolute right-4 top-14 z-20 w-56 rounded-card border bg-card p-2 shadow-lg dark:bg-card-dark">
            <div className="flex items-center gap-2 rounded-md px-3 py-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                {iniciais}
              </span>
              <div className="leading-tight">
                <p className="text-sm font-medium">{usuario.nome}</p>
                <p className="text-xs capitalize text-muted">{usuario.perfil.toLowerCase()}</p>
              </div>
            </div>
            <div className="my-1 border-t" />
            <button onClick={() => { setMenuAberto(false); navigate('/configuracoes'); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-surface dark:hover:bg-surface-dark">
              <UserRound className="h-4 w-4" /> Meu perfil
            </button>
            <button onClick={() => { setMenuAberto(false); navigate('/configuracoes'); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-surface dark:hover:bg-surface-dark">
              <Settings className="h-4 w-4" /> Preferências
            </button>
            <div className="my-1 border-t" />
            <button onClick={async () => { await logout(); navigate('/login'); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-state-error hover:bg-state-error/10">
              <LogOut className="h-4 w-4" /> Sair do sistema
            </button>
          </div>
        </>
      )}
    </header>
  );
}
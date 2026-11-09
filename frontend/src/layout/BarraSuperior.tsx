import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Bell, ChevronDown, Search, UserRound, Settings, LogOut, TriangleAlert, XCircle, ClipboardList } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider.tsx';
import { api } from '../api/cliente.ts';
import type { DashboardResumo, Alerta } from '../api/types.ts';
import { ToggleTema } from '../tema/ToggleTema.tsx';

const FUSO = 'Africa/Maputo';
function hora(iso: string) {
  return new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit', timeZone: FUSO }).format(new Date(iso));
}
function iconeAlerta(a: Alerta) {
  if (a.tipo === 'ESGOTADO') return { Icone: XCircle, cor: 'bg-state-error/10 text-state-error' };
  if (a.tipo === 'STOCK_BAIXO') return { Icone: TriangleAlert, cor: 'bg-state-warn/10 text-state-warn' };
  return { Icone: ClipboardList, cor: 'bg-state-info/10 text-state-info' };
}

export function BarraSuperior() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [menuAberto, setMenuAberto] = useState(false);
  const [sinoAberto, setSinoAberto] = useState(false);

  const { data } = useQuery({ queryKey: ['dashboard'], queryFn: () => api.get<DashboardResumo>('/dashboard/resumo') });
  const alertas = data?.alertas ?? [];

  if (!usuario) return null;

  function pesquisar(e: FormEvent) { e.preventDefault(); navigate(`/inventario?query=${encodeURIComponent(query)}`); }
  const iniciais = usuario.nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

  return (
    <header className="relative flex h-16 shrink-0 items-center gap-4 border-b bg-card px-4 dark:bg-card-dark">
      <form onSubmit={pesquisar} className="relative w-full max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar material, código, categoria..."
          className="w-full rounded-lg border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary dark:bg-surface-dark" />
      </form>

      <div className="ml-auto flex items-center gap-3">
        {/* Sino com dropdown de notificações reais */}
        <div className="relative">
          <button onClick={() => setSinoAberto((v) => !v)} className="relative rounded-full p-2 text-muted hover:bg-surface dark:hover:bg-surface-dark" aria-label="Notificações">
            <Bell className="h-5 w-5" />
            {alertas.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-state-error px-1 text-[10px] font-bold text-white">{alertas.length}</span>
            )}
          </button>
          {sinoAberto && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setSinoAberto(false)} />
              <div className="absolute right-0 top-12 z-20 w-80 rounded-card border bg-card p-2 shadow-lg dark:bg-card-dark">
                <div className="flex items-center justify-between px-2 py-1">
                  <p className="text-sm font-semibold">Notificações</p>
                  <button onClick={() => { setSinoAberto(false); navigate('/dashboard'); }} className="text-xs font-medium text-primary hover:underline">Ver todos</button>
                </div>
                <div className="my-1 border-t" />
                {alertas.length === 0 ? (
                  <p className="px-2 py-4 text-center text-sm text-muted">Sem notificações.</p>
                ) : (
                  <ul className="max-h-80 space-y-1 overflow-y-auto">
                    {alertas.map((a, i) => {
                      const { Icone, cor } = iconeAlerta(a);
                      return (
                        <li key={i} className="flex items-start gap-2.5 rounded-md px-2 py-2 hover:bg-surface dark:hover:bg-surface-dark">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${cor}`}><Icone className="h-4 w-4" /></span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{a.titulo}</p>
                            <p className="truncate text-xs text-muted">{a.detalhe}</p>
                          </div>
                          <span className="shrink-0 text-[11px] text-muted">{hora(a.criadoEm)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>

        <ToggleTema />

        <button onClick={() => setMenuAberto((v) => !v)} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-surface dark:hover:bg-surface-dark">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">{iniciais}</span>
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
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">{iniciais}</span>
              <div className="leading-tight"><p className="text-sm font-medium">{usuario.nome}</p><p className="text-xs capitalize text-muted">{usuario.perfil.toLowerCase()}</p></div>
            </div>
            <div className="my-1 border-t" />
            <button onClick={() => { setMenuAberto(false); navigate('/configuracoes'); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-surface dark:hover:bg-surface-dark"><UserRound className="h-4 w-4" /> Meu perfil</button>
            <button onClick={() => { setMenuAberto(false); navigate('/configuracoes'); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-surface dark:hover:bg-surface-dark"><Settings className="h-4 w-4" /> Preferências</button>
            <div className="my-1 border-t" />
            <button onClick={async () => { await logout(); navigate('/login'); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-state-error hover:bg-state-error/10"><LogOut className="h-4 w-4" /> Sair do sistema</button>
          </div>
        </>
      )}
    </header>
  );
}
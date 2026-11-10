import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, X } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider.tsx';
import { ITENS_MENU } from '../auth/permissoes.ts';
import { Logo } from '../componentes/Logo.tsx';

// Em desktop (>=lg) é fixa. Em mobile é um drawer deslizante controlado por `aberto`.
export function Sidebar({ aberto, onFechar }: { aberto: boolean; onFechar: () => void }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  if (!usuario) return null;

  const seccoes = ['PRINCIPAL', 'GESTAO', 'SISTEMA'] as const;
  const rotuloSeccao = { PRINCIPAL: 'Principal', GESTAO: 'Gestão', SISTEMA: 'Sistema' } as const;

  function ir(path: string) {
    navigate(path);
    onFechar(); // fecha o drawer em mobile
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 flex-col bg-sidebar text-white transition-transform duration-200 lg:static lg:translate-x-0 dark:bg-sidebar-dark ${
        aberto ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center gap-2.5 px-4 py-4">
        <Logo tamanho={36} corChave="#ffffff" />
        <div className="leading-tight">
          <p className="font-semibold">Oficina<span className="text-primary">Gest</span></p>
          <p className="text-[10px] text-white/50">Gestão de Inventário para Oficinas</p>
        </div>
        <button onClick={onFechar} className="ml-auto rounded p-1 text-white/60 hover:bg-white/10 lg:hidden" aria-label="Fechar menu">
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-4 overflow-y-auto px-3 py-2">
        {seccoes.map((sec) => {
          const itens = ITENS_MENU.filter((i) => i.seccao === sec);
          if (itens.length === 0) return null;
          return (
            <div key={sec}>
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-white/40">{rotuloSeccao[sec]}</p>
              <div className="space-y-1">
                {itens.map((item) => {
                  const activo = pathname === item.path;
                  return (
                    <button key={item.path} onClick={() => ir(item.path)}
                      className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                        activo ? 'bg-primary font-medium text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}>
                      <item.icone className="h-4 w-4" />
                      {item.rotulo}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <button onClick={async () => { await logout(); navigate('/login'); }}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </div>
    </aside>
  );
}
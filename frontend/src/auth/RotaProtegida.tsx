import { Navigate, Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from './AuthProvider.tsx';
import { pode, type Accao } from './permissoes.ts';
import { ShieldAlert } from 'lucide-react';

// Esconder no menu NÃO chega: as rotas também estão protegidas.
export function RotaProtegida({ accao, children }: { accao?: Accao; children?: ReactNode }) {
  const { usuario, carregando } = useAuth();

  if (carregando) {
    return <div className="flex h-screen items-center justify-center text-muted">A carregar…</div>;
  }
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  if (accao && !pode(usuario.perfil, accao)) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-muted">
        <ShieldAlert className="h-10 w-10 text-state-warn" />
        <p className="font-medium">Sem permissão</p>
        <p className="text-sm">Não tem acesso a esta área com o perfil {usuario.perfil}.</p>
      </div>
    );
  }
  return children ? <>{children}</> : <Outlet />;
}
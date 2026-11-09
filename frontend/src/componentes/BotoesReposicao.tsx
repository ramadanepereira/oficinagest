import { RefreshCw, Undo2 } from 'lucide-react';
import type { Material, Perfil } from '../api/types.ts';
import { pode } from '../auth/permissoes.ts';

// Única mudança MANUAL de estado: entrar/sair de EM_REPOSICAO (secção 9).
// Só o ADMIN vê os botões, e só nos estados certos:
//   Iniciar  -> quando STOCK_BAIXO ou ESGOTADO
//   Cancelar -> quando EM_REPOSICAO
export function BotoesReposicao({ material, perfil, onIniciar, onCancelar, ocupado }: {
  material: Material;
  perfil: Perfil;
  onIniciar: () => void;
  onCancelar: () => void;
  ocupado?: boolean;
}) {
  if (!pode(perfil, 'gerirMateriais')) return null;
  const estado = material.stock?.estado;
  if (estado === 'STOCK_BAIXO' || estado === 'ESGOTADO') {
    return (
      <button onClick={onIniciar} disabled={ocupado} title="Iniciar reposição"
        className="rounded p-1.5 text-state-info hover:bg-state-info/10 disabled:opacity-50">
        <RefreshCw className="h-4 w-4" />
      </button>
    );
  }
  if (estado === 'EM_REPOSICAO') {
    return (
      <button onClick={onCancelar} disabled={ocupado} title="Cancelar reposição"
        className="rounded p-1.5 text-state-warn hover:bg-state-warn/10 disabled:opacity-50">
        <Undo2 className="h-4 w-4" />
      </button>
    );
  }
  return null;
}
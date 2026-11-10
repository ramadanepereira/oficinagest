import { useState } from 'react';
import { Plus, Check, X, RotateCcw } from 'lucide-react';
import { useRequisicoes, useMutacoesRequisicao, type RequisicaoDto } from './hooks.ts';
import { ModalRequisicao } from './ModalRequisicao.tsx';
import { Cartao } from '../../componentes/Cartao.tsx';
import { useAuth } from '../../auth/AuthProvider.tsx';
import { pode } from '../../auth/permissoes.ts';

const ESTADOS = [
  { valor: '', rotulo: 'Todos os estados' },
  { valor: 'PENDENTE', rotulo: 'Pendente' },
  { valor: 'APROVADA', rotulo: 'Aprovada' },
  { valor: 'REPROVADA', rotulo: 'Reprovada' },
  { valor: 'DEVOLVIDA', rotulo: 'Devolvida' },
];

const COR_ESTADO: Record<string, string> = {
  PENDENTE: 'bg-state-warn/10 text-state-warn',
  APROVADA: 'bg-state-ok/10 text-state-ok',
  REPROVADA: 'bg-state-error/10 text-state-error',
  DEVOLVIDA: 'bg-state-info/10 text-state-info',
};

const selectCls = 'rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary dark:bg-card-dark';

export function PaginaRequisicoes() {
  const { usuario } = useAuth();
  const podeAprovar = usuario ? pode(usuario.perfil, 'aprovarRequisicoes') : false;
  const podeCriar = usuario ? pode(usuario.perfil, 'criarRequisicoes') : false;

  const [filtroEstado, setFiltroEstado] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const { data, isLoading } = useRequisicoes({ estado: filtroEstado || undefined });
  const { aprovar, reprovar, devolver } = useMutacoesRequisicao();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Requisições</h1>
        {podeCriar && (
          <button onClick={() => setModalAberto(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
            <Plus className="h-4 w-4" /> Nova Requisição
          </button>
        )}
      </div>

      <Cartao className="p-4">
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className={selectCls}>
          {ESTADOS.map((e) => <option key={e.valor} value={e.valor}>{e.rotulo}</option>)}
        </select>
      </Cartao>

      <Cartao>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-surface text-left text-xs text-muted dark:bg-surface-dark">
                <th className="px-5 py-2.5 font-medium">Data</th>
                <th className="px-3 py-2.5 font-medium">Material</th>
                <th className="px-3 py-2.5 font-medium">Quantidade</th>
                <th className="px-3 py-2.5 font-medium">Mecânico</th>
                <th className="px-3 py-2.5 font-medium">Estado</th>
                {podeAprovar && <th className="px-3 py-2.5 text-right font-medium">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="px-5 py-8 text-center text-muted">A carregar…</td></tr>}
              {!isLoading && (data?.itens.length ?? 0) === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-muted">Sem requisições.</td></tr>
              )}
              {!isLoading && (data?.itens ?? []).map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="px-5 py-2.5 text-xs text-muted">
                    {new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(r.criadoEm))}
                  </td>
                  <td className="px-3 py-2.5">{r.material?.nome ?? '—'}</td>
                  <td className="px-3 py-2.5">{r.quantidade}</td>
                  <td className="px-3 py-2.5 text-muted">{r.mecanico?.nome ?? '—'}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${COR_ESTADO[r.estado]}`}>
                      {r.estado}
                    </span>
                  </td>
                  {podeAprovar && (
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1">
                        {r.estado === 'PENDENTE' && (
                          <>
                            <button onClick={() => aprovar.mutate(r.id)} className="rounded p-1.5 text-state-ok hover:bg-state-ok/10" title="Aprovar"><Check className="h-4 w-4" /></button>
                            <button onClick={() => reprovar.mutate(r.id)} className="rounded p-1.5 text-state-error hover:bg-state-error/10" title="Reprovar"><X className="h-4 w-4" /></button>
                          </>
                        )}
                        {r.estado === 'APROVADA' && (
                          <button onClick={() => devolver.mutate(r.id)} className="rounded p-1.5 text-state-info hover:bg-state-info/10" title="Marcar como devolvida"><RotateCcw className="h-4 w-4" /></button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Cartao>

      <ModalRequisicao aberto={modalAberto} onFechar={() => setModalAberto(false)} />
    </div>
  );
}
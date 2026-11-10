import { useState } from 'react';
import { Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { useListaCategorias, useMutacoesCategoria } from './hooks.ts';
import { ModalCategoria } from './ModalCategoria.tsx';
import { Confirmacao } from '../../componentes/Confirmacao.tsx';
import { Cartao } from '../../componentes/Cartao.tsx';
import type { Categoria } from '../../api/types.ts';

export function PaginaCategorias() {
  const { data, isLoading } = useListaCategorias();
  const { desativar, reativar } = useMutacoesCategoria();
  const [modalAberto, setModalAberto] = useState(false);
  const [aEditar, setAEditar] = useState<Categoria | null>(null);
  const [aDesativar, setADesativar] = useState<Categoria | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categorias</h1>
        <button onClick={() => { setAEditar(null); setModalAberto(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
          <Plus className="h-4 w-4" /> Nova Categoria
        </button>
      </div>

      <Cartao>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-surface text-left text-xs text-muted dark:bg-surface-dark">
                <th className="px-5 py-2.5 font-medium">Descrição</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={3} className="px-5 py-8 text-center text-muted">A carregar…</td></tr>}
              {!isLoading && (data?.categorias.length ?? 0) === 0 && (
                <tr><td colSpan={3} className="px-5 py-8 text-center text-muted">Sem categorias.</td></tr>
              )}
              {!isLoading && (data?.categorias ?? []).map((c) => (
                <tr key={c.id} className={`border-b last:border-0 ${!c.activo ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-2.5 font-medium">{c.descricao}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${c.activo ? 'bg-state-ok/10 text-state-ok' : 'bg-state-error/10 text-state-error'}`}>
                      {c.activo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setAEditar(c); setModalAberto(true); }} className="rounded p-1.5 text-state-info hover:bg-state-info/10" title="Editar"><Pencil className="h-4 w-4" /></button>
                      {c.activo ? (
                        <button onClick={() => setADesativar(c)} className="rounded p-1.5 text-state-error hover:bg-state-error/10" title="Desativar"><Trash2 className="h-4 w-4" /></button>
                      ) : (
                        <button onClick={() => reativar.mutate(c.id)} className="rounded p-1.5 text-state-ok hover:bg-state-ok/10" title="Reativar"><RotateCcw className="h-4 w-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Cartao>

      <ModalCategoria aberto={modalAberto} onFechar={() => setModalAberto(false)} categoria={aEditar} />
      <Confirmacao
        aberto={aDesativar !== null}
        onFechar={() => setADesativar(null)}
        onConfirmar={async () => {
          if (!aDesativar) return;
          try { await desativar.mutateAsync(aDesativar.id); setADesativar(null); }
          catch { /* mantém aberto */ }
        }}
        ocupado={desativar.isPending}
        titulo="Desativar categoria"
        mensagem={`Desativar "${aDesativar?.descricao}"? Os materiais já ligados mantêm-se, mas a categoria deixa de aparecer como opção em novos materiais.`}
      />
    </div>
  );
}
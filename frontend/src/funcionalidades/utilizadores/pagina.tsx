import { useState } from 'react';
import { Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { useUtilizadores, useMutacoesUsuario } from './hooks.ts';
import { ModalUsuario } from './ModalUsuario.tsx';
import { Confirmacao } from '../../componentes/Confirmacao.tsx';
import { Cartao } from '../../componentes/Cartao.tsx';
import type { Utilizador } from '../../api/types.ts';

const ROTULO_PERFIL = { ADMINISTRADOR: 'Administrador', ATENDENTE: 'Atendente', MECANICO: 'Mecânico' } as const;

export function PaginaUtilizadores() {
  const { data, isLoading } = useUtilizadores();
  const { desativar, reativar } = useMutacoesUsuario();
  const [modalAberto, setModalAberto] = useState(false);
  const [aEditar, setAEditar] = useState<Utilizador | null>(null);
  const [aDesativar, setADesativar] = useState<Utilizador | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Utilizadores</h1>
        <button onClick={() => { setAEditar(null); setModalAberto(true); }}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
          <Plus className="h-4 w-4" /> Novo Utilizador
        </button>
      </div>

      <Cartao>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-surface text-left text-xs text-muted dark:bg-surface-dark">
                <th className="px-5 py-2.5 font-medium">Nome</th>
                <th className="px-3 py-2.5 font-medium">Username</th>
                <th className="px-3 py-2.5 font-medium">Email</th>
                <th className="px-3 py-2.5 font-medium">Perfil</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="px-5 py-8 text-center text-muted">A carregar…</td></tr>}
              {!isLoading && (data?.utilizadores ?? []).map((u) => (
                <tr key={u.id} className={`border-b last:border-0 ${!u.activo ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-2.5 font-medium">{u.nome}</td>
                  <td className="px-3 py-2.5 text-muted">{u.username}</td>
                  <td className="px-3 py-2.5 text-muted">{u.email}</td>
                  <td className="px-3 py-2.5">{ROTULO_PERFIL[u.perfil]}</td>
                  <td className="px-3 py-2.5">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${u.activo ? 'bg-state-ok/10 text-state-ok' : 'bg-state-error/10 text-state-error'}`}>
                      {u.activo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { setAEditar(u); setModalAberto(true); }} className="rounded p-1.5 text-state-info hover:bg-state-info/10" title="Editar"><Pencil className="h-4 w-4" /></button>
                      {u.activo ? (
                        <button onClick={() => setADesativar(u)} className="rounded p-1.5 text-state-error hover:bg-state-error/10" title="Desativar"><Trash2 className="h-4 w-4" /></button>
                      ) : (
                        <button onClick={() => reativar.mutate(u.id)} disabled={reativar.isPending} className="rounded p-1.5 text-state-ok hover:bg-state-ok/10 disabled:opacity-50" title="Reativar"><RotateCcw className="h-4 w-4" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Cartao>

      <ModalUsuario aberto={modalAberto} onFechar={() => setModalAberto(false)} usuario={aEditar} />
      <Confirmacao
        aberto={aDesativar !== null}
        onFechar={() => setADesativar(null)}
        onConfirmar={async () => {
          if (!aDesativar) return;
          try { await desativar.mutateAsync(aDesativar.id); setADesativar(null); } catch { /* mantém */ }
        }}
        ocupado={desativar.isPending}
        titulo="Desativar utilizador"
        mensagem={`Desativar "${aDesativar?.nome}"? O utilizador deixa de conseguir entrar, mas o histórico é preservado.`}
      />
    </div>
  );
}
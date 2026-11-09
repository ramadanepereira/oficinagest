import { useState } from 'react';
import { Plus, Pencil, Trash2, RotateCcw, Search } from 'lucide-react';
import { useMateriais, useCategorias, useMutacoesMaterial, type FiltroInventario } from './hooks.ts';
import { ModalMaterial } from './ModalMaterial.tsx';
import { Confirmacao } from '../../componentes/Confirmacao.tsx';
import { BadgeEstado } from '../../componentes/BadgeEstado.tsx';
import { Cartao } from '../../componentes/Cartao.tsx';
import { useAuth } from '../../auth/AuthProvider.tsx';
import { pode } from '../../auth/permissoes.ts';
import type { Material } from '../../api/types.ts';
import { ApiError } from '../../api/cliente.ts';

const selectCls = 'rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary dark:bg-card-dark';

export function PaginaInventario() {
  const { usuario } = useAuth();
  const admin = usuario ? pode(usuario.perfil, 'gerirMateriais') : false;

  const [filtro, setFiltro] = useState<FiltroInventario>({ pagina: 1 });
  const [pesquisa, setPesquisa] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [aEditar, setAEditar] = useState<Material | null>(null);
  const [aDesativar, setADesativar] = useState<Material | null>(null);

  const { data, isLoading } = useMateriais(filtro);
  const { data: cat } = useCategorias();
  const { desativar, reativar } = useMutacoesMaterial();

  const nomeCategoria = (id: number) => cat?.categorias.find((c) => c.id === id)?.descricao ?? '—';
  const totalPaginas = Math.max(1, Math.ceil((data?.total ?? 0) / 8));

  function pesquisar(valor: string) {
    setPesquisa(valor);
    setFiltro((f) => ({ ...f, query: valor || undefined, pagina: 1 }));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Materiais</h1>
        {admin && (
          <button onClick={() => { setAEditar(null); setModalAberto(true); }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
            <Plus className="h-4 w-4" /> Adicionar Material
          </button>
        )}
      </div>

      <Cartao className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-52 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={pesquisa} onChange={(e) => pesquisar(e.target.value)} placeholder="Pesquisar material..."
              className="w-full rounded-lg border bg-surface py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary dark:bg-surface-dark" />
          </div>
          <select value={filtro.tipo ?? ''} onChange={(e) => setFiltro((f) => ({ ...f, tipo: e.target.value || undefined, pagina: 1 }))} className={selectCls}>
            <option value="">Todos os tipos</option>
            <option value="PECA">Peças</option>
            <option value="FERRAMENTA">Ferramentas</option>
            <option value="EQUIPAMENTO">Equipamentos</option>
          </select>
          <select value={filtro.categoria ?? ''} onChange={(e) => setFiltro((f) => ({ ...f, categoria: e.target.value ? Number(e.target.value) : undefined, pagina: 1 }))} className={selectCls}>
            <option value="">Todas as categorias</option>
            {(cat?.categorias ?? []).map((c) => <option key={c.id} value={c.id}>{c.descricao}</option>)}
          </select>
          <select value={filtro.estado ?? ''} onChange={(e) => setFiltro((f) => ({ ...f, estado: e.target.value || undefined, pagina: 1 }))} className={selectCls}>
            <option value="">Todos os estados</option>
            <option value="DISPONIVEL">Disponível</option>
            <option value="STOCK_BAIXO">Stock baixo</option>
            <option value="ESGOTADO">Esgotado</option>
            <option value="EM_REPOSICAO">Em reposição</option>
          </select>
          {admin && (
            <label className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" checked={!!filtro.incluirInactivos}
                onChange={(e) => setFiltro((f) => ({ ...f, incluirInactivos: e.target.checked, pagina: 1 }))}
                className="h-4 w-4 rounded accent-[#1f9d5a]" />
              Mostrar desativados
            </label>
          )}
        </div>
      </Cartao>

      <Cartao>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-surface text-left text-xs text-muted dark:bg-surface-dark">
                <th className="px-5 py-2.5 font-medium">Código</th>
                <th className="px-3 py-2.5 font-medium">Descrição</th>
                <th className="px-3 py-2.5 font-medium">Categoria</th>
                <th className="px-3 py-2.5 font-medium">Stock Atual</th>
                <th className="px-3 py-2.5 font-medium">Estado</th>
                {admin && <th className="px-3 py-2.5 text-right font-medium">Ações</th>}
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="px-5 py-8 text-center text-muted">A carregar…</td></tr>}
              {!isLoading && (data?.itens.length ?? 0) === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-muted">Sem materiais.</td></tr>
              )}
              {!isLoading && (data?.itens ?? []).map((m) => (
                <tr key={m.id} className={`border-b last:border-0 ${!m.activo ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-2.5 font-medium">{m.codigo}</td>
                  <td className="px-3 py-2.5">{m.nome}</td>
                  <td className="px-3 py-2.5 text-muted">{nomeCategoria(m.idCategoria)}</td>
                  <td className="px-3 py-2.5">{m.stock?.quantidade ?? 0}</td>
                  <td className="px-3 py-2.5">{m.stock ? <BadgeEstado estado={m.stock.estado} /> : '—'}</td>
                  {admin && (
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setAEditar(m); setModalAberto(true); }} className="rounded p-1.5 text-state-info hover:bg-state-info/10" title="Editar"><Pencil className="h-4 w-4" /></button>
                        {m.activo ? (
                          <button onClick={() => setADesativar(m)} className="rounded p-1.5 text-state-error hover:bg-state-error/10" title="Desativar"><Trash2 className="h-4 w-4" /></button>
                        ) : (
                          <button onClick={() => reativar.mutate(m.id)} className="rounded p-1.5 text-state-ok hover:bg-state-ok/10" title="Reativar"><RotateCcw className="h-4 w-4" /></button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 text-sm text-muted">
          <span>Mostrando {data?.itens.length ?? 0} de {data?.total ?? 0}</span>
          <div className="flex items-center gap-2">
            <button disabled={(filtro.pagina ?? 1) <= 1} onClick={() => setFiltro((f) => ({ ...f, pagina: (f.pagina ?? 1) - 1 }))}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Anterior</button>
            <span>{filtro.pagina ?? 1} / {totalPaginas}</span>
            <button disabled={(filtro.pagina ?? 1) >= totalPaginas} onClick={() => setFiltro((f) => ({ ...f, pagina: (f.pagina ?? 1) + 1 }))}
              className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Seguinte</button>
          </div>
        </div>
      </Cartao>

      <ModalMaterial aberto={modalAberto} onFechar={() => setModalAberto(false)} material={aEditar} />

      <Confirmacao
        aberto={aDesativar !== null}
        onFechar={() => setADesativar(null)}
        onConfirmar={async () => {
          if (!aDesativar) return;
          try { await desativar.mutateAsync(aDesativar.id); setADesativar(null); }
          catch { /* mantém aberto para mostrar erro */ }
        }}
        ocupado={desativar.isPending}
        titulo="Desativar material"
        mensagem={desativar.error instanceof ApiError && desativar.error.codigo === 'MATERIAL_COM_STOCK'
          ? desativar.error.message
          : `Remover "${aDesativar?.nome}" do inventário? O material é desativado (não apagado) e pode ser reativado.`}
      />
    </div>
  );
}
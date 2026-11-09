import { useMovimentos } from './hooks.ts';
import { FormMovimento } from './FormMovimento.tsx';
import { Cartao } from '../../componentes/Cartao.tsx';
import { useAuth } from '../../auth/AuthProvider.tsx';
import { pode } from '../../auth/permissoes.ts';
import { ArrowUp, ArrowDown } from 'lucide-react';

const FUSO = 'Africa/Maputo';
function fmt(iso: string) {
  return new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: FUSO }).format(new Date(iso));
}

export function PaginaMovimentos() {
  const { usuario } = useAuth();
  const admin = usuario ? pode(usuario.perfil, 'gerirMateriais') : false;
  const { data } = useMovimentos();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Movimentações</h1>

      <div className={`grid grid-cols-1 gap-4 ${admin ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
        <Cartao className="p-5"><FormMovimento modo="entrada" /></Cartao>
        <Cartao className="p-5"><FormMovimento modo="saida" /></Cartao>
        {admin && <Cartao className="p-5"><FormMovimento modo="ajuste" /></Cartao>}
      </div>

      <Cartao>
        <div className="px-5 pt-4"><h2 className="font-semibold">Histórico de Movimentos</h2></div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-y bg-surface text-left text-xs text-muted dark:bg-surface-dark">
                <th className="px-5 py-2 font-medium">Data/Hora</th>
                <th className="px-3 py-2 font-medium">Tipo</th>
                <th className="px-3 py-2 font-medium">Material</th>
                <th className="px-3 py-2 font-medium">Categoria</th>
                <th className="px-3 py-2 font-medium">Quantidade</th>
                <th className="px-3 py-2 font-medium">Responsável</th>
              </tr>
            </thead>
            <tbody>
              {(data?.itens ?? []).map((m) => {
                const entrada = m.tipo === 'ENTRADA' || m.tipo === 'AJUSTE_ENTRADA';
                return (
                  <tr key={m.id} className="border-b last:border-0">
                    <td className="px-5 py-2.5 text-xs text-muted">{fmt(m.criadoEm)}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${entrada ? 'bg-state-ok/10 text-state-ok' : 'bg-state-error/10 text-state-error'}`}>
                        {entrada ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                        {m.tipo.replace('_', ' ').toLowerCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">{m.nome}</td>
                    <td className="px-3 py-2.5 text-muted">{m.categoria}</td>
                    <td className={`px-3 py-2.5 font-semibold ${entrada ? 'text-state-ok' : 'text-state-error'}`}>{entrada ? '+' : '-'}{m.quantidade}</td>
                    <td className="px-3 py-2.5 text-muted">{m.utilizador}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Cartao>
    </div>
  );
}
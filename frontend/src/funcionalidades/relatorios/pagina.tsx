import { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { FileDown } from 'lucide-react';
import { useRelatorio, type Periodo, type FiltroRelatorio } from './hooks.ts';
import { useCategorias } from '../inventario/hooks.ts';
import { exportarRelatorioPdf } from './exportarPdf.ts';
import { Cartao } from '../../componentes/Cartao.tsx';

const selectCls = 'rounded-lg border bg-card px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary dark:bg-card-dark';

// No RELATÓRIO, porTipo = tipo de MOVIMENTO (não de material).
const ROTULO_MOV = {
  ENTRADA: { rotulo: 'Entradas', cor: 'text-state-ok' },
  SAIDA: { rotulo: 'Saídas', cor: 'text-state-error' },
  AJUSTE_ENTRADA: { rotulo: 'Ajustes de entrada', cor: 'text-state-info' },
  AJUSTE_SAIDA: { rotulo: 'Ajustes de saída', cor: 'text-state-warn' },
} as const;

export function PaginaRelatorios() {
  const [filtro, setFiltro] = useState<FiltroRelatorio>({ periodo: 'diario' });
  const { data: cat } = useCategorias();
  const { data, isLoading } = useRelatorio(filtro);

  const serie = (data?.porPeriodo ?? []).map((p) => ({
    periodo: p.periodo,
    Entradas: p.entradas + p.ajustesEntrada,
    Saídas: p.saidas + p.ajustesSaida,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        {data && (
          <button onClick={() => exportarRelatorioPdf(data, filtro)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
            <FileDown className="h-4 w-4" /> Descarregar PDF
          </button>
        )}
      </div>

      <Cartao className="p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select value={filtro.periodo} onChange={(e) => setFiltro((f) => ({ ...f, periodo: e.target.value as Periodo }))} className={selectCls}>
            <option value="diario">Diário (últimos 30 dias)</option>
            <option value="semanal">Semanal (últimas 12 semanas)</option>
            <option value="mensal">Mensal (últimos 12 meses)</option>
          </select>
          <select value={filtro.tipo ?? ''} onChange={(e) => setFiltro((f) => ({ ...f, tipo: e.target.value || undefined }))} className={selectCls}>
            <option value="">Todos os tipos</option>
            <option value="PECA">Peças</option>
            <option value="FERRAMENTA">Ferramentas</option>
            <option value="EQUIPAMENTO">Equipamentos</option>
          </select>
          <select value={filtro.idCategoria ?? ''} onChange={(e) => setFiltro((f) => ({ ...f, idCategoria: e.target.value ? Number(e.target.value) : undefined }))} className={selectCls}>
            <option value="">Todas as categorias</option>
            {(cat?.categorias ?? []).map((c) => <option key={c.id} value={c.id}>{c.descricao}</option>)}
          </select>
        </div>
      </Cartao>

      {isLoading && <p className="text-muted">A gerar relatório…</p>}

      {data && (
        <>
          {/* Cartões com rótulos correctos (tipo de movimento) */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <Cartao className="p-4">
              <p className="text-xs text-muted">Total de movimentos</p>
              <p className="text-2xl font-bold">{data.totalMovimentos}</p>
            </Cartao>
            {data.porTipo.map((t) => {
              const info = ROTULO_MOV[t.tipo as keyof typeof ROTULO_MOV];
              return (
                <Cartao key={t.tipo} className="p-4">
                  <p className="text-xs text-muted">{info?.rotulo ?? t.tipo}</p>
                  <p className={`text-2xl font-bold ${info?.cor ?? ''}`}>{t.total}</p>
                </Cartao>
              );
            })}
          </div>

          <Cartao className="p-5">
            <h2 className="mb-4 font-semibold">Movimentos por período</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serie}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                  <XAxis dataKey="periodo" tick={{ fontSize: 11, fill: '#6b7785' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7785' }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Entradas" fill="#1f9d5a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Saídas" fill="#c0443f" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Cartao>

          <Cartao>
            <div className="px-5 pt-4"><h2 className="font-semibold">Top 10 materiais mais movimentados</h2></div>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-y bg-surface text-left text-xs text-muted dark:bg-surface-dark">
                    <th className="px-5 py-2 font-medium">Código</th>
                    <th className="px-3 py-2 font-medium">Material</th>
                    <th className="px-3 py-2 font-medium">Movimentos</th>
                    <th className="px-3 py-2 font-medium">Quantidade total</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.topMateriais ?? []).map((m) => (
                    <tr key={m.idMaterial} className="border-b last:border-0">
                      <td className="px-5 py-2.5 font-medium">{m.codigo}</td>
                      <td className="px-3 py-2.5">{m.nome}</td>
                      <td className="px-3 py-2.5">{m.movimentos}</td>
                      <td className="px-3 py-2.5">{m.quantidadeTotal}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Cartao>
        </>
      )}
    </div>
  );
}
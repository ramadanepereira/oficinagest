import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';
import {
  Package, TriangleAlert, XCircle, RefreshCw, ArrowUp, ArrowDown,
  Bell, Clock, CalendarDays, Plus, ArrowLeftRight, ClipboardList, BarChart3,
  ChevronRight, TriangleAlert as IconeAlerta,
} from 'lucide-react';
import { api } from '../../api/cliente.ts';
import type { DashboardResumo } from '../../api/types.ts';
import { Cartao } from '../../componentes/Cartao.tsx';
import { useAuth } from '../../auth/AuthProvider.tsx';
import { pode } from '../../auth/permissoes.ts';

const FUSO = 'Africa/Maputo';

function fmtDataHora(iso: string) {
  const d = new Date(iso);
  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: FUSO,
  }).format(d);
}

export function DashboardPage() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get<DashboardResumo>('/dashboard/resumo'),
  });

  if (isLoading) return <p className="text-muted">A carregar painel…</p>;
  if (error || !data) return <p className="text-state-error">Erro ao carregar o dashboard.</p>;

  const hoje = data.movimentosUltimos7Dias[data.movimentosUltimos7Dias.length - 1];
  const agora = new Date();
  const dataLonga = new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'long', year: 'numeric', timeZone: FUSO }).format(agora);
  const hora = new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit', timeZone: FUSO }).format(agora);

  const cartoes = [
    { rotulo: 'Total de Materiais', valor: data.totais.materiais, Icone: Package, cor: 'bg-state-ok/10 text-state-ok', sub: 'activos', Trend: ArrowUp, corSub: 'text-state-ok' },
    { rotulo: 'Stock Baixo', valor: data.totais.stockBaixo, Icone: TriangleAlert, cor: 'bg-state-warn/10 text-state-warn', sub: 'abaixo do mínimo', Trend: ArrowDown, corSub: 'text-state-warn' },
    { rotulo: 'Esgotado', valor: data.totais.esgotado, Icone: XCircle, cor: 'bg-state-error/10 text-state-error', sub: 'sem unidades', Trend: ArrowDown, corSub: 'text-state-error' },
    { rotulo: 'Em Reposição', valor: data.totais.emReposicao, Icone: RefreshCw, cor: 'bg-state-info/10 text-state-info', sub: 'a aguardar entrada', Trend: ArrowUp, corSub: 'text-state-info' },
    { rotulo: 'Entradas (hoje)', valor: hoje?.entradas ?? 0, Icone: ArrowUp, cor: 'bg-state-ok/10 text-state-ok', sub: 'vs. ontem', Trend: ArrowUp, corSub: 'text-state-ok' },
    { rotulo: 'Saídas (hoje)', valor: hoje?.saidas ?? 0, Icone: ArrowDown, cor: 'bg-state-error/10 text-state-error', sub: 'vs. ontem', Trend: ArrowDown, corSub: 'text-state-error' },
  ];

  const acoes = [
    { rotulo: 'Novo Material', Icone: Plus, accao: 'gerirMateriais', path: '/inventario?novo=1' },
    { rotulo: 'Registar Movimentação', Icone: ArrowLeftRight, accao: 'registarMovimentos', path: '/movimentos' },
    { rotulo: 'Nova Requisição', Icone: ClipboardList, accao: 'criarRequisicoes', path: '/requisicoes?nova=1' },
    { rotulo: 'Ver Relatórios', Icone: BarChart3, accao: 'verRelatorios', path: '/relatorios' },
  ].filter((a) => usuario && pode(usuario.perfil, a.accao as any));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bem-vindo, {usuario?.nome.split(' ')[0]}!</h1>
          <p className="text-sm text-muted">Aqui está um resumo do estado do inventário da sua oficina.</p>
        </div>
        <p className="flex items-center gap-2 text-sm text-muted">
          <CalendarDays className="h-4 w-4" />
          {dataLonga}<br />{hora}
        </p>
      </div>

      {/* Cartões KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {cartoes.map((c) => (
          <Cartao key={c.rotulo} className="p-4">
            <div className="flex items-center gap-3">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${c.cor}`}>
                <c.Icone className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs leading-snug text-muted">{c.rotulo}</p>
                <p className="text-2xl font-bold leading-tight">{c.valor}</p>
                <p className={`flex items-center gap-1 text-[11px] ${c.corSub}`}>
                  <c.Trend className="h-3 w-3" /> {c.sub}
                </p>
              </div>
            </div>
          </Cartao>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Gráfico 7 dias */}
        <Cartao className="p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted" />
              <div>
                <h2 className="font-semibold">Movimentação de Stock</h2>
                <p className="text-xs text-muted">Últimos 7 dias</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#1f9d5a]" /> Entradas</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-[#64748b]" /> Saídas</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.movimentosUltimos7Dias} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid stroke="#94a3b8" strokeOpacity={0.15} vertical={false} />
                <XAxis dataKey="data" tickFormatter={(d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`} tick={{ fontSize: 11, fill: '#6b7785' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7785' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(v, n) => [v, n === 'entradas' ? 'Entradas' : 'Saídas']} labelFormatter={(d) => `Dia ${String(d).slice(8, 10)}/${String(d).slice(5, 7)}`} />
                <Area type="monotone" dataKey="entradas" stroke="#1f9d5a" strokeWidth={2} fill="#1f9d5a" fillOpacity={0.12} dot={{ r: 3 }} />
                <Area type="monotone" dataKey="saidas" stroke="#64748b" strokeWidth={2} fill="#64748b" fillOpacity={0.10} dot={{ r: 3 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Cartao>

        {/* Alertas */}
        <Cartao className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted" />
              <h2 className="font-semibold">Alertas e Notificações</h2>
            </div>
            <button className="text-xs font-medium text-primary hover:underline">Ver todos →</button>
          </div>
          <ul className="space-y-3">
            {data.alertas.length === 0 && <li className="text-sm text-muted">Sem alertas.</li>}
            {data.alertas.map((a, i) => {
              const cor = a.tipo === 'ESGOTADO' ? 'bg-state-error/10 text-state-error'
                : a.tipo === 'STOCK_BAIXO' ? 'bg-state-warn/10 text-state-warn'
                : 'bg-state-info/10 text-state-info';
              return (
                <li key={i} className="flex items-start gap-3">
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${cor}`}>
                    <IconeAlerta className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.titulo}</p>
                    <p className="truncate text-xs text-muted">{a.detalhe}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-muted">
                    {new Intl.DateTimeFormat('pt-PT', { hour: '2-digit', minute: '2-digit', timeZone: FUSO }).format(new Date(a.criadoEm))}
                  </span>
                </li>
              );
            })}
          </ul>
        </Cartao>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Últimas movimentações */}
        <Cartao className="xl:col-span-2">
          <div className="flex items-center justify-between px-5 pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted" />
              <h2 className="font-semibold">Últimas Movimentações</h2>
            </div>
            <button onClick={() => navigate('/movimentos')} className="text-xs font-medium text-primary hover:underline">Ver todas</button>
          </div>
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
                {data.ultimasMovimentacoes.map((m) => {
                  const entrada = m.tipo === 'ENTRADA' || m.tipo === 'AJUSTE_ENTRADA';
                  return (
                    <tr key={m.id} className="border-b last:border-0">
                      <td className="px-5 py-2.5 text-xs text-muted">{fmtDataHora(m.criadoEm)}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${entrada ? 'bg-state-ok/10 text-state-ok' : 'bg-state-error/10 text-state-error'}`}>
                          {entrada ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          {entrada ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">{m.nome}</td>
                      <td className="px-3 py-2.5 text-muted">{m.categoria}</td>
                      <td className={`px-3 py-2.5 font-semibold ${entrada ? 'text-state-ok' : 'text-state-error'}`}>
                        {entrada ? '+' : '-'}{m.quantidade}
                      </td>
                      <td className="px-3 py-2.5 text-muted">{m.utilizador}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Cartao>

        {/* Ações rápidas */}
        <Cartao className="p-5">
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4 text-muted" />
            <h2 className="font-semibold">Ações Rápidas</h2>
          </div>
          <div className="space-y-2.5">
            {acoes.map((a) => (
              <button
                key={a.rotulo}
                onClick={() => navigate(a.path)}
                className="flex w-full items-center justify-between rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
              >
                <span className="flex items-center gap-2">
                  <a.Icone className="h-4 w-4" /> {a.rotulo}
                </span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ))}
          </div>
        </Cartao>
      </div>
    </div>
  );
}
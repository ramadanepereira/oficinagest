import type { TipoMovimento } from '../../domain/stock/TipoMovimento.js';

export interface AlertaResumo {
  tipo: 'STOCK_BAIXO' | 'ESGOTADO' | 'REQUISICOES_PENDENTES';
  titulo: string;
  detalhe: string;
  criadoEm: Date;
}

export interface MovimentoResumo {
  id: number;
  idMaterial: number;
  codigo: string;
  nome: string;
  categoria: string;
  tipo: TipoMovimento;
  quantidade: number;
  idUsuario: number;
  utilizador: string;
  observacao?: string;
  criadoEm: Date;
}

export interface MovimentosPorDia {
  data: string;
  entradas: number;
  saidas: number;
}

export interface ContagemPorTipo {
  tipo: 'PECA' | 'FERRAMENTA' | 'EQUIPAMENTO';
  total: number;
}

export interface TotaisStock {
  materiais: number;
  stockBaixo: number;
  esgotado: number;
  emReposicao: number;
}

export interface DashboardRepository {
  totais(): Promise<TotaisStock>;
  contagemPorTipo(): Promise<ContagemPorTipo[]>;
  movimentosUltimos7Dias(): Promise<MovimentosPorDia[]>;
  ultimasMovimentacoes(limite: number): Promise<MovimentoResumo[]>;
  alertas(): Promise<AlertaResumo[]>;
}
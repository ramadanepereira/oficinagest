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
  tipo: TipoMovimento;
  quantidade: number;
  idUsuario: number;
  utilizador: string;
  observacao?: string;
  criadoEm: Date;
}

export interface MovimentosPorDia {
  data: string;       // ISO 'YYYY-MM-DD'
  entradas: number;
  saidas: number;
}

export interface ContagemPorTipo {
  tipo: 'PECA' | 'FERRAMENTA' | 'EQUIPAMENTO';
  total: number;
}

export interface TotaisStock {
  materiais: number;     // só activos
  stockBaixo: number;    // STOCK_BAIXO e activo
  esgotado: number;      // ESGOTADO e activo
  emReposicao: number;   // EM_REPOSICAO e activo
}

export interface DashboardRepository {
  totais(): Promise<TotaisStock>;
  contagemPorTipo(): Promise<ContagemPorTipo[]>;
  movimentosUltimos7Dias(): Promise<MovimentosPorDia[]>;
  ultimasMovimentacoes(limite: number): Promise<MovimentoResumo[]>;
  alertas(): Promise<AlertaResumo[]>;
}
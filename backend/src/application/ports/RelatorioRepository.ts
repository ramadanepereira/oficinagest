import type { TipoMovimento } from '../../domain/stock/TipoMovimento.js';

export type Periodo = 'diario' | 'semanal' | 'mensal';

export interface FiltroRelatorio {
  periodo: Periodo;
  idMaterial?: number;
  idCategoria?: number;
  tipo?: TipoMovimento;
  desde?: Date;
  ate?: Date;
}

export interface MovimentosPorPeriodo {
  periodo: string;         // 'YYYY-MM-DD' / 'YYYY-Www' / 'YYYY-MM'
  entradas: number;
  saidas: number;
  ajustesEntrada: number;
  ajustesSaida: number;
  total: number;
}

export interface TotalPorTipo {
  tipo: TipoMovimento;
  total: number;
}

export interface MaterialMovimentado {
  idMaterial: number;
  codigo: string;
  nome: string;
  movimentos: number;
  quantidadeTotal: number;
}

export interface RelatorioMovimentos {
  periodo: Periodo;
  desde: Date;
  ate: Date;
  totalMovimentos: number;
  porPeriodo: MovimentosPorPeriodo[];
  porTipo: TotalPorTipo[];
  topMateriais: MaterialMovimentado[];
}

export interface RelatorioRepository {
  gerarMovimentos(filtro: FiltroRelatorio): Promise<RelatorioMovimentos>;
}
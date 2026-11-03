import type { Requisicao } from '../../domain/requisicao/Requisicao.js';

export interface FiltroRequisicoes {
  idMecanico?: number;
  estado?: string;
  pagina?: number;
  tamanho?: number;
}

export interface RequisicaoRepository {
  listar(filtro: FiltroRequisicoes): Promise<{ itens: Requisicao[]; total: number }>;
  obterPorId(id: number): Promise<Requisicao | null>;
  criar(r: Requisicao): Promise<Requisicao>;
  guardar(r: Requisicao): Promise<void>;
  existemPendentesPorMaterial(idMaterial: number): Promise<boolean>;
}
import type { Requisicao } from '../../domain/requisicao/Requisicao.js';
import type { EstadoRequisicao } from '../../domain/requisicao/EstadoRequisicao.js';

export interface FiltroRequisicoes {
  idMecanico?: number;
  estado?: string;
  pagina?: number;
  tamanho?: number;
}

// Vista de leitura para listagem: a requisição + os nomes ligados (JOIN),
// para o frontend mostrar "Material" e "Mecânico" sem pedidos extra.
export interface RequisicaoComNomes {
  id: number;
  idMaterial: number;
  idMecanico: number;
  idAtendente: number | null;
  quantidade: number;
  estado: EstadoRequisicao;
  criadoEm: Date;
  material: { id: number; codigo: string; nome: string } | null;
  mecanico: { id: number; nome: string } | null;
  atendente: { id: number; nome: string } | null;
}

export interface RequisicaoRepository {
  listar(filtro: FiltroRequisicoes): Promise<{ itens: Requisicao[]; total: number }>;
  listarComNomes(filtro: FiltroRequisicoes): Promise<{ itens: RequisicaoComNomes[]; total: number }>;
  obterPorId(id: number): Promise<Requisicao | null>;
  criar(r: Requisicao): Promise<Requisicao>;
  guardar(r: Requisicao): Promise<void>;
  existemPendentesPorMaterial(idMaterial: number): Promise<boolean>;
}
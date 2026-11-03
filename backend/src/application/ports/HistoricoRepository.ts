import type { TipoMovimento } from '../../domain/stock/TipoMovimento.js';

export interface RegistoMovimento {
  idMaterial: number;
  tipo: TipoMovimento;
  quantidade: number;
  idUsuario: number;
  observacao?: string;
}

export interface RegistoAlteracao {
  idMaterial: number;
  idUsuario: number;
  campo: string;
  valorAntigo?: string;
  valorNovo?: string;
}

export interface FiltroMovimentos {
  idMaterial?: number;
  tipo?: TipoMovimento;
  idUsuario?: number;
  desde?: Date;
  ate?: Date;
  pagina?: number;
  tamanho?: number;
}

export interface MovimentoPublico {
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

// RN05/RN07: toda a movimentação e alteração fica registada (data + utilizador).
export interface HistoricoRepository {
  registarMovimento(mov: RegistoMovimento): Promise<void>;
  registarAlteracao(alt: RegistoAlteracao): Promise<void>;
  listarMovimentos(filtro: FiltroMovimentos): Promise<{ itens: MovimentoPublico[]; total: number }>;
}
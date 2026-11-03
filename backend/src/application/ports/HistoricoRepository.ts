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

// RN05/RN07: toda a movimentação e alteração fica registada (data + utilizador).
export interface HistoricoRepository {
  registarMovimento(mov: RegistoMovimento): Promise<void>;
  registarAlteracao(alt: RegistoAlteracao): Promise<void>;
}
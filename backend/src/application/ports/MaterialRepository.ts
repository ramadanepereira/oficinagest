import type { Material } from '../../domain/material/Material.js';

export interface FiltroMateriais {
  query?: string;
  tipo?: string;
  categoria?: number;
  estado?: string;
  incluirInactivos?: boolean;
  pagina?: number;
  tamanho?: number;
}

export interface MaterialRepository {
  listar(filtro: FiltroMateriais): Promise<{ itens: Material[]; total: number }>;
  obterPorId(id: number): Promise<Material | null>;
  codigoExiste(codigo: string, ignorarId?: number): Promise<boolean>;
  criar(m: Material, quantidadeInicial: number, stockMinimo: number): Promise<Material>;
  atualizar(id: number, dados: { nome?: string; unidade?: string; stockMinimo?: number }): Promise<Material | null>;
  desativar(id: number): Promise<boolean>;
  reativar(id: number): Promise<boolean>;
  obterQuantidade(id: number): Promise<number>;
}
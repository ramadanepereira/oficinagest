import type { CategoriaMaterial } from '../../domain/categoria/CategoriaMaterial.js';
export interface CategoriaRepository {
  listar(): Promise<CategoriaMaterial[]>;
  listarActivas(): Promise<CategoriaMaterial[]>;
  obterPorId(id: number): Promise<CategoriaMaterial | null>;
  criar(categoria: CategoriaMaterial): Promise<CategoriaMaterial>;
  atualizar(id: number, descricao: string): Promise<CategoriaMaterial | null>;
  desativar(id: number): Promise<boolean>;
  reativar(id: number): Promise<boolean>;
  descricaoExiste(descricao: string, ignorarId?: number): Promise<boolean>;
}
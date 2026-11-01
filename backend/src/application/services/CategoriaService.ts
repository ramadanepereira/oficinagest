import { CategoriaMaterial } from '../../domain/categoria/CategoriaMaterial.js';
import type { CategoriaRepository } from '../ports/CategoriaRepository.js';
import type { CriarCategoriaDto, AtualizarCategoriaDto } from '../../presentation/dto/categoria.dto.js';
export class CategoriaService {
  constructor(private repositorio: CategoriaRepository) {}
  async listar() {
    const categorias = await this.repositorio.listar();
    return categorias.map((c) => c.resumoPublico());
  }
  async listarActivas() {
    const categorias = await this.repositorio.listarActivas();
    return categorias.map((c) => c.resumoPublico());
  }
  async criar(dto: CriarCategoriaDto) {
    const existe = await this.repositorio.descricaoExiste(dto.descricao);
    if (existe) throw new DescricaoDuplicadaError();
    const categoria = new CategoriaMaterial({ id: 0, descricao: dto.descricao, activo: true });
    const criada = await this.repositorio.criar(categoria);
    return criada.resumoPublico();
  }
  async atualizar(id: number, dto: AtualizarCategoriaDto) {
    const existente = await this.repositorio.obterPorId(id);
    if (!existente) throw new CategoriaNaoEncontradaError();
    const existe = await this.repositorio.descricaoExiste(dto.descricao, id);
    if (existe) throw new DescricaoDuplicadaError();
    const atualizada = await this.repositorio.atualizar(id, dto.descricao);
    return atualizada?.resumoPublico() ?? null;
  }
  async desativar(id: number) {
    const existente = await this.repositorio.obterPorId(id);
    if (!existente) throw new CategoriaNaoEncontradaError();
    return this.repositorio.desativar(id);
  }
}
export class DescricaoDuplicadaError extends Error { constructor() { super('Descrição já existe'); this.name = 'DescricaoDuplicadaError'; } }
export class CategoriaNaoEncontradaError extends Error { constructor() { super('Categoria não encontrada'); this.name = 'CategoriaNaoEncontradaError'; } }
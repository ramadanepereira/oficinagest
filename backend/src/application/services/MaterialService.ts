import { MaterialFactory } from '../../domain/material/MaterialFactory.js';
import type { MaterialRepository, FiltroMateriais } from '../ports/MaterialRepository.js';
import type { CriarMaterialDto, AtualizarMaterialDto } from '../../presentation/dto/material.dto.js';

export class MaterialService {
  constructor(private repositorio: MaterialRepository) {}

  async listar(f: FiltroMateriais) {
    const { itens, total } = await this.repositorio.listar(f);
    return { itens: itens.map((m) => m.resumoPublico()), total };
  }

  async obterPorId(id: number) {
    const m = await this.repositorio.obterPorId(id);
    return m?.resumoPublico() ?? null;
  }

  async criar(dto: CriarMaterialDto) {
    // RN01/RN06: código único (mesmo depois de desactivado).
    if (await this.repositorio.codigoExiste(dto.codigo)) throw new CodigoDuplicadoError();
    const material = MaterialFactory.criar(dto.tipo, {
      id: 0, codigo: dto.codigo, nome: dto.nome, tipo: dto.tipo,
      idCategoria: dto.idCategoria, unidade: dto.unidade,
      activo: true, criadoEm: new Date(),
    });
    const criado = await this.repositorio.criar(material, dto.quantidadeInicial, dto.stockMinimo);
    return criado.resumoPublico();
  }

  async atualizar(id: number, dto: AtualizarMaterialDto) {
    const existente = await this.repositorio.obterPorId(id);
    if (!existente) throw new MaterialNaoEncontradoError();
    const atualizado = await this.repositorio.atualizar(id, dto);
    return atualizado?.resumoPublico() ?? null;
  }

  // Remoção lógica (secção 6.5): só se stock = 0. A verificação de requisições
  // pendentes é adicionada no Incremento 2.
  async desativar(id: number) {
    const existente = await this.repositorio.obterPorId(id);
    if (!existente) throw new MaterialNaoEncontradoError();
    const qtd = await this.repositorio.obterQuantidade(id);
    if (qtd > 0) throw new MaterialComStockError();
    return this.repositorio.desativar(id);
  }

  async reativar(id: number) {
    const existente = await this.repositorio.obterPorId(id);
    if (!existente) throw new MaterialNaoEncontradoError();
    return this.repositorio.reativar(id);
  }
}

export class CodigoDuplicadoError extends Error { constructor() { super('Código já existe'); this.name = 'CodigoDuplicadoError'; } }
export class MaterialNaoEncontradoError extends Error { constructor() { super('Material não encontrado'); this.name = 'MaterialNaoEncontradoError'; } }
export class MaterialComStockError extends Error { constructor() { super('Material com stock; faça um ajuste de saída antes de remover'); this.name = 'MaterialComStockError'; } }
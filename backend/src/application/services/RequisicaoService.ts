import { Requisicao } from '../../domain/requisicao/Requisicao.js';
import { Quantidade } from '../../domain/stock/Quantidade.js';
import type { RequisicaoRepository, FiltroRequisicoes } from '../ports/RequisicaoRepository.js';
import type { MaterialRepository } from '../ports/MaterialRepository.js';

export class RequisicaoService {
  constructor(
    private repositorio: RequisicaoRepository,
    private materiais: MaterialRepository,
  ) {}

  async listar(f: FiltroRequisicoes) {
    return this.repositorio.listarComNomes(f);
  }

  // Criar requisição: valida quantidade (RN11) e que o material existe e está activo.
  async criar(dto: { idMaterial: number; quantidade: number }, idMecanico: number) {
    const material = await this.materiais.obterPorId(dto.idMaterial);
    if (!material || !material.activo) throw new MaterialNaoEncontradoError();
    // RN11: quantidade inteira > 0.
    Quantidade.deMovimento(dto.quantidade);
    const r = new Requisicao({
      id: 0, idMaterial: dto.idMaterial, idMecanico, idAtendente: null,
      quantidade: dto.quantidade, estado: 'PENDENTE', criadoEm: new Date(),
    });
    const criada = await this.repositorio.criar(r);
    return criada.resumoPublico();
  }

  async aprovar(id: number, idAtendente: number) {
    const r = await this.obterOuErro(id);
    r.aprovar(idAtendente);
    await this.repositorio.guardar(r);
    return r.resumoPublico();
  }

  async reprovar(id: number, idAtendente: number) {
    const r = await this.obterOuErro(id);
    r.reprovar(idAtendente);
    await this.repositorio.guardar(r);
    return r.resumoPublico();
  }

  async devolver(id: number) {
    const r = await this.obterOuErro(id);
    r.devolver();
    await this.repositorio.guardar(r);
    return r.resumoPublico();
  }

  private async obterOuErro(id: number): Promise<Requisicao> {
    const r = await this.repositorio.obterPorId(id);
    if (!r) throw new RequisicaoNaoEncontradaError();
    return r;
  }
}

export class RequisicaoNaoEncontradaError extends Error {
  constructor() { super('Requisição não encontrada'); this.name = 'RequisicaoNaoEncontradaError'; }
}
export class MaterialNaoEncontradoError extends Error {
  constructor() { super('Material não encontrado'); this.name = 'MaterialNaoEncontradoError'; }
}
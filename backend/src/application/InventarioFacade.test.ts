import { describe, it, expect, beforeEach } from 'vitest';
import { InventarioFacade, MaterialComStockError, MaterialComRequisicoesError } from './InventarioFacade.js';
import { StockMaterial } from '../domain/stock/StockMaterial.js';
import { Quantidade } from '../domain/stock/Quantidade.js';
import { StockInsuficienteError } from '../domain/stock/StockInsuficienteError.js';
import { TransicaoInvalidaError } from '../domain/stock/TransicaoInvalidaError.js';
import { QuantidadeInvalidaError } from '../domain/stock/QuantidadeInvalidaError.js';
import type { UnitOfWork, ContextoTransacao, MaterialRepositoryTransacional, RequisicaoRepositoryTransacional } from './ports/UnitOfWork.js';
import type { StockRepository } from './ports/StockRepository.js';
import type { HistoricoRepository, RegistoMovimento, RegistoAlteracao } from './ports/HistoricoRepository.js';

// === REPOSITORIOS EM MEMORIA: provam que a Facade NAO depende do PostgreSQL ===
class MemStock implements StockRepository {
  mapa = new Map<number, StockMaterial>();
  semear(id: number, qtd: number, min: number) {
    this.mapa.set(id, StockMaterial.criar(Quantidade.deStock(qtd), min));
  }
  async obterParaAtualizacao(id: number) { return this.mapa.get(id) ?? null; }
  async obter(id: number) { return this.mapa.get(id) ?? null; }
  async guardar(id: number, stock: StockMaterial) { this.mapa.set(id, stock); }
}
class MemHistorico implements HistoricoRepository {
  movimentos: RegistoMovimento[] = [];
  alteracoes: RegistoAlteracao[] = [];
  async registarMovimento(m: RegistoMovimento) { this.movimentos.push(m); }
  async registarAlteracao(a: RegistoAlteracao) { this.alteracoes.push(a); }
}
class MemMateriais implements MaterialRepositoryTransacional {
  activos = new Map<number, boolean>();
  async desativar(id: number) { this.activos.set(id, false); return true; }
  async reativar(id: number) { this.activos.set(id, true); return true; }
}
class MemRequisicoes implements RequisicaoRepositoryTransacional {
  pendentes = new Set<number>();
  async existemPendentesPorMaterial(id: number) { return this.pendentes.has(id); }
}
class MemUow implements UnitOfWork {
  constructor(
    public stock: MemStock,
    public historico: MemHistorico,
    public materiais: MemMateriais,
    public requisicoes: MemRequisicoes,
  ) {}
  async executar<T>(trabalho: (tx: ContextoTransacao) => Promise<T>): Promise<T> {
    return trabalho({
      stock: this.stock,
      historico: this.historico,
      materiais: this.materiais,
      requisicoes: this.requisicoes,
    });
  }
}

let stock: MemStock; let historico: MemHistorico; let materiais: MemMateriais;
let requisicoes: MemRequisicoes; let facade: InventarioFacade;

beforeEach(() => {
  stock = new MemStock();
  historico = new MemHistorico();
  materiais = new MemMateriais();
  requisicoes = new MemRequisicoes();
  facade = new InventarioFacade(new MemUow(stock, historico, materiais, requisicoes));
});

describe('InventarioFacade (com repositórios em memória)', () => {
  it('entrada soma e muda estado ESGOTADO -> DISPONIVEL', async () => {
    stock.semear(1, 0, 5);
    const r = await facade.registarEntrada({ idMaterial: 1, quantidade: 10, idUsuario: 1 });
    expect(r.quantidade).toBe(10);
    expect(r.estado).toBe('DISPONIVEL');
    expect(historico.movimentos).toHaveLength(1);
    expect(historico.movimentos[0].tipo).toBe('ENTRADA');
  });

  it('saida com stock insuficiente lança StockInsuficienteError e NÃO regista', async () => {
    stock.semear(1, 2, 1);
    await expect(facade.registarSaida({ idMaterial: 1, quantidade: 5, idUsuario: 1 }))
      .rejects.toThrow(StockInsuficienteError);
    expect(stock.mapa.get(1)!.quantidade.valor).toBe(2); // inalterado
    expect(historico.movimentos).toHaveLength(0);
  });

  it('saida que esgota muda para ESGOTADO e regista SAIDA', async () => {
    stock.semear(1, 5, 2);
    const r = await facade.registarSaida({ idMaterial: 1, quantidade: 5, idUsuario: 1 });
    expect(r.quantidade).toBe(0);
    expect(r.estado).toBe('ESGOTADO');
    expect(historico.movimentos[0].tipo).toBe('SAIDA');
  });

  it('ajuste sem observação lança erro', async () => {
    stock.semear(1, 5, 2);
    await expect(facade.registarAjuste({ idMaterial: 1, quantidade: 2, idUsuario: 1, observacao: '' }))
      .rejects.toThrow(QuantidadeInvalidaError);
  });

  it('ajuste negativo regista AJUSTE_SAIDA', async () => {
    stock.semear(1, 10, 2);
    const r = await facade.registarAjuste({ idMaterial: 1, quantidade: -4, idUsuario: 1, observacao: 'Inventário' });
    expect(r.quantidade).toBe(6);
    expect(historico.movimentos[0].tipo).toBe('AJUSTE_SAIDA');
  });

  it('iniciarReposicao em DISPONIVEL lança TransicaoInvalidaError', async () => {
    stock.semear(1, 10, 2);
    await expect(facade.iniciarReposicao({ idMaterial: 1, idUsuario: 1 }))
      .rejects.toThrow(TransicaoInvalidaError);
  });

  it('iniciarReposicao em STOCK_BAIXO muda para EM_REPOSICAO e regista alteração', async () => {
    stock.semear(1, 3, 5);
    const r = await facade.iniciarReposicao({ idMaterial: 1, idUsuario: 1 });
    expect(r.estado).toBe('EM_REPOSICAO');
    expect(historico.alteracoes).toHaveLength(1);
    expect(historico.alteracoes[0].campo).toBe('estado');
  });

  it('cancelarReposicao recalcula pela quantidade', async () => {
    stock.semear(1, 3, 5);
    await facade.iniciarReposicao({ idMaterial: 1, idUsuario: 1 });
    const r = await facade.cancelarReposicao({ idMaterial: 1, idUsuario: 1 });
    expect(r.estado).toBe('STOCK_BAIXO');
  });

  it('desactivarMaterial com stock > 0 lança MaterialComStockError', async () => {
    stock.semear(1, 5, 2);
    await expect(facade.desactivarMaterial({ idMaterial: 1, idUsuario: 1 }))
      .rejects.toThrow(MaterialComStockError);
  });

  it('desactivarMaterial com requisição pendente lança MaterialComRequisicoesError', async () => {
    stock.semear(1, 0, 2);
    requisicoes.pendentes.add(1);
    await expect(facade.desactivarMaterial({ idMaterial: 1, idUsuario: 1 }))
      .rejects.toThrow(MaterialComRequisicoesError);
  });

  it('desactivarMaterial com stock 0 e sem pendentes desactiva e regista', async () => {
    stock.semear(1, 0, 2);
    const ok = await facade.desactivarMaterial({ idMaterial: 1, idUsuario: 1 });
    expect(ok).toBe(true);
    expect(materiais.activos.get(1)).toBe(false);
    expect(historico.alteracoes[0].campo).toBe('activo');
  });

  it('consultarStock devolve o resumo', async () => {
    stock.semear(1, 7, 2);
    const r = await facade.consultarStock(1);
    expect(r).toEqual({ quantidade: 7, stockMinimo: 2, estado: 'DISPONIVEL' });
  });
});
import { describe, it, expect } from 'vitest';
import { StockMaterial } from './StockMaterial.js';
import { Quantidade } from './Quantidade.js';

describe('StockMaterial (agregado + State)', () => {
  it('criar() calcula estado inicial pela quantidade (regra 6.2)', () => {
    expect(StockMaterial.criar(Quantidade.deStock(0), 5).nomeEstado()).toBe('ESGOTADO');
    expect(StockMaterial.criar(Quantidade.deStock(3), 5).nomeEstado()).toBe('STOCK_BAIXO');
    expect(StockMaterial.criar(Quantidade.deStock(10), 5).nomeEstado()).toBe('DISPONIVEL');
  });

  it('entrada em ESGOTADO acima do mínimo → DISPONIVEL', () => {
    const s = StockMaterial.criar(Quantidade.deStock(0), 5);
    s.adicionarEntrada(Quantidade.deMovimento(10), new Date());
    expect(s.nomeEstado()).toBe('DISPONIVEL');
    expect(s.quantidade.valor).toBe(10);
  });

  it('saída que baixa ao mínimo → STOCK_BAIXO', () => {
    const s = StockMaterial.criar(Quantidade.deStock(10), 5);
    s.retirarSaida(Quantidade.deMovimento(5), new Date());
    expect(s.nomeEstado()).toBe('STOCK_BAIXO');
  });

  it('saída que esgota → ESGOTADO', () => {
    const s = StockMaterial.criar(Quantidade.deStock(5), 5);
    s.retirarSaida(Quantidade.deMovimento(5), new Date());
    expect(s.nomeEstado()).toBe('ESGOTADO');
  });

  it('iniciarReposicao em STOCK_BAIXO → EM_REPOSICAO', () => {
    const s = StockMaterial.criar(Quantidade.deStock(3), 5);
    s.iniciarReposicao();
    expect(s.nomeEstado()).toBe('EM_REPOSICAO');
  });

  it('saida durante EM_REPOSICAO mantém EM_REPOSICAO mesmo a 0', () => {
    const s = StockMaterial.criar(Quantidade.deStock(3), 5);
    s.iniciarReposicao();
    s.retirarSaida(Quantidade.deMovimento(3), new Date());
    expect(s.quantidade.valor).toBe(0);
    expect(s.nomeEstado()).toBe('EM_REPOSICAO');
  });

  it('cancelarReposicao recalcula pela quantidade', () => {
    const s = StockMaterial.criar(Quantidade.deStock(3), 5);
    s.iniciarReposicao();
    s.adicionarEntrada(Quantidade.deMovimento(10), new Date());
    // entrada com qtd>min em EM_REPOSICAO já passa a DISPONIVEL
    expect(s.nomeEstado()).toBe('DISPONIVEL');
    const s2 = StockMaterial.criar(Quantidade.deStock(3), 5);
    s2.iniciarReposicao();
    s2.cancelarReposicao();
    expect(s2.nomeEstado()).toBe('STOCK_BAIXO');
  });

  it('alterarMinimo recalcula estado (excepto EM_REPOSICAO)', () => {
    const s = StockMaterial.criar(Quantidade.deStock(10), 5);
    s.alterarMinimo(10);
    expect(s.nomeEstado()).toBe('STOCK_BAIXO');
    const r = StockMaterial.criar(Quantidade.deStock(3), 5);
    r.iniciarReposicao();
    r.alterarMinimo(1);
    expect(r.nomeEstado()).toBe('EM_REPOSICAO'); // não recalcula
  });

  it('datas de última entrada/saida são actualizadas', () => {
    const s = StockMaterial.criar(Quantidade.deStock(5), 1);
    expect(s.dataUltimaEntrada).toBeNull();
    const t = new Date();
    s.adicionarEntrada(Quantidade.deMovimento(2), t);
    expect(s.dataUltimaEntrada).toEqual(t);
    s.retirarSaida(Quantidade.deMovimento(1), t);
    expect(s.dataUltimaSaida).toEqual(t);
  });
});
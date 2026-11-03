import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type pg from 'pg';
import { InventarioFacade } from '../../src/application/InventarioFacade.js';
import { PgUnitOfWork } from '../../src/infrastructure/database/PgUnitOfWork.js';
import { StockInsuficienteError } from '../../src/domain/stock/StockInsuficienteError.js';
import {
  poolTeste, limparTabelas, criarUsuario, criarCategoria,
  criarMaterialComStock, lerStock, contarMovimentos,
} from './helpers.js';

let pool: pg.Pool;
let facade: InventarioFacade;
let idUsuario: number;
let idCategoria: number;

beforeAll(async () => {
  pool = poolTeste();
  facade = new InventarioFacade(new PgUnitOfWork(pool));
});

beforeEach(async () => {
  await limparTabelas(pool);
  idUsuario = await criarUsuario(pool, { username: 'admin', perfil: 'ADMINISTRADOR', passwordHash: 'x' });
  idCategoria = await criarCategoria(pool, 'Teste');
});

afterAll(async () => {
  await pool.end();
});

describe('Saídas concorrentes sobre o mesmo material (RNF04 / RN02 / RN08)', () => {
  it('duas saídas simultâneas de 1 sobre stock 1: exactamente 1 sucesso, stock final 0', async () => {
    const id = await criarMaterialComStock(pool, { codigo: 'CONC-1', idCategoria, quantidade: 1, stockMinimo: 0 });

    const resultados = await Promise.allSettled([
      facade.registarSaida({ idMaterial: id, quantidade: 1, idUsuario }),
      facade.registarSaida({ idMaterial: id, quantidade: 1, idUsuario }),
    ]);

    const sucessos = resultados.filter((r) => r.status === 'fulfilled').length;
    const falhas = resultados.filter((r) => r.status === 'rejected').length;
    expect(sucessos).toBe(1);
    expect(falhas).toBe(1);
    // A falha é StockInsuficienteError, não stock negativo.
    const rejeitado = resultados.find((r) => r.status === 'rejected') as PromiseRejectedResult;
    expect(rejeitado.reason).toBeInstanceOf(StockInsuficienteError);

    const stock = await lerStock(pool, id);
    expect(stock.quantidade).toBe(0);       // RN08: nunca negativo
    expect(stock.estado).toBe('ESGOTADO');  // State recalculou
    expect(await contarMovimentos(pool, id, 'SAIDA')).toBe(1);
  });

  it('20 saídas concorrentes de 1 sobre stock 10: 10 sucessos, stock 0, 10 movimentos', async () => {
    const id = await criarMaterialComStock(pool, { codigo: 'CONC-2', idCategoria, quantidade: 10, stockMinimo: 2 });

    const promessas = Array.from({ length: 20 }, () =>
      facade.registarSaida({ idMaterial: id, quantidade: 1, idUsuario }),
    );
    const resultados = await Promise.allSettled(promessas);

    const sucessos = resultados.filter((r) => r.status === 'fulfilled').length;
    expect(sucessos).toBe(10);   // só 10 podem passar; as outras 10 esbarram em RN02

    const stock = await lerStock(pool, id);
    expect(stock.quantidade).toBe(0);
    expect(stock.estado).toBe('ESGOTADO');
    expect(await contarMovimentos(pool, id, 'SAIDA')).toBe(10);
  });

  it('saída que falha NÃO deixa histórico órfão (rollback limpo, RN05)', async () => {
    const id = await criarMaterialComStock(pool, { codigo: 'CONC-3', idCategoria, quantidade: 2, stockMinimo: 0 });

    await expect(
      facade.registarSaida({ idMaterial: id, quantidade: 5, idUsuario }),
    ).rejects.toThrow(StockInsuficienteError);

    // O stock manteve-se e NÃO há linha de movimento (a transacção fez rollback).
    const stock = await lerStock(pool, id);
    expect(stock.quantidade).toBe(2);
    expect(await contarMovimentos(pool, id, 'SAIDA')).toBe(0);
  });
});
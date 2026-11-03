import type { Pool, PoolClient } from 'pg';
import type { UnitOfWork, ContextoTransacao } from '../../application/ports/UnitOfWork.js';
import { PgStockRepository } from '../repositories/PgStockRepository.js';
import { PgHistoricoRepository } from '../repositories/PgHistoricoRepository.js';
import { PgMaterialRepositoryTx } from '../repositories/PgMaterialRepositoryTx.js';
import { PgRequisicaoRepositoryTx } from '../repositories/PgRequisicaoRepositoryTx.js';

// Implementação PostgreSQL do UnitOfWork (secção 7).
// Abre UMA ligação do pool, inicia transacção, executa o trabalho e faz
// commit; se algo lançar, faz rollback e propaga o erro.
export class PgUnitOfWork implements UnitOfWork {
  constructor(private pool: Pool) {}

  async executar<T>(trabalho: (tx: ContextoTransacao) => Promise<T>): Promise<T> {
    const client: PoolClient = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const tx: ContextoTransacao = {
        stock: new PgStockRepository(client),
        historico: new PgHistoricoRepository(client),
        materiais: new PgMaterialRepositoryTx(client),
        requisicoes: new PgRequisicaoRepositoryTx(client),
      };
      const resultado = await trabalho(tx);
      await client.query('COMMIT');
      return resultado;
    } catch (erro) {
      await client.query('ROLLBACK');
      throw erro;
    } finally {
      client.release();
    }
  }
}
import type { PoolClient } from 'pg';
import type { MaterialRepositoryTransacional } from '../../application/ports/UnitOfWork.js';

// Versão transaccional e estreita do repositório de materiais: só as
// operações de remoção lógica (secção 6.5), que correm dentro do UnitOfWork.
export class PgMaterialRepositoryTx implements MaterialRepositoryTransacional {
  constructor(private client: PoolClient) {}

  async desativar(id: number): Promise<boolean> {
    const { rowCount } = await this.client.query(
      'UPDATE material SET activo = FALSE WHERE id = $1',
      [id],
    );
    return (rowCount ?? 0) > 0;
  }

  async reativar(id: number): Promise<boolean> {
    const { rowCount } = await this.client.query(
      'UPDATE material SET activo = TRUE WHERE id = $1',
      [id],
    );
    return (rowCount ?? 0) > 0;
  }
}
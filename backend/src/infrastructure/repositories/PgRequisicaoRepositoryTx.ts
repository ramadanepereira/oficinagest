import type { PoolClient } from 'pg';
import type { RequisicaoRepositoryTransacional } from '../../application/ports/UnitOfWork.js';

// Verificação de requisições pendentes para a remoção lógica (secção 6.5).
export class PgRequisicaoRepositoryTx implements RequisicaoRepositoryTransacional {
  constructor(private client: PoolClient) {}

  async existemPendentesPorMaterial(idMaterial: number): Promise<boolean> {
    const { rowCount } = await this.client.query(
      "SELECT 1 FROM requisicao WHERE id_material = $1 AND estado = 'PENDENTE' LIMIT 1",
      [idMaterial],
    );
    return (rowCount ?? 0) > 0;
  }
}
import type { PoolClient } from 'pg';
import type {
  HistoricoRepository,
  RegistoMovimento,
  RegistoAlteracao,
} from '../../application/ports/HistoricoRepository.js';

// RN05/RN07: escreve o histórico NA MESMA transacção do movimento,
// para que um rollback não deixe histórico órfão.
export class PgHistoricoRepository implements HistoricoRepository {
  constructor(private client: PoolClient) {}

  async registarMovimento(mov: RegistoMovimento): Promise<void> {
    await this.client.query(
      `INSERT INTO movimento_stock (id_material, tipo, quantidade, id_usuario, observacao)
       VALUES ($1, $2, $3, $4, $5)`,
      [mov.idMaterial, mov.tipo, mov.quantidade, mov.idUsuario, mov.observacao ?? null],
    );
  }

  async registarAlteracao(alt: RegistoAlteracao): Promise<void> {
    await this.client.query(
      `INSERT INTO historico_alteracao_material (id_material, id_usuario, campo, valor_antigo, valor_novo)
       VALUES ($1, $2, $3, $4, $5)`,
      [alt.idMaterial, alt.idUsuario, alt.campo, alt.valorAntigo ?? null, alt.valorNovo ?? null],
    );
  }
}
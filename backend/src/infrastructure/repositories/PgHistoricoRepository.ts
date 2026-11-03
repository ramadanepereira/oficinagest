import type { PoolClient, Pool } from 'pg';
import type {
  HistoricoRepository,
  RegistoMovimento,
  RegistoAlteracao,
  FiltroMovimentos,
  MovimentoPublico,
} from '../../application/ports/HistoricoRepository.js';
import type { TipoMovimento } from '../../domain/stock/TipoMovimento.js';

// RN05/RN07: escreve o histórico NA MESMA transacção do movimento,
// para que um rollback não deixe histórico órfão.
// A listagem (consulta) usa o pool, não o client transaccional.
export class PgHistoricoRepository implements HistoricoRepository {
  constructor(private clientOrPool: PoolClient | Pool) {}

  async registarMovimento(mov: RegistoMovimento): Promise<void> {
    await this.clientOrPool.query(
      `INSERT INTO movimento_stock (id_material, tipo, quantidade, id_usuario, observacao)
       VALUES ($1, $2, $3, $4, $5)`,
      [mov.idMaterial, mov.tipo, mov.quantidade, mov.idUsuario, mov.observacao ?? null],
    );
  }

  async registarAlteracao(alt: RegistoAlteracao): Promise<void> {
    await this.clientOrPool.query(
      `INSERT INTO historico_alteracao_material (id_material, id_usuario, campo, valor_antigo, valor_novo)
       VALUES ($1, $2, $3, $4, $5)`,
      [alt.idMaterial, alt.idUsuario, alt.campo, alt.valorAntigo ?? null, alt.valorNovo ?? null],
    );
  }

  async listarMovimentos(f: FiltroMovimentos): Promise<{ itens: MovimentoPublico[]; total: number }> {
    const cond: string[] = [];
    const vals: any[] = [];
    let i = 1;
    if (f.idMaterial) { cond.push(`m.id_material = $${i}`); vals.push(f.idMaterial); i++; }
    if (f.tipo) { cond.push(`m.tipo = $${i}`); vals.push(f.tipo); i++; }
    if (f.idUsuario) { cond.push(`m.id_usuario = $${i}`); vals.push(f.idUsuario); i++; }
    if (f.desde) { cond.push(`m.criado_em >= $${i}`); vals.push(f.desde); i++; }
    if (f.ate) { cond.push(`m.criado_em <= $${i}`); vals.push(f.ate); i++; }
    const where = cond.length > 0 ? 'WHERE ' + cond.join(' AND ') : '';
    const pagina = Math.max(1, f.pagina ?? 1);
    const tamanho = Math.min(100, Math.max(1, f.tamanho ?? 20));
    const offset = (pagina - 1) * tamanho;

    const countRes = await this.clientOrPool.query(
      `SELECT COUNT(*) AS total FROM movimento_stock m ${where}`, vals
    );
    const total = Number(countRes.rows[0].total);

    const { rows } = await this.clientOrPool.query(
      `SELECT m.id, m.id_material, mat.codigo, mat.nome, m.tipo, m.quantidade,
              m.id_usuario, u.nome AS utilizador, m.observacao, m.criado_em
       FROM movimento_stock m
       JOIN material mat ON mat.id = m.id_material
       JOIN usuario u ON u.id = m.id_usuario
       ${where}
       ORDER BY m.criado_em DESC
       LIMIT $${i} OFFSET $${i + 1}`,
      [...vals, tamanho, offset]
    );
    return {
      itens: rows.map((r) => ({
        id: Number(r.id),
        idMaterial: Number(r.id_material),
        codigo: r.codigo,
        nome: r.nome,
        tipo: r.tipo as TipoMovimento,
        quantidade: Number(r.quantidade),
        idUsuario: Number(r.id_usuario),
        utilizador: r.utilizador,
        observacao: r.observacao ?? undefined,
        criadoEm: new Date(r.criado_em),
      })),
      total,
    };
  }
}
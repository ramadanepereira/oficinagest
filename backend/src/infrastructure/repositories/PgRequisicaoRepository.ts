import type { Pool } from 'pg';
import { Requisicao } from '../../domain/requisicao/Requisicao.js';
import type { EstadoRequisicao } from '../../domain/requisicao/EstadoRequisicao.js';
import type {
  RequisicaoRepository, FiltroRequisicoes, RequisicaoComNomes,
} from '../../application/ports/RequisicaoRepository.js';

export class PgRequisicaoRepository implements RequisicaoRepository {
  constructor(private pool: Pool) {}

  private paraDominio(row: any): Requisicao {
    return new Requisicao({
      id: Number(row.id),
      idMaterial: Number(row.id_material),
      idMecanico: Number(row.id_mecanico),
      idAtendente: row.id_atendente ? Number(row.id_atendente) : null,
      quantidade: Number(row.quantidade),
      estado: row.estado as EstadoRequisicao,
      criadoEm: new Date(row.criado_em),
    });
  }

  private condicoes(f: FiltroRequisicoes) {
    const cond: string[] = [];
    const vals: any[] = [];
    let i = 1;
    if (f.idMecanico) { cond.push(`r.id_mecanico = $${i}`); vals.push(f.idMecanico); i++; }
    if (f.estado) { cond.push(`r.estado = $${i}`); vals.push(f.estado); i++; }
    return { where: cond.length ? 'WHERE ' + cond.join(' AND ') : '', vals, next: i };
  }

  async listar(f: FiltroRequisicoes): Promise<{ itens: Requisicao[]; total: number }> {
    const { where, vals, next } = this.condicoes(f);
    const pagina = Math.max(1, f.pagina ?? 1);
    const tamanho = Math.min(100, Math.max(1, f.tamanho ?? 20));
    const offset = (pagina - 1) * tamanho;
    const countRes = await this.pool.query(`SELECT COUNT(*) AS total FROM requisicao r ${where}`, vals);
    const total = Number(countRes.rows[0].total);
    const { rows } = await this.pool.query(
      `SELECT r.* FROM requisicao r ${where} ORDER BY r.criado_em DESC LIMIT $${next} OFFSET $${next + 1}`,
      [...vals, tamanho, offset],
    );
    return { itens: rows.map((r) => this.paraDominio(r)), total };
  }

  // Listagem com nomes (JOIN a material e aos dois utilizadores).
  async listarComNomes(f: FiltroRequisicoes): Promise<{ itens: RequisicaoComNomes[]; total: number }> {
    const { where, vals, next } = this.condicoes(f);
    const pagina = Math.max(1, f.pagina ?? 1);
    const tamanho = Math.min(100, Math.max(1, f.tamanho ?? 20));
    const offset = (pagina - 1) * tamanho;
    const countRes = await this.pool.query(`SELECT COUNT(*) AS total FROM requisicao r ${where}`, vals);
    const total = Number(countRes.rows[0].total);
    const { rows } = await this.pool.query(
      `SELECT r.*,
              m.codigo AS mat_codigo, m.nome AS mat_nome,
              um.nome  AS mec_nome,
              ua.nome  AS ate_nome
       FROM requisicao r
       LEFT JOIN material m  ON m.id  = r.id_material
       LEFT JOIN usuario um ON um.id = r.id_mecanico
       LEFT JOIN usuario ua ON ua.id = r.id_atendente
       ${where}
       ORDER BY r.criado_em DESC
       LIMIT $${next} OFFSET $${next + 1}`,
      [...vals, tamanho, offset],
    );
    return {
      itens: rows.map((r) => ({
        id: Number(r.id),
        idMaterial: Number(r.id_material),
        idMecanico: Number(r.id_mecanico),
        idAtendente: r.id_atendente ? Number(r.id_atendente) : null,
        quantidade: Number(r.quantidade),
        estado: r.estado as EstadoRequisicao,
        criadoEm: new Date(r.criado_em),
        material: r.mat_nome
          ? { id: Number(r.id_material), codigo: r.mat_codigo, nome: r.mat_nome }
          : null,
        mecanico: r.mec_nome ? { id: Number(r.id_mecanico), nome: r.mec_nome } : null,
        atendente: r.ate_nome && r.id_atendente
          ? { id: Number(r.id_atendente), nome: r.ate_nome }
          : null,
      })),
      total,
    };
  }

  async obterPorId(id: number): Promise<Requisicao | null> {
    const { rows } = await this.pool.query('SELECT * FROM requisicao WHERE id = $1 LIMIT 1', [id]);
    return rows[0] ? this.paraDominio(rows[0]) : null;
  }

  async criar(r: Requisicao): Promise<Requisicao> {
    const { rows } = await this.pool.query(
      `INSERT INTO requisicao (id_material, id_mecanico, quantidade, estado)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [r.idMaterial, r.idMecanico, r.quantidade, r.estado],
    );
    return this.paraDominio(rows[0]);
  }

  async guardar(r: Requisicao): Promise<void> {
    await this.pool.query(
      'UPDATE requisicao SET estado = $1, id_atendente = $2 WHERE id = $3',
      [r.estado, r.idAtendente, r.id],
    );
  }

  async existemPendentesPorMaterial(idMaterial: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      "SELECT 1 FROM requisicao WHERE id_material = $1 AND estado = 'PENDENTE' LIMIT 1",
      [idMaterial],
    );
    return (rowCount ?? 0) > 0;
  }
}
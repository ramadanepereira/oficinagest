import type { Pool } from 'pg';
import type {
  DashboardRepository,
  TotaisStock, ContagemPorTipo, MovimentosPorDia,
  MovimentoResumo, AlertaResumo,
} from '../../application/ports/DashboardRepository.js';
import type { TipoMovimento } from '../../domain/stock/TipoMovimento.js';

export class PgDashboardRepository implements DashboardRepository {
  constructor(private pool: Pool) {}

  async totais(): Promise<TotaisStock> {
    const { rows } = await this.pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE m.activo = TRUE) AS materiais,
        COUNT(*) FILTER (WHERE m.activo = TRUE AND s.estado = 'STOCK_BAIXO') AS stock_baixo,
        COUNT(*) FILTER (WHERE m.activo = TRUE AND s.estado = 'ESGOTADO') AS esgotado,
        COUNT(*) FILTER (WHERE m.activo = TRUE AND s.estado = 'EM_REPOSICAO') AS em_reposicao
      FROM material m
      LEFT JOIN stock_material s ON s.id_material = m.id
    `);
    const r = rows[0];
    return {
      materiais: Number(r.materiais),
      stockBaixo: Number(r.stock_baixo),
      esgotado: Number(r.esgotado),
      emReposicao: Number(r.em_reposicao),
    };
  }

  async contagemPorTipo(): Promise<ContagemPorTipo[]> {
    const { rows } = await this.pool.query(`
      SELECT m.tipo, COUNT(*) AS total
      FROM material m
      WHERE m.activo = TRUE
      GROUP BY m.tipo
      ORDER BY m.tipo
    `);
    return rows.map((r) => ({
      tipo: r.tipo as 'PECA' | 'FERRAMENTA' | 'EQUIPAMENTO',
      total: Number(r.total),
    }));
  }

  async movimentosUltimos7Dias(): Promise<MovimentosPorDia[]> {
    const { rows } = await this.pool.query(`
      WITH dias AS (
        SELECT d::date AS dia
        FROM generate_series(current_date - interval '6 days', current_date, interval '1 day') d
      ),
      aggs AS (
        SELECT
          m.criado_em::date AS dia,
          COUNT(*) FILTER (WHERE m.tipo IN ('ENTRADA', 'AJUSTE_ENTRADA')) AS entradas,
          COUNT(*) FILTER (WHERE m.tipo IN ('SAIDA', 'AJUSTE_SAIDA')) AS saidas
        FROM movimento_stock m
        WHERE m.criado_em >= current_date - interval '6 days'
        GROUP BY m.criado_em::date
      )
      SELECT
        to_char(d.dia, 'YYYY-MM-DD') AS data,
        COALESCE(a.entradas, 0) AS entradas,
        COALESCE(a.saidas, 0) AS saidas
      FROM dias d
      LEFT JOIN aggs a ON a.dia = d.dia
      ORDER BY d.dia
    `);
    return rows.map((r) => ({
      data: r.data,
      entradas: Number(r.entradas),
      saidas: Number(r.saidas),
    }));
  }

  async ultimasMovimentacoes(limite: number): Promise<MovimentoResumo[]> {
    const { rows } = await this.pool.query(
      `SELECT m.id, m.id_material, mat.codigo, mat.nome, cat.descricao AS categoria,
              m.tipo, m.quantidade, m.id_usuario, u.nome AS utilizador, m.observacao, m.criado_em
       FROM movimento_stock m
       JOIN material mat ON mat.id = m.id_material
       JOIN categoria_material cat ON cat.id = mat.id_categoria
       JOIN usuario u ON u.id = m.id_usuario
       ORDER BY m.criado_em DESC
       LIMIT $1`,
      [limite],
    );
    return rows.map((r) => ({
      id: Number(r.id),
      idMaterial: Number(r.id_material),
      codigo: r.codigo,
      nome: r.nome,
      categoria: r.categoria,
      tipo: r.tipo as TipoMovimento,
      quantidade: Number(r.quantidade),
      idUsuario: Number(r.id_usuario),
      utilizador: r.utilizador,
      observacao: r.observacao ?? undefined,
      criadoEm: new Date(r.criado_em),
    }));
  }

  async alertas(): Promise<AlertaResumo[]> {
    const alertas: AlertaResumo[] = [];

    const { rows: mat } = await this.pool.query(`
      SELECT m.id, m.codigo, m.nome, s.estado, s.quantidade, s.stock_minimo
      FROM material m
      JOIN stock_material s ON s.id_material = m.id
      WHERE m.activo = TRUE
        AND s.estado IN ('STOCK_BAIXO', 'ESGOTADO')
      ORDER BY s.estado, m.nome
      LIMIT 20
    `);
    for (const r of mat) {
      const esgotado = r.estado === 'ESGOTADO';
      alertas.push({
        tipo: esgotado ? 'ESGOTADO' : 'STOCK_BAIXO',
        titulo: `${r.codigo} — ${r.nome}`,
        detalhe: esgotado
          ? `${r.nome} — 0 un.`
          : `${r.nome} — ${r.quantidade} un.`,
        criadoEm: new Date(),
      });
    }

    const { rows: rep } = await this.pool.query(`
      SELECT COUNT(*) AS n FROM material m
      JOIN stock_material s ON s.id_material = m.id
      WHERE m.activo = TRUE AND s.estado = 'EM_REPOSICAO'
    `);
    const nRep = Number(rep[0].n);
    if (nRep > 0) {
      alertas.push({
        tipo: 'REQUISICOES_PENDENTES',
        titulo: `Em reposição: ${nRep} material${nRep === 1 ? '' : 'is'}`,
        detalhe: 'A aguardar entrada de stock',
        criadoEm: new Date(),
      });
    }

    const { rows: req } = await this.pool.query(`
      SELECT COUNT(*) AS n FROM requisicao WHERE estado = 'PENDENTE'
    `);
    const n = Number(req[0].n);
    if (n > 0) {
      alertas.push({
        tipo: 'REQUISICOES_PENDENTES',
        titulo: `${n} requisiç${n === 1 ? 'ão' : 'ões'} pendente${n === 1 ? '' : 's'}`,
        detalhe: `${n} requisiç${n === 1 ? 'ão aguarda' : 'ões aguardam'} atendimento.`,
        criadoEm: new Date(),
      });
    }

    return alertas;
  }
}
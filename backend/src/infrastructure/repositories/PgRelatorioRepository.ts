import type { Pool } from 'pg';
import type {
  RelatorioRepository,
  FiltroRelatorio,
  RelatorioMovimentos,
  MovimentosPorPeriodo,
  TotalPorTipo,
  MaterialMovimentado,
} from '../../application/ports/RelatorioRepository.js';
import type { TipoMovimento } from '../../domain/stock/TipoMovimento.js';

export class PgRelatorioRepository implements RelatorioRepository {
  constructor(private pool: Pool) {}

  // Constrói a expressão SQL de agrupamento conforme o período.
  private agrupamentoPor(periodo: FiltroRelatorio['periodo']): string {
    switch (periodo) {
      case 'diario':  return "to_char(m.criado_em, 'YYYY-MM-DD')";
      case 'semanal': return "to_char(m.criado_em, 'IYYY') || '-W' || to_char(m.criado_em, 'IW')";
      case 'mensal':  return "to_char(m.criado_em, 'YYYY-MM')";
    }
  }

  async gerarMovimentos(f: FiltroRelatorio): Promise<RelatorioMovimentos> {
    // Intervalo por defeito: últimos 30 dias para diário, 12 semanas para semanal, 12 meses para mensal.
    const desde = f.desde ?? new Date(Date.now() - this.intervaloPorOmissao(f.periodo));
    const ate = f.ate ?? new Date();

    // Filtros WHERE comuns
    const cond: string[] = ['m.criado_em >= $1', 'm.criado_em <= $2'];
    const vals: any[] = [desde, ate];
    let i = 3;
    if (f.idMaterial) { cond.push(`m.id_material = $${i}`); vals.push(f.idMaterial); i++; }
    if (f.tipo) { cond.push(`m.tipo = $${i}`); vals.push(f.tipo); i++; }
    const joinCategoria = f.idCategoria
      ? 'JOIN material mat ON mat.id = m.id_material'
      : '';
    if (f.idCategoria) {
      cond.push(`mat.id_categoria = $${i}`);
      vals.push(f.idCategoria);
      i++;
    }
    const where = cond.join(' AND ');
    const agrup = this.agrupamentoPor(f.periodo);

    // Total de movimentos
    const { rows: totalRows } = await this.pool.query(
      `SELECT COUNT(*) AS n FROM movimento_stock m ${joinCategoria} WHERE ${where}`, vals
    );
    const totalMovimentos = Number(totalRows[0].n);

    // Agregação por período (buckets)
    const { rows: porPeriodoRows } = await this.pool.query(
      `SELECT
         ${agrup} AS periodo,
         COUNT(*) FILTER (WHERE m.tipo = 'ENTRADA') AS entradas,
         COUNT(*) FILTER (WHERE m.tipo = 'SAIDA') AS saidas,
         COUNT(*) FILTER (WHERE m.tipo = 'AJUSTE_ENTRADA') AS ajustes_entrada,
         COUNT(*) FILTER (WHERE m.tipo = 'AJUSTE_SAIDA') AS ajustes_saida,
         COUNT(*) AS total
       FROM movimento_stock m ${joinCategoria}
       WHERE ${where}
       GROUP BY ${agrup}
       ORDER BY periodo`, vals
    );
    const porPeriodo: MovimentosPorPeriodo[] = porPeriodoRows.map((r) => ({
      periodo: r.periodo,
      entradas: Number(r.entradas),
      saidas: Number(r.saidas),
      ajustesEntrada: Number(r.ajustes_entrada),
      ajustesSaida: Number(r.ajustes_saida),
      total: Number(r.total),
    }));

    // Totais por tipo
    const { rows: porTipoRows } = await this.pool.query(
      `SELECT m.tipo, COUNT(*) AS total
       FROM movimento_stock m ${joinCategoria}
       WHERE ${where}
       GROUP BY m.tipo`, vals
    );
    const mapa = new Map<string, number>();
    for (const r of porTipoRows) mapa.set(r.tipo, Number(r.total));
    const tipos: TipoMovimento[] = ['ENTRADA', 'SAIDA', 'AJUSTE_ENTRADA', 'AJUSTE_SAIDA'];
    const porTipo: TotalPorTipo[] = tipos.map((t) => ({ tipo: t, total: mapa.get(t) ?? 0 }));

    // Top 10 materiais mais movimentados
    const { rows: topRows } = await this.pool.query(
      `SELECT m.id_material, mat.codigo, mat.nome,
              COUNT(*) AS movimentos,
              SUM(m.quantidade) AS quantidade_total
       FROM movimento_stock m
       JOIN material mat ON mat.id = m.id_material
       WHERE ${where}
       GROUP BY m.id_material, mat.codigo, mat.nome
       ORDER BY movimentos DESC
       LIMIT 10`, vals
    );
    const topMateriais: MaterialMovimentado[] = topRows.map((r) => ({
      idMaterial: Number(r.id_material),
      codigo: r.codigo,
      nome: r.nome,
      movimentos: Number(r.movimentos),
      quantidadeTotal: Number(r.quantidade_total),
    }));

    return {
      periodo: f.periodo,
      desde,
      ate,
      totalMovimentos,
      porPeriodo,
      porTipo,
      topMateriais,
    };
  }

  private intervaloPorOmissao(periodo: FiltroRelatorio['periodo']): number {
    const DIA = 24 * 60 * 60 * 1000;
    switch (periodo) {
      case 'diario':  return 30 * DIA;
      case 'semanal': return 12 * 7 * DIA;
      case 'mensal':  return 12 * 30 * DIA;
    }
  }
}
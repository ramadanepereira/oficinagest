import type { Pool } from 'pg';
import { MaterialFactory } from '../../domain/material/MaterialFactory.js';
import type { Material } from '../../domain/material/Material.js';
import type { TipoMaterial } from '../../domain/material/TipoMaterial.js';
import type { EstadoStock } from '../../domain/stock/EstadoStock.js';
import type { MaterialRepository, FiltroMateriais } from '../../application/ports/MaterialRepository.js';

export class PgMaterialRepository implements MaterialRepository {
  constructor(private pool: Pool) {}

  private paraDominio(row: any): Material {
    // O tipo vem do ENUM da BD e vai como 1.o parâmetro da fábrica.
    // As props aqui NAO incluem 'tipo' (injectado pela fábrica).
    return MaterialFactory.criar(row.tipo as TipoMaterial, {
      id: Number(row.id),
      codigo: row.codigo,
      nome: row.nome,
      idCategoria: Number(row.id_categoria),
      unidade: row.unidade,
      activo: row.activo,
      criadoEm: new Date(row.criado_em),
      stock: row.qtd !== undefined
        ? {
            quantidade: Number(row.qtd),
            stockMinimo: Number(row.stock_minimo),
            estado: row.estado as EstadoStock,
          }
        : undefined,
    });
  }

  async listar(f: FiltroMateriais): Promise<{ itens: Material[]; total: number }> {
    const cond: string[] = ['m.activo = TRUE'];
    const vals: any[] = [];
    let i = 1;
    if (f.query) {
      cond.push(`(m.nome ILIKE $${i} OR m.codigo ILIKE $${i})`);
      vals.push(`%${f.query}%`); i++;
    }
    if (f.tipo) { cond.push(`m.tipo = $${i}`); vals.push(f.tipo); i++; }
    if (f.categoria) { cond.push(`m.id_categoria = $${i}`); vals.push(f.categoria); i++; }
    if (f.estado) { cond.push(`s.estado = $${i}`); vals.push(f.estado); i++; }
    const where = cond.join(' AND ');
    const pagina = Math.max(1, f.pagina ?? 1);
    const tamanho = Math.min(100, Math.max(1, f.tamanho ?? 20));
    const offset = (pagina - 1) * tamanho;

    const countRes = await this.pool.query(
      `SELECT COUNT(*) AS total FROM material m LEFT JOIN stock_material s ON s.id_material = m.id WHERE ${where}`,
      vals,
    );
    const total = Number(countRes.rows[0].total);

    const { rows } = await this.pool.query(
      `SELECT m.*, s.quantidade AS qtd, s.stock_minimo, s.estado
       FROM material m LEFT JOIN stock_material s ON s.id_material = m.id
       WHERE ${where} ORDER BY m.nome LIMIT $${i} OFFSET $${i + 1}`,
      [...vals, tamanho, offset],
    );
    return { itens: rows.map((r) => this.paraDominio(r)), total };
  }

  async obterPorId(id: number): Promise<Material | null> {
    const { rows } = await this.pool.query(
      `SELECT m.*, s.quantidade AS qtd, s.stock_minimo, s.estado
       FROM material m LEFT JOIN stock_material s ON s.id_material = m.id
       WHERE m.id = $1 LIMIT 1`,
      [id],
    );
    return rows[0] ? this.paraDominio(rows[0]) : null;
  }

  async codigoExiste(codigo: string, ignorarId?: number): Promise<boolean> {
    const q = ignorarId !== undefined
      ? 'SELECT 1 FROM material WHERE codigo = $1 AND id <> $2 LIMIT 1'
      : 'SELECT 1 FROM material WHERE codigo = $1 LIMIT 1';
    const vals = ignorarId !== undefined ? [codigo, ignorarId] : [codigo];
    const { rowCount } = await this.pool.query(q, vals);
    return (rowCount ?? 0) > 0;
  }

  async criar(m: Material, quantidadeInicial: number, stockMinimo: number): Promise<Material> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const res = await client.query(
        `INSERT INTO material (codigo, nome, tipo, id_categoria, unidade, activo)
         VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING *`,
        [m.codigo, m.nome, m.tipo, m.idCategoria, m.unidade],
      );
      const estado = (await import('../../domain/stock/StatusStock.js')).StatusStock
        .inicial(quantidadeInicial, stockMinimo).nome();
      await client.query(
        `INSERT INTO stock_material (id_material, quantidade, stock_minimo, estado)
         VALUES ($1, $2, $3, $4)`,
        [res.rows[0].id, quantidadeInicial, stockMinimo, estado],
      );
      await client.query('COMMIT');
      return this.paraDominio({
        ...res.rows[0],
        qtd: quantidadeInicial,
        stock_minimo: stockMinimo,
        estado,
      });
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async atualizar(
    id: number,
    dados: { nome?: string; unidade?: string; stockMinimo?: number },
  ): Promise<Material | null> {
    const campos: string[] = [];
    const vals: any[] = [];
    let i = 1;
    if (dados.nome !== undefined) { campos.push(`nome = $${i}`); vals.push(dados.nome); i++; }
    if (dados.unidade !== undefined) { campos.push(`unidade = $${i}`); vals.push(dados.unidade); i++; }
    if (campos.length > 0) {
      vals.push(id);
      await this.pool.query(`UPDATE material SET ${campos.join(', ')} WHERE id = $${i}`, vals);
    }
    if (dados.stockMinimo !== undefined) {
      const { rows } = await this.pool.query(
        'SELECT quantidade FROM stock_material WHERE id_material = $1',
        [id],
      );
      if (rows[0]) {
        const qtd = Number(rows[0].quantidade);
        const estado = (await import('../../domain/stock/StatusStock.js')).StatusStock
          .inicial(qtd, dados.stockMinimo).nome();
        await this.pool.query(
          'UPDATE stock_material SET stock_minimo = $1, estado = $2 WHERE id_material = $3',
          [dados.stockMinimo, estado, id],
        );
      }
    }
    return this.obterPorId(id);
  }

  async desativar(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query('UPDATE material SET activo = FALSE WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }

  async reativar(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query('UPDATE material SET activo = TRUE WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }

  async obterQuantidade(id: number): Promise<number> {
    const { rows } = await this.pool.query('SELECT quantidade FROM stock_material WHERE id_material = $1', [id]);
    return rows[0] ? Number(rows[0].quantidade) : 0;
  }
}
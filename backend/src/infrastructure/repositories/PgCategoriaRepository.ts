import type { Pool } from 'pg';
import { CategoriaMaterial } from '../../domain/categoria/CategoriaMaterial.js';
import type { CategoriaRepository } from '../../application/ports/CategoriaRepository.js';
export class PgCategoriaRepository implements CategoriaRepository {
  constructor(private pool: Pool) {}
  private paraDominio(row: any): CategoriaMaterial {
    return new CategoriaMaterial({ id: Number(row.id), descricao: row.descricao, activo: row.activo });
  }
  async listar(): Promise<CategoriaMaterial[]> {
    const { rows } = await this.pool.query('SELECT * FROM categoria_material ORDER BY descricao');
    return rows.map((r) => this.paraDominio(r));
  }
  async listarActivas(): Promise<CategoriaMaterial[]> {
    const { rows } = await this.pool.query('SELECT * FROM categoria_material WHERE activo = TRUE ORDER BY descricao');
    return rows.map((r) => this.paraDominio(r));
  }
  async obterPorId(id: number): Promise<CategoriaMaterial | null> {
    const { rows } = await this.pool.query('SELECT * FROM categoria_material WHERE id = $1 LIMIT 1', [id]);
    return rows[0] ? this.paraDominio(rows[0]) : null;
  }
  async criar(c: CategoriaMaterial): Promise<CategoriaMaterial> {
    const { rows } = await this.pool.query('INSERT INTO categoria_material (descricao, activo) VALUES ($1, $2) RETURNING *', [c.descricao, c.activo]);
    return this.paraDominio(rows[0]);
  }
  async atualizar(id: number, descricao: string): Promise<CategoriaMaterial | null> {
    const { rows } = await this.pool.query('UPDATE categoria_material SET descricao = $1 WHERE id = $2 RETURNING *', [descricao, id]);
    return rows[0] ? this.paraDominio(rows[0]) : null;
  }
  async desativar(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query('UPDATE categoria_material SET activo = FALSE WHERE id = $1', [id]);
    return (rowCount ?? 0) > 0;
  }
  async descricaoExiste(descricao: string, ignorarId?: number): Promise<boolean> {
    if (ignorarId !== undefined) {
      const { rowCount } = await this.pool.query('SELECT 1 FROM categoria_material WHERE descricao = $1 AND id <> $2 LIMIT 1', [descricao, ignorarId]);
      return (rowCount ?? 0) > 0;
    }
    const { rowCount } = await this.pool.query('SELECT 1 FROM categoria_material WHERE descricao = $1 LIMIT 1', [descricao]);
    return (rowCount ?? 0) > 0;
  }
}
// Implementação PostgreSQL do UsuarioRepository.
// SQL parametrizado ($1, $2...) — RN01/RN06, mas para utilizadores: nunca concatenar strings.
import type { Pool } from 'pg';
import { Usuario } from '../../domain/usuario/Usuario.js';
import type { PerfilUsuario } from '../../domain/usuario/PerfilUsuario.js';
import type { UsuarioRepository } from '../../application/ports/UsuarioRepository.js';

export class PgUsuarioRepository implements UsuarioRepository {
  constructor(private pool: Pool) {}

  private paraDominio(row: any): Usuario {
    return new Usuario({
      id: Number(row.id),
      nome: row.nome,
      username: row.username,
      email: row.email,
      telefone: row.telefone ?? null,
      passwordHash: row.password_hash,
      perfil: row.perfil as PerfilUsuario,
      activo: row.activo,
      criadoEm: new Date(row.criado_em),
    });
  }

  async obterPorUsername(username: string): Promise<Usuario | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM usuario WHERE username = $1 LIMIT 1',
      [username]
    );
    return rows[0] ? this.paraDominio(rows[0]) : null;
  }

  async obterPorId(id: number): Promise<Usuario | null> {
    const { rows } = await this.pool.query(
      'SELECT * FROM usuario WHERE id = $1 LIMIT 1',
      [id]
    );
    return rows[0] ? this.paraDominio(rows[0]) : null;
  }

  async listar(): Promise<Usuario[]> {
    const { rows } = await this.pool.query('SELECT * FROM usuario ORDER BY nome');
    return rows.map((r) => this.paraDominio(r));
  }

  async criar(u: Usuario): Promise<Usuario> {
    const { rows } = await this.pool.query(
      `INSERT INTO usuario (nome, username, email, telefone, password_hash, perfil, activo)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [u.nome, u.username, u.email, u.telefone, u.passwordHash, u.perfil, u.activo]
    );
    return this.paraDominio(rows[0]);
  }

  async atualizar(
    id: number,
    dados: Partial<Omit<Usuario, 'id' | 'criadoEm'>>
  ): Promise<Usuario | null> {
    const campos: string[] = [];
    const valores: any[] = [];
    const mapa: Record<string, string> = {
      nome: 'nome',
      username: 'username',
      email: 'email',
      telefone: 'telefone',
      passwordHash: 'password_hash',
      perfil: 'perfil',
      activo: 'activo',
    };
    let i = 1;
    for (const [k, col] of Object.entries(mapa)) {
      if (dados[k as keyof typeof dados] !== undefined) {
        campos.push(`${col} = $${i}`);
        valores.push(dados[k as keyof typeof dados]);
        i++;
      }
    }
    if (campos.length === 0) return this.obterPorId(id);
    valores.push(id);
    const { rows } = await this.pool.query(
      `UPDATE usuario SET ${campos.join(', ')} WHERE id = $${i} RETURNING *`,
      valores
    );
    return rows[0] ? this.paraDominio(rows[0]) : null;
  }

  async desativar(id: number): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      'UPDATE usuario SET activo = FALSE WHERE id = $1',
      [id]
    );
    return (rowCount ?? 0) > 0;
  }

  async usernameExiste(username: string, ignorarId?: number): Promise<boolean> {
    if (ignorarId !== undefined) {
      const { rowCount } = await this.pool.query(
        'SELECT 1 FROM usuario WHERE username = $1 AND id <> $2 LIMIT 1',
        [username, ignorarId]
      );
      return (rowCount ?? 0) > 0;
    }
    const { rowCount } = await this.pool.query(
      'SELECT 1 FROM usuario WHERE username = $1 LIMIT 1',
      [username]
    );
    return (rowCount ?? 0) > 0;
  }
}
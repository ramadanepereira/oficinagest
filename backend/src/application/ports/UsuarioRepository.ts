import type { Usuario } from '../../domain/usuario/Usuario.js';

export interface UsuarioRepository {
  obterPorUsername(username: string): Promise<Usuario | null>;
  obterPorId(id: number): Promise<Usuario | null>;
  listar(): Promise<Usuario[]>;
  criar(usuario: Usuario): Promise<Usuario>;
  atualizar(id: number, dados: Partial<Omit<Usuario, 'id' | 'criadoEm'>>): Promise<Usuario | null>;
  desativar(id: number): Promise<boolean>;
  usernameExiste(username: string, ignorarId?: number): Promise<boolean>;
}
import { Usuario } from '../../domain/usuario/Usuario.js';
import type { HashDePassword } from '../ports/HashDePassword.js';
import type { UsuarioRepository } from '../ports/UsuarioRepository.js';
import type { CriarUsuarioDto, AtualizarUsuarioDto } from '../../presentation/dto/usuario.dto.js';
export class UsuarioService {
  constructor(private repositorio: UsuarioRepository, private hasher: HashDePassword) {}
  async listar() {
    const usuarios = await this.repositorio.listar();
    return usuarios.map((u) => u.resumoPublico());
  }
  async criar(dto: CriarUsuarioDto) {
    const existe = await this.repositorio.usernameExiste(dto.username);
    if (existe) throw new UsernameDuplicadoError();
    const passwordHash = await this.hasher.hash(dto.password);
    const usuario = new Usuario({
      id: 0, nome: dto.nome, username: dto.username, email: dto.email,
      telefone: dto.telefone ?? null, passwordHash, perfil: dto.perfil,
      activo: true, criadoEm: new Date(),
    });
    const criado = await this.repositorio.criar(usuario);
    return criado.resumoPublico();
  }
  async atualizar(id: number, dto: AtualizarUsuarioDto) {
    const existente = await this.repositorio.obterPorId(id);
    if (!existente) throw new UsuarioNaoEncontradoError();
    if (dto.username && dto.username !== existente.username) {
      const existe = await this.repositorio.usernameExiste(dto.username, id);
      if (existe) throw new UsernameDuplicadoError();
    }
    const dadosAtualizar: any = { ...dto };
    if (dto.password) {
      dadosAtualizar.passwordHash = await this.hasher.hash(dto.password);
      delete dadosAtualizar.password;
    }
    const atualizado = await this.repositorio.atualizar(id, dadosAtualizar);
    return atualizado?.resumoPublico() ?? null;
  }
  async desativar(id: number) {
    const existente = await this.repositorio.obterPorId(id);
    if (!existente) throw new UsuarioNaoEncontradoError();
    return this.repositorio.desativar(id);
  }
}
export class UsernameDuplicadoError extends Error { constructor() { super('Username já existe'); this.name = 'UsernameDuplicadoError'; } }
export class UsuarioNaoEncontradoError extends Error { constructor() { super('Utilizador não encontrado'); this.name = 'UsuarioNaoEncontradoError'; } }
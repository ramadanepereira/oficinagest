// Serviço de autenticação: login, logout, sessão.
// JWT em cookie httpOnly (nunca acessível por JavaScript do cliente).
// Erros de domínio (credenciais inválidas, utilizador inativo) são lançados
// e traduzidos para HTTP apenas na camada de apresentação.
import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import type { Usuario } from '../../domain/usuario/Usuario.js';
import type { HashDePassword } from '../ports/HashDePassword.js';
import type { UsuarioRepository } from '../ports/UsuarioRepository.js';

// Tempo de vida do token de sessão: 8 horas (dia de trabalho típico).
const TOKEN_TTL_SEGUNDOS = 8 * 60 * 60;
const NOME_COOKIE = 'oficinagest_session';

export class AutenticacaoService {
  constructor(
    private usuarios: UsuarioRepository,
    private hasher: HashDePassword
  ) {}

  async login(username: string, password: string) {
    const usuario = await this.usuarios.obterPorUsername(username);

    // RN12: só utilizadores autenticados acedem ao sistema.
    // Mensagem genérica para não revelar se o utilizador existe.
    if (!usuario) {
      throw new CredenciaisInvalidasError();
    }

    if (!usuario.activo) {
      throw new ContaDesativadaError();
    }

    const passwordOk = await this.hasher.verificar(password, usuario.passwordHash);
    if (!passwordOk) {
      throw new CredenciaisInvalidasError();
    }

    const token = jwt.sign(
      { sub: usuario.id, perfil: usuario.perfil },
      config.JWT_SECRET,
      { expiresIn: TOKEN_TTL_SEGUNDOS }
    );

    return { usuario, token, nomeCookie: NOME_COOKIE, ttlSegundos: TOKEN_TTL_SEGUNDOS };
  }

  async validarSessao(token: string | undefined): Promise<Usuario | null> {
    if (!token) return null;
    try {
      const payload = jwt.verify(token, config.JWT_SECRET) as { sub: number };
      return this.usuarios.obterPorId(payload.sub);
    } catch {
      return null;
    }
  }
}

// Erros de domínio — traduzidos para HTTP 401 na camada de apresentação.
export class CredenciaisInvalidasError extends Error {
  constructor() { super('Credenciais inválidas'); this.name = 'CredenciaisInvalidasError'; }
}
export class ContaDesativadaError extends Error {
  constructor() { super('Conta desativada. Contacte o administrador.'); this.name = 'ContaDesativadaError'; }
}
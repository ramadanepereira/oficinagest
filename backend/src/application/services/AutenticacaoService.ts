import jwt from 'jsonwebtoken';
import { config } from '../../config/index.js';
import type { Usuario } from '../../domain/usuario/Usuario.js';
import type { HashDePassword } from '../ports/HashDePassword.js';
import type { UsuarioRepository } from '../ports/UsuarioRepository.js';

// Sessão normal: 8 horas (dia de trabalho). Com "Lembrar-me": 30 dias.
const TTL_CURTO_SEGUNDOS = 8 * 60 * 60;
const TTL_LONGO_SEGUNDOS = 30 * 24 * 60 * 60;
const NOME_COOKIE = 'oficinagest_session';

export class AutenticacaoService {
  constructor(
    private usuarios: UsuarioRepository,
    private hasher: HashDePassword,
  ) {}

  async login(username: string, password: string, lembrar = false) {
    const usuario = await this.usuarios.obterPorUsername(username);
    if (!usuario) throw new CredenciaisInvalidasError();
    if (!usuario.activo) throw new ContaDesativadaError();

    const passwordOk = await this.hasher.verificar(password, usuario.passwordHash);
    if (!passwordOk) throw new CredenciaisInvalidasError();

    const ttl = lembrar ? TTL_LONGO_SEGUNDOS : TTL_CURTO_SEGUNDOS;
    const token = jwt.sign({ sub: usuario.id, perfil: usuario.perfil }, config.JWT_SECRET, {
      expiresIn: ttl,
    });

    return { usuario, token, nomeCookie: NOME_COOKIE, ttlSegundos: ttl };
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

export class CredenciaisInvalidasError extends Error {
  constructor() { super('Credenciais inválidas'); this.name = 'CredenciaisInvalidasError'; }
}
export class ContaDesativadaError extends Error {
  constructor() { super('Conta desativada. Contacte o administrador.'); this.name = 'ContaDesativadaError'; }
}
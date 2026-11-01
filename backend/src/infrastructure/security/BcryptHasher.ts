// Implementação concreta de HashDePassword usando bcrypt.
// 10 rounds é o padrão recomendado; ~100ms por hash, suficiente para login.
import bcrypt from 'bcrypt';
import type { HashDePassword } from '../../application/ports/HashDePassword.js';

const ROUNDS = 10;

export class BcryptHasher implements HashDePassword {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, ROUNDS);
  }

  async verificar(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
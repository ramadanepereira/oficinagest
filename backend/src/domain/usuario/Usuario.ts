// Entidade Usuario. A password_hash NUNCA sai desta classe para o frontend.
import type { PerfilUsuario } from './PerfilUsuario.js';

export interface UsuarioProps {
  id: number;
  nome: string;
  username: string;
  email: string;
  telefone?: string | null;
  passwordHash: string;
  perfil: PerfilUsuario;
  activo: boolean;
  criadoEm: Date;
}

export class Usuario {
  constructor(private props: UsuarioProps) {}

  get id(): number { return this.props.id; }
  get nome(): string { return this.props.nome; }
  get username(): string { return this.props.username; }
  get email(): string { return this.props.email; }
  get telefone(): string | null { return this.props.telefone ?? null; }
  get passwordHash(): string { return this.props.passwordHash; }
  get perfil(): PerfilUsuario { return this.props.perfil; }
  get activo(): boolean { return this.props.activo; }
  get criadoEm(): Date { return this.props.criadoEm; }

  // DTO público: tudo menos passwordHash. Usado em /auth/me e listagens.
  resumoPublico() {
    return {
      id: this.id,
      nome: this.nome,
      username: this.username,
      email: this.email,
      telefone: this.telefone,
      perfil: this.perfil,
      activo: this.activo,
    };
  }
}
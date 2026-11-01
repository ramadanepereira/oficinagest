// Enum dos perfis de utilizador, mapeando directamente o ENUM da BD.
export type PerfilUsuario = 'ADMINISTRADOR' | 'ATENDENTE' | 'MECANICO';

export const PERFIS_VALIDOS: PerfilUsuario[] = [
  'ADMINISTRADOR',
  'ATENDENTE',
  'MECANICO',
];
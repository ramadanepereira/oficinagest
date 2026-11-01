import { z } from 'zod';
import { PERFIS_VALIDOS } from '../../domain/usuario/PerfilUsuario.js';
export const CriarUsuarioSchema = z.object({
  nome: z.string().min(1, 'O nome é obrigatório'),
  username: z.string().min(3, 'O username deve ter pelo menos 3 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  password: z.string().min(6, 'A palavra-passe deve ter pelo menos 6 caracteres'),
  perfil: z.enum(PERFIS_VALIDOS, { message: 'Perfil inválido' }),
});
export const AtualizarUsuarioSchema = z.object({
  nome: z.string().min(1).optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
  password: z.string().min(6).optional(),
  perfil: z.enum(PERFIS_VALIDOS).optional(),
  activo: z.boolean().optional(),
});
export type CriarUsuarioDto = z.infer<typeof CriarUsuarioSchema>;
export type AtualizarUsuarioDto = z.infer<typeof AtualizarUsuarioSchema>;
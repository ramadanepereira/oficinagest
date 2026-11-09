import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().min(1, 'O nome de utilizador é obrigatório'),
  password: z.string().min(1, 'A palavra-passe é obrigatória'),
  // "Lembrar-me": sessão longa (30 dias) em vez de 8 horas. Opcional e aditivo.
  lembrar: z.boolean().optional(),
});

export type LoginDto = z.infer<typeof LoginSchema>;
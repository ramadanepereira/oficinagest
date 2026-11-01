// Validação do payload de login com Zod (RN12).
// Frontend envia { username, password }; validamos aqui antes de chegar ao serviço.
import { z } from 'zod';

export const LoginSchema = z.object({
  username: z.string().min(1, 'O nome de utilizador é obrigatório'),
  password: z.string().min(1, 'A palavra-passe é obrigatória'),
});

export type LoginDto = z.infer<typeof LoginSchema>;
import { z } from 'zod';
export const CriarCategoriaSchema = z.object({ descricao: z.string().min(1, 'A descrição é obrigatória') });
export const AtualizarCategoriaSchema = z.object({ descricao: z.string().min(1, 'A descrição é obrigatória') });
export type CriarCategoriaDto = z.infer<typeof CriarCategoriaSchema>;
export type AtualizarCategoriaDto = z.infer<typeof AtualizarCategoriaSchema>;
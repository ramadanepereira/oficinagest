import { z } from 'zod';

export const CriarRequisicaoSchema = z.object({
  idMaterial: z.number().int().positive('Material obrigatório'),
  quantidade: z.number().int('Inteiro').positive('Quantidade > 0'),
});

export const FiltroRequisicoesSchema = z.object({
  estado: z.enum(['PENDENTE', 'APROVADA', 'REPROVADA', 'DEVOLVIDA']).optional(),
  pagina: z.coerce.number().int().positive().optional(),
  tamanho: z.coerce.number().int().positive().max(100).optional(),
});

export type CriarRequisicaoDto = z.infer<typeof CriarRequisicaoSchema>;
export type FiltroRequisicoesDto = z.infer<typeof FiltroRequisicoesSchema>;
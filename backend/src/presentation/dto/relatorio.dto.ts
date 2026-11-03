import { z } from 'zod';

export const FiltroRelatorioSchema = z.object({
  periodo: z.enum(['diario', 'semanal', 'mensal']),
  idMaterial: z.coerce.number().int().positive().optional(),
  idCategoria: z.coerce.number().int().positive().optional(),
  tipo: z.enum(['ENTRADA', 'SAIDA', 'AJUSTE_ENTRADA', 'AJUSTE_SAIDA']).optional(),
  desde: z.coerce.date().optional(),
  ate: z.coerce.date().optional(),
});

export type FiltroRelatorioDto = z.infer<typeof FiltroRelatorioSchema>;
import { z } from 'zod';

export const MovimentoSchema = z.object({
  idMaterial: z.coerce.number().int().positive('Selecione um material'),
  quantidade: z.coerce.number().int('Deve ser inteiro').positive('Deve ser > 0'),
  observacao: z.string().optional(),
});
export type MovimentoValues = z.infer<typeof MovimentoSchema>;

// Ajuste: quantidade com sinal (+ entra, - sai) e observação OBRIGATÓRIA (secção 6.5).
export const AjusteSchema = z.object({
  idMaterial: z.coerce.number().int().positive('Selecione um material'),
  quantidade: z.coerce.number().int('Deve ser inteiro').refine((n) => n !== 0, 'Diferente de zero'),
  observacao: z.string().min(1, 'Observação obrigatória em ajustes'),
});
export type AjusteValues = z.infer<typeof AjusteSchema>;
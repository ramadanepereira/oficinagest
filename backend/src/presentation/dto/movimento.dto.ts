import { z } from 'zod';

export const RegistarEntradaDto = z.object({
  idMaterial: z.number().int().positive('Material obrigatório'),
  quantidade: z.number().int('Inteiro').positive('Quantidade > 0'),
  observacao: z.string().optional(),
});

export const RegistarSaidaDto = z.object({
  idMaterial: z.number().int().positive('Material obrigatório'),
  quantidade: z.number().int('Inteiro').positive('Quantidade > 0'),
  observacao: z.string().optional(),
});

// Ajuste com sinal: positivo = entrada, negativo = saída.
export const RegistarAjusteDto = z.object({
  idMaterial: z.number().int().positive('Material obrigatório'),
  quantidade: z.number().int('Inteiro').refine((n) => n !== 0, 'Quantidade diferente de zero'),
  observacao: z.string().min(1, 'Observação obrigatória em ajustes'),
});

export const StockMinimoDto = z.object({
  novoMinimo: z.number().int('Inteiro').min(0, 'Não negativo'),
});

export const FiltroMovimentosDto = z.object({
  idMaterial: z.coerce.number().int().optional(),
  tipo: z.enum(['ENTRADA', 'SAIDA', 'AJUSTE_ENTRADA', 'AJUSTE_SAIDA']).optional(),
  idUsuario: z.coerce.number().int().optional(),
  desde: z.coerce.date().optional(),
  ate: z.coerce.date().optional(),
  pagina: z.coerce.number().int().positive().optional(),
  tamanho: z.coerce.number().int().positive().max(100).optional(),
});

export type RegistarEntradaDto = z.infer<typeof RegistarEntradaDto>;
export type RegistarSaidaDto = z.infer<typeof RegistarSaidaDto>;
export type RegistarAjusteDto = z.infer<typeof RegistarAjusteDto>;
export type StockMinimoDto = z.infer<typeof StockMinimoDto>;
export type FiltroMovimentosDto = z.infer<typeof FiltroMovimentosDto>;
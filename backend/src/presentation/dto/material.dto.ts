import { z } from 'zod';
import { TIPOS_VALIDOS } from '../../domain/material/TipoMaterial.js';

export const CriarMaterialSchema = z.object({
  codigo: z.string().min(1, 'O código é obrigatório').regex(/^\S+$/, 'O código não pode ter espaços'),
  nome: z.string().min(1, 'O nome é obrigatório'),
  tipo: z.enum(TIPOS_VALIDOS, { message: 'Tipo inválido (só PECA, FERRAMENTA, EQUIPAMENTO)' }),
  idCategoria: z.number().int().positive('Categoria obrigatória'),
  unidade: z.string().min(1).default('un'),
  quantidadeInicial: z.number().int('Inteiro').min(0, 'Não negativa').default(0),
  stockMinimo: z.number().int('Inteiro').min(0, 'Não negativo').default(0),
});

export const AtualizarMaterialSchema = z.object({
  nome: z.string().min(1).optional(),
  unidade: z.string().min(1).optional(),
  stockMinimo: z.number().int().min(0).optional(),
  idCategoria: z.number().int().positive().optional(),
});

export type CriarMaterialDto = z.infer<typeof CriarMaterialSchema>;
export type AtualizarMaterialDto = z.infer<typeof AtualizarMaterialSchema>;
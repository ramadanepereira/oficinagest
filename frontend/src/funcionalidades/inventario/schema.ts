import { z } from 'zod';

export const CriarMaterialSchema = z.object({
  codigo: z.string().min(1, 'Obrigatório').regex(/^\S+$/, 'Sem espaços'),
  nome: z.string().min(1, 'Obrigatório'),
  tipo: z.enum(['PECA', 'FERRAMENTA', 'EQUIPAMENTO']),
  idCategoria: z.coerce.number().int().positive('Obrigatório'),
  unidade: z.string().min(1).default('un'),
  quantidadeInicial: z.coerce.number().int().min(0).default(0),
  stockMinimo: z.coerce.number().int().min(0).default(0),
});
export type CriarMaterialValues = z.infer<typeof CriarMaterialSchema>;

// Edição: o tipo NÃO pode ser alterado (decisão de projecto), mas a categoria sim.
export const EditarMaterialSchema = z.object({
  nome: z.string().min(1, 'Obrigatório'),
  unidade: z.string().min(1),
  stockMinimo: z.coerce.number().int().min(0),
  idCategoria: z.coerce.number().int().positive('Obrigatório'),
});
export type EditarMaterialValues = z.infer<typeof EditarMaterialSchema>;
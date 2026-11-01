// Leitura e validação centralizada das variáveis de ambiente.
// Se alguma variável obrigatória faltar, o servidor falha no arranque (não em runtime).

import { z } from 'zod';

const EsquemaConfig = z.object({
  DATABASE_URL: z.string().url(),
  DATABASE_URL_TESTE: z.string().url(),
  DATABASE_SSL: z.enum(['true', 'false']).transform((v) => v === 'true'),
  JWT_SECRET: z.string().min(16),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().transform((v) => v.split(',').map((s) => s.trim())),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

const resultado = EsquemaConfig.safeParse(process.env);
if (!resultado.success) {
  console.error('❌ Variáveis de ambiente inválidas:');
  console.error(resultado.error.format());
  process.exit(1);
}

export const config = resultado.data;
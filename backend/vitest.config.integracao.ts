import { defineConfig } from 'vitest/config';

// Integração: SEMPRE contra oficinagest_teste (DATABASE_URL_TESTE).
// Ficheiros em série; a concorrência testada é interna (Promise.all dentro do teste).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/integracao/**/*.test.ts'],
    pool: 'forks',
    fileParallelism: false,
  },
});
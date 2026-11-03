import { defineConfig } from 'vitest/config';

// Integração: SEMPRE contra oficinagest_teste (DATABASE_URL_TESTE).
// globalSetup aplica as migrações antes; cada teste limpa as tabelas.
// Ficheiros em série; a concorrência testada é interna (Promise.all).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/integracao/**/*.test.ts'],
    globalSetup: ['test/integracao/globalSetup.ts'],
    pool: 'forks',
    fileParallelism: false,
    testTimeout: 30000,
  },
});
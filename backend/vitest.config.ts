import { defineConfig } from 'vitest/config';

// Testes unitários: correm sem base de dados (domínio + Facade com repositórios em memória).
export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
});
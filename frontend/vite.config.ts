import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy de desenvolvimento: /api -> backend real em :3000 (evita CORS).
    proxy: {
      '/api': { target: 'http://localhost:3000' },
    },
  },
  test: { environment: 'jsdom', globals: true, setupFiles: ['./test/setup.ts'] },
});
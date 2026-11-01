// Pool de ligações ao PostgreSQL. Usado pelos repositórios (infrastructure).
// A ligação usa SSL só se DATABASE_SSL=true (produção); em local é false.

import pg from 'pg';
import { config } from './index.js';

export const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  ssl: config.DATABASE_SSL ? { rejectUnauthorized: false } : false,
});

// Teste rápido ao arranque: falha se a BD não responder.
pool
  .connect()
  .then((client) => {
    client.release();
    console.log('✅ Ligação à base de dados estabelecida');
  })
  .catch((err) => {
    console.error('❌ Falha na ligação à base de dados:', err.message);
    process.exit(1);
  });
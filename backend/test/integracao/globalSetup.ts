import dotenv from 'dotenv';
dotenv.config();
import { runner } from 'node-pg-migrate';

export default async function setup() {
  const url = process.env.DATABASE_URL_TESTE;
  if (!url) {
    throw new Error('DATABASE_URL_TESTE não está definido no .env');
  }
  if (!url.includes('oficinagest_teste')) {
    throw new Error('SEGURANÇA: os testes de integração têm de correr contra oficinagest_teste');
  }
  await runner({
    databaseUrl: url,
    dir: 'migrations',
    migrationsTable: 'pgmigrations',
    direction: 'up',
    verbose: false,
  });
  console.log('? Migrações aplicadas em oficinagest_teste');
}

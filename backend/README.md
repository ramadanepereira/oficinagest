# OficinaGest — Backend

API de gestão de inventário para oficinas (Node.js 24 + Express + TypeScript + PostgreSQL 18.x, sem Docker).

## Pré-requisitos
- Node.js 24 (`nvm use` — o repo inclui `.nvmrc`)
- PostgreSQL 18.x instalado no SO (mesma versão principal em todo o grupo)
- Git

## 1. Base de dados (uma vez por máquina)
No psql ou pgAdmin, como `postgres`:
CREATE USER oficinagest WITH PASSWORD 'OficinaGest_Local_1';
CREATE DATABASE oficinagest OWNER oficinagest;
CREATE DATABASE oficinagest_teste OWNER oficinagest;

## 2. Configuração
`Copy-Item .env.example .env` (PowerShell) ou `cp .env.example .env` (Linux/macOS) e ajusta a password.
`DATABASE_SSL=false` em local. O `.env` nunca entra no Git.

## 3. Correr
npm install
npm run migrar     # aplica as migrações de migrations/
npm run seed       # dados de desenvolvimento (recusa NODE_ENV=production)
npm run dev        # http://localhost:3000/api/health

## 4. Testes
- `npm test` — unitários, sem BD.
- `npm run test:integracao` — sempre contra `oficinagest_teste`; o setup aplica migrações e limpa tabelas entre testes.

## 5. Backup / restauro
pg_dump -U oficinagest -d oficinagest -f backup.sql
psql  -U oficinagest -d oficinagest_restaurada -f backup.sql

## Regras do esquema
- Alterações = nova migração (`npx node-pg-migrate create nome -m migrations`); nunca editar migração já aplicada.
- O estado do stock é persistido mas calculado só pelo domínio (não criar triggers).

## Problemas comuns
- `ECONNREFUSED :5432` → serviço PostgreSQL parado.
- `password authentication failed` → password do `.env` diferente da do role.
- bcrypt sem ferramentas de compilação em Windows: usar `bcryptjs` (mesma API) — a interface `HashDePassword` isola a troca.
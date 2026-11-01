// COMPOSITION ROOT: único ficheiro onde se instanciam as implementações concretas
// e se injectam nas classes (DI por construtor).

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { pool } from './config/database.js';
import { errorHandler } from './presentation/middlewares/errorHandler.js';
import healthRouter from './presentation/routes/health.js';
import { criarAuthRouter } from './presentation/routes/auth.js';
import { BcryptHasher } from './infrastructure/security/BcryptHasher.js';
import { PgUsuarioRepository } from './infrastructure/repositories/PgUsuarioRepository.js';
import { AutenticacaoService } from './application/services/AutenticacaoService.js';

// Injeção de dependências: composição manual (sem framework de DI).
const hasher = new BcryptHasher();
const usuarioRepository = new PgUsuarioRepository(pool);
const autenticacaoService = new AutenticacaoService(usuarioRepository, hasher);

const app = express();

// Segurança: headers HTTP + CORS restrito às origens configuradas.
app.use(helmet());
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Parsing de JSON e cookies.
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Rate-limit genérico (o do login é específico e está na rota).
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Rotas com prefixo /api
app.use('/api', healthRouter);
app.use('/api/auth', criarAuthRouter(autenticacaoService));

// Middleware de erro: sempre o último.
app.use(errorHandler);

// Início do servidor.
const server = app.listen(config.PORT, () => {
  console.log(`🚀 Servidor OficinaGest a correr em http://localhost:${config.PORT}`);
  console.log(`   /api/health`);
  console.log(`   /api/auth/login, /api/auth/logout, /api/auth/me`);
});

// Graceful shutdown
const shutdown = async (sinal: string) => {
  console.log(`\n${sinal} recebido. A encerrar o servidor...`);
  server.close();
  await pool.end();
  process.exit(0);
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
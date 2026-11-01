// COMPOSITION ROOT: único ficheiro onde se instanciam as implementações concretas
// e se injectam nas classes (DI por construtor). Por agora só tem o servidor Express
// mínimo; os repositórios, serviços e Facade virão nos sub-passos seguintes.

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { pool } from './config/database.js';
import { errorHandler } from './presentation/middlewares/errorHandler.js';
import healthRouter from './presentation/routes/health.js';

const app = express();

// Segurança: headers HTTP + CORS restrito às origens configuradas.
app.use(helmet());
app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true, // permite cookies httpOnly
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Parsing de JSON e cookies.
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// Rate-limit genérico (limite de tentativas de login virá no sub-passo de auth).
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Rotas: prefixo /api para todas as rotas da aplicação.
app.use('/api', healthRouter);

// Middleware de erro: sempre o último, para capturar exceções de qualquer rota.
app.use(errorHandler);

// Início do servidor.
const server = app.listen(config.PORT, () => {
  console.log(`🚀 Servidor OficinaGest a correr em http://localhost:${config.PORT}`);
  console.log(`   Endpoint de saúde: http://localhost:${config.PORT}/api/health`);
});

// Graceful shutdown: fecha o servidor e o pool da BD ao receber SIGINT/SIGTERM.
const shutdown = async (sinal: string) => {
  console.log(`\n${sinal} recebido. A encerrar o servidor...`);
  server.close();
  await pool.end();
  process.exit(0);
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
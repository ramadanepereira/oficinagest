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
import { criarUsuariosRouter } from './presentation/routes/usuarios.js';
import { criarCategoriasRouter } from './presentation/routes/categorias.js';
import { criarMateriaisRouter } from './presentation/routes/materiais.js';
import { criarMovimentosRouter } from './presentation/routes/movimentos.js';
import { criarReposicaoRouter } from './presentation/routes/reposicao.js';
import { criarRequisicoesRouter } from './presentation/routes/requisicoes.js';
import { BcryptHasher } from './infrastructure/security/BcryptHasher.js';
import { PgUsuarioRepository } from './infrastructure/repositories/PgUsuarioRepository.js';
import { PgCategoriaRepository } from './infrastructure/repositories/PgCategoriaRepository.js';
import { PgMaterialRepository } from './infrastructure/repositories/PgMaterialRepository.js';
import { PgHistoricoRepository } from './infrastructure/repositories/PgHistoricoRepository.js';
import { PgRequisicaoRepository } from './infrastructure/repositories/PgRequisicaoRepository.js';
import { PgUnitOfWork } from './infrastructure/database/PgUnitOfWork.js';
import { AutenticacaoService } from './application/services/AutenticacaoService.js';
import { UsuarioService } from './application/services/UsuarioService.js';
import { CategoriaService } from './application/services/CategoriaService.js';
import { MaterialService } from './application/services/MaterialService.js';
import { RequisicaoService } from './application/services/RequisicaoService.js';
import { InventarioFacade } from './application/InventarioFacade.js';

const hasher = new BcryptHasher();
const usuarioRepository = new PgUsuarioRepository(pool);
const categoriaRepository = new PgCategoriaRepository(pool);
const materialRepository = new PgMaterialRepository(pool);
const historicoRepository = new PgHistoricoRepository(pool);
const requisicaoRepository = new PgRequisicaoRepository(pool);
const unitOfWork = new PgUnitOfWork(pool);
const autenticacaoService = new AutenticacaoService(usuarioRepository, hasher);
const usuarioService = new UsuarioService(usuarioRepository, hasher);
const categoriaService = new CategoriaService(categoriaRepository);
const materialService = new MaterialService(materialRepository);
const requisicaoService = new RequisicaoService(requisicaoRepository, materialRepository);
const facade = new InventarioFacade(unitOfWork);

const app = express();
app.use(helmet());
app.use(cors({ origin: config.CORS_ORIGIN, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 1000, standardHeaders: true, legacyHeaders: false }));

app.use('/api', healthRouter);
app.use('/api/auth', criarAuthRouter(autenticacaoService));
app.use('/api/utilizadores', criarUsuariosRouter(autenticacaoService, usuarioService));
app.use('/api/categorias', criarCategoriasRouter(autenticacaoService, categoriaService));
app.use('/api/materiais', criarMateriaisRouter(autenticacaoService, materialService, facade));
app.use('/api/movimentos', criarMovimentosRouter(autenticacaoService, facade, historicoRepository));
app.use('/api/materiais', criarReposicaoRouter(autenticacaoService, facade));
app.use('/api/requisicoes', criarRequisicoesRouter(autenticacaoService, requisicaoService));

app.use(errorHandler);

const server = app.listen(config.PORT, () => {
  console.log(`🚀 Servidor OficinaGest a correr em http://localhost:${config.PORT}`);
  console.log(`   /api/auth/*  /api/utilizadores/*  /api/categorias/*`);
  console.log(`   /api/materiais/*  /api/movimentos/*  /api/requisicoes/*`);
});

const shutdown = async (sinal: string) => {
  console.log(`\n${sinal} recebido. A encerrar o servidor...`);
  server.close();
  await pool.end();
  process.exit(0);
};
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
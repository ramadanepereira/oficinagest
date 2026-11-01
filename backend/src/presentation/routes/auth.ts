// Rotas de autenticação: POST /auth/login, POST /auth/logout, GET /auth/me.
// /health já é sem auth; estas rotas ficam em /api/auth/*.
import { Router } from 'express';
import type { AutenticacaoService } from '../../application/services/AutenticacaoService.js';
import {
  CredenciaisInvalidasError,
  ContaDesativadaError,
} from '../../application/services/AutenticacaoService.js';
import { LoginSchema } from '../dto/auth.dto.js';
import { rateLimitLogin } from '../middlewares/rateLimitLogin.js';
import { criarMiddlewareAuth } from '../middlewares/auth.js';

export function criarAuthRouter(autenticacao: AutenticacaoService) {
  const router = Router();
  const authMiddleware = criarMiddlewareAuth(autenticacao);

  // POST /auth/login
  router.post('/login', rateLimitLogin, async (req, res, next) => {
    try {
      const { username, password } = LoginSchema.parse(req.body);
      const { usuario, token, nomeCookie, ttlSegundos } = await autenticacao.login(
        username,
        password
      );

      // Cookie httpOnly: o JavaScript do cliente NUNCA o vê.
      res.cookie(nomeCookie, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.DATABASE_SSL === 'true', // true só em produção
        maxAge: ttlSegundos * 1000,
        path: '/',
      });

      res.json({ utilizador: usuario.resumoPublico() });
    } catch (err) {
      // Tradução dos erros de domínio para o contrato {codigo, mensagem}
      if (err instanceof CredenciaisInvalidasError) {
        res.status(401).json({ codigo: 'CREDENCIAIS_INVALIDAS', mensagem: err.message });
        return;
      }
      if (err instanceof ContaDesativadaError) {
        res.status(403).json({ codigo: 'CONTA_DESATIVADA', mensagem: err.message });
        return;
      }
      next(err); // outros erros (ex.: Zod) para o errorHandler
    }
  });

  // POST /auth/logout
  router.post('/logout', authMiddleware, (req, res) => {
    res.clearCookie('oficinagest_session', { path: '/' });
    res.json({ mensagem: 'Sessão terminada' });
  });

  // GET /auth/me — devolve o utilizador da sessão atual (usado pelo frontend no arranque).
  router.get('/me', authMiddleware, (req, res) => {
    res.json({ utilizador: req.usuario!.resumoPublico() });
  });

  return router;
}
import { Router } from 'express';
import type { AutenticacaoService } from '../../application/services/AutenticacaoService.js';
import { CredenciaisInvalidasError, ContaDesativadaError } from '../../application/services/AutenticacaoService.js';
import { LoginSchema } from '../dto/auth.dto.js';
import { rateLimitLogin } from '../middlewares/rateLimitLogin.js';
import { criarMiddlewareAuth } from '../middlewares/auth.js';

export function criarAuthRouter(autenticacao: AutenticacaoService) {
  const router = Router();
  const authMiddleware = criarMiddlewareAuth(autenticacao);

  router.post('/login', rateLimitLogin, async (req, res, next) => {
    try {
      const { username, password, lembrar } = LoginSchema.parse(req.body);
      const { usuario, token, nomeCookie, ttlSegundos } = await autenticacao.login(
        username, password, lembrar ?? false,
      );

      res.cookie(nomeCookie, token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.DATABASE_SSL === 'true',
        maxAge: ttlSegundos * 1000,
        path: '/',
      });
      res.json({ utilizador: usuario.resumoPublico() });
    } catch (err) {
      if (err instanceof CredenciaisInvalidasError) { res.status(401).json({ codigo: 'CREDENCIAIS_INVALIDAS', mensagem: err.message }); return; }
      if (err instanceof ContaDesativadaError) { res.status(403).json({ codigo: 'CONTA_DESATIVADA', mensagem: err.message }); return; }
      next(err);
    }
  });

  router.post('/logout', authMiddleware, (req, res) => {
    res.clearCookie('oficinagest_session', { path: '/' });
    res.json({ mensagem: 'Sessão terminada' });
  });

  router.get('/me', authMiddleware, (req, res) => {
    res.json({ utilizador: req.usuario!.resumoPublico() });
  });

  return router;
}
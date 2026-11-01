// Middleware de autenticação: lê o cookie httpOnly, valida o JWT e coloca
// o utilizador autenticado em req.usuario.
// Se não houver sessão, responde 401 — NAO_AUTENTICADO (contrato do §9).
import type { Request, Response, NextFunction } from 'express';
import type { Usuario } from '../../domain/usuario/Usuario.js';
import type { AutenticacaoService } from '../../application/services/AutenticacaoService.js';

// Extensão do Request do Express para incluir o utilizador autenticado.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: Usuario;
    }
  }
}

export function criarMiddlewareAuth(autenticacao: AutenticacaoService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.oficinagest_session;
    const usuario = await autenticacao.validarSessao(token);

    if (!usuario) {
      res.status(401).json({ codigo: 'NAO_AUTENTICADO', mensagem: 'Sessão expirada ou inválida' });
      return;
    }

    if (!usuario.activo) {
      // Conta desativada enquanto a sessão estava activa: força logout.
      res.clearCookie('oficinagest_session');
      res.status(401).json({ codigo: 'NAO_AUTENTICADO', mensagem: 'Conta desativada' });
      return;
    }

    req.usuario = usuario;
    next();
  };
}
// Middleware de autorização por perfil: recebe uma lista de perfis permitidos
// e responde 403 SEM_PERMISSAO se o utilizador não estiver nessa lista.
// Deve ser usado DEPOIS do middleware de autenticação.
import type { Request, Response, NextFunction } from 'express';
import type { PerfilUsuario } from '../../domain/usuario/PerfilUsuario.js';

export function exigirPerfil(...perfisPermitidos: PerfilUsuario[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.usuario) {
      // Defesa: o middleware de auth já deveria ter respondido 401.
      res.status(401).json({ codigo: 'NAO_AUTENTICADO', mensagem: 'Sessão expirada ou inválida' });
      return;
    }
    if (!perfisPermitidos.includes(req.usuario.perfil)) {
      res.status(403).json({
        codigo: 'SEM_PERMISSAO',
        mensagem: 'Não tem permissão para esta ação',
      });
      return;
    }
    next();
  };
}
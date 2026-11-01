import { Router } from 'express';
import type { UsuarioService } from '../../application/services/UsuarioService.js';
import { UsernameDuplicadoError, UsuarioNaoEncontradoError } from '../../application/services/UsuarioService.js';
import { CriarUsuarioSchema, AtualizarUsuarioSchema } from '../dto/usuario.dto.js';
import { criarMiddlewareAuth } from '../middlewares/auth.js';
import { exigirPerfil } from '../middlewares/perfil.js';
import type { AutenticacaoService } from '../../application/services/AutenticacaoService.js';
export function criarUsuariosRouter(autenticacao: AutenticacaoService, usuarioService: UsuarioService) {
  const router = Router();
  const authMiddleware = criarMiddlewareAuth(autenticacao);
  router.get('/', authMiddleware, exigirPerfil('ADMINISTRADOR'), async (req, res, next) => {
    try { const usuarios = await usuarioService.listar(); res.json({ utilizadores: usuarios }); } catch (err) { next(err); }
  });
  router.post('/', authMiddleware, exigirPerfil('ADMINISTRADOR'), async (req, res, next) => {
    try {
      const dto = CriarUsuarioSchema.parse(req.body);
      const criado = await usuarioService.criar(dto);
      res.status(201).json({ utilizador: criado });
    } catch (err) {
      if (err instanceof UsernameDuplicadoError) { res.status(409).json({ codigo: 'USERNAME_DUPLICADO', mensagem: err.message }); return; }
      next(err);
    }
  });
  router.put('/:id', authMiddleware, exigirPerfil('ADMINISTRADOR'), async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) { res.status(400).json({ codigo: 'VALIDACAO', mensagem: 'ID inválido' }); return; }
      const dto = AtualizarUsuarioSchema.parse(req.body);
      const atualizado = await usuarioService.atualizar(id, dto);
      if (!atualizado) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: 'Utilizador não encontrado' }); return; }
      res.json({ utilizador: atualizado });
    } catch (err) {
      if (err instanceof UsuarioNaoEncontradoError) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: err.message }); return; }
      if (err instanceof UsernameDuplicadoError) { res.status(409).json({ codigo: 'USERNAME_DUPLICADO', mensagem: err.message }); return; }
      next(err);
    }
  });
  router.delete('/:id', authMiddleware, exigirPerfil('ADMINISTRADOR'), async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) { res.status(400).json({ codigo: 'VALIDACAO', mensagem: 'ID inválido' }); return; }
      const ok = await usuarioService.desativar(id);
      if (!ok) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: 'Utilizador não encontrado' }); return; }
      res.json({ mensagem: 'Utilizador desativado' });
    } catch (err) {
      if (err instanceof UsuarioNaoEncontradoError) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: err.message }); return; }
      next(err);
    }
  });
  return router;
}
import { Router } from 'express';
import type { CategoriaService } from '../../application/services/CategoriaService.js';
import { DescricaoDuplicadaError, CategoriaNaoEncontradaError } from '../../application/services/CategoriaService.js';
import { CriarCategoriaSchema, AtualizarCategoriaSchema } from '../dto/categoria.dto.js';
import { criarMiddlewareAuth } from '../middlewares/auth.js';
import { exigirPerfil } from '../middlewares/perfil.js';
import type { AutenticacaoService } from '../../application/services/AutenticacaoService.js';

export function criarCategoriasRouter(
  autenticacao: AutenticacaoService,
  categoriaService: CategoriaService,
) {
  const router = Router();
  const authMiddleware = criarMiddlewareAuth(autenticacao);
  const soAdmin = exigirPerfil('ADMINISTRADOR');

  router.get('/', authMiddleware, async (_req, res, next) => {
    try { res.json({ categorias: await categoriaService.listar() }); } catch (err) { next(err); }
  });

  router.get('/activas', authMiddleware, async (_req, res, next) => {
    try { res.json({ categorias: await categoriaService.listarActivas() }); } catch (err) { next(err); }
  });

  router.post('/', authMiddleware, soAdmin, async (req, res, next) => {
    try {
      const dto = CriarCategoriaSchema.parse(req.body);
      res.status(201).json({ categoria: await categoriaService.criar(dto) });
    } catch (err) {
      if (err instanceof DescricaoDuplicadaError) { res.status(409).json({ codigo: 'DESCRICAO_DUPLICADA', mensagem: err.message }); return; }
      next(err);
    }
  });

  router.put('/:id', authMiddleware, soAdmin, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) { res.status(400).json({ codigo: 'VALIDACAO', mensagem: 'ID inválido' }); return; }
      const dto = AtualizarCategoriaSchema.parse(req.body);
      const atualizada = await categoriaService.atualizar(id, dto);
      if (!atualizada) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: 'Categoria não encontrada' }); return; }
      res.json({ categoria: atualizada });
    } catch (err) {
      if (err instanceof CategoriaNaoEncontradaError) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: err.message }); return; }
      if (err instanceof DescricaoDuplicadaError) { res.status(409).json({ codigo: 'DESCRICAO_DUPLICADA', mensagem: err.message }); return; }
      next(err);
    }
  });

  router.delete('/:id', authMiddleware, soAdmin, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) { res.status(400).json({ codigo: 'VALIDACAO', mensagem: 'ID inválido' }); return; }
      const ok = await categoriaService.desativar(id);
      if (!ok) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: 'Categoria não encontrada' }); return; }
      res.json({ mensagem: 'Categoria desativada' });
    } catch (err) {
      if (err instanceof CategoriaNaoEncontradaError) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: err.message }); return; }
      next(err);
    }
  });

  // Reativar uma categoria desativada (ADMIN).
  router.post('/:id/reativar', authMiddleware, soAdmin, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) { res.status(400).json({ codigo: 'VALIDACAO', mensagem: 'ID inválido' }); return; }
      const ok = await categoriaService.reativar(id);
      if (!ok) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: 'Categoria não encontrada' }); return; }
      res.json({ mensagem: 'Categoria reativada' });
    } catch (err) {
      if (err instanceof CategoriaNaoEncontradaError) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: err.message }); return; }
      next(err);
    }
  });

  return router;
}
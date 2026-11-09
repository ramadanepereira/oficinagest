import { Router } from 'express';
import type { MaterialService } from '../../application/services/MaterialService.js';
import { CodigoDuplicadoError, MaterialNaoEncontradoError } from '../../application/services/MaterialService.js';
import { CriarMaterialSchema, AtualizarMaterialSchema } from '../dto/material.dto.js';
import { criarMiddlewareAuth } from '../middlewares/auth.js';
import { exigirPerfil } from '../middlewares/perfil.js';
import type { AutenticacaoService } from '../../application/services/AutenticacaoService.js';
import type { InventarioFacade } from '../../application/InventarioFacade.js';
import { MaterialComStockError, MaterialComRequisicoesError } from '../../application/InventarioFacade.js';

export function criarMateriaisRouter(
  autenticacao: AutenticacaoService,
  materialService: MaterialService,
  facade: InventarioFacade,
) {
  const router = Router();
  const authMiddleware = criarMiddlewareAuth(autenticacao);

  router.get('/', authMiddleware, async (req, res, next) => {
    try {
      const filtro = {
        query: req.query.query as string | undefined,
        tipo: req.query.tipo as string | undefined,
        categoria: req.query.categoria ? Number(req.query.categoria) : undefined,
        estado: req.query.estado as string | undefined,
        incluirInactivos: req.query.incluirInactivos === 'true',
        pagina: req.query.pagina ? Number(req.query.pagina) : undefined,
        tamanho: req.query.tamanho ? Number(req.query.tamanho) : undefined,
      };
      const resultado = await materialService.listar(filtro);
      res.json(resultado);
    } catch (err) { next(err); }
  });

  router.get('/:id', authMiddleware, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) { res.status(400).json({ codigo: 'VALIDACAO', mensagem: 'ID inválido' }); return; }
      const m = await materialService.obterPorId(id);
      if (!m) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: 'Material não encontrado' }); return; }
      res.json({ material: m });
    } catch (err) { next(err); }
  });

  router.post('/', authMiddleware, exigirPerfil('ADMINISTRADOR'), async (req, res, next) => {
    try {
      const dto = CriarMaterialSchema.parse(req.body);
      const criado = await materialService.criar(dto);
      res.status(201).json({ material: criado });
    } catch (err) {
      if (err instanceof CodigoDuplicadoError) { res.status(409).json({ codigo: 'CODIGO_DUPLICADO', mensagem: err.message }); return; }
      next(err);
    }
  });

  router.put('/:id', authMiddleware, exigirPerfil('ADMINISTRADOR'), async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) { res.status(400).json({ codigo: 'VALIDACAO', mensagem: 'ID inválido' }); return; }
      const dto = AtualizarMaterialSchema.parse(req.body);
      const atualizado = await materialService.atualizar(id, dto);
      if (!atualizado) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: 'Material não encontrado' }); return; }
      res.json({ material: atualizado });
    } catch (err) {
      if (err instanceof MaterialNaoEncontradoError) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: err.message }); return; }
      next(err);
    }
  });

  router.delete('/:id', authMiddleware, exigirPerfil('ADMINISTRADOR'), async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) { res.status(400).json({ codigo: 'VALIDACAO', mensagem: 'ID inválido' }); return; }
      await facade.desactivarMaterial({ idMaterial: id, idUsuario: req.usuario!.id });
      res.json({ mensagem: 'Material removido' });
    } catch (err) {
      if (err instanceof MaterialNaoEncontradoError) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: err.message }); return; }
      if (err instanceof MaterialComStockError) { res.status(409).json({ codigo: 'MATERIAL_COM_STOCK', mensagem: err.message }); return; }
      if (err instanceof MaterialComRequisicoesError) { res.status(409).json({ codigo: 'MATERIAL_COM_REQUISICOES', mensagem: err.message }); return; }
      next(err);
    }
  });

  router.post('/:id/reactivar', authMiddleware, exigirPerfil('ADMINISTRADOR'), async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) { res.status(400).json({ codigo: 'VALIDACAO', mensagem: 'ID inválido' }); return; }
      const ok = await facade.reativarMaterial({ idMaterial: id, idUsuario: req.usuario!.id });
      if (!ok) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: 'Material não encontrado' }); return; }
      res.json({ mensagem: 'Material reativado' });
    } catch (err) {
      if (err instanceof MaterialNaoEncontradoError) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: err.message }); return; }
      next(err);
    }
  });

  return router;
}
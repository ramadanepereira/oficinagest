import { Router } from 'express';
import type { InventarioFacade } from '../../application/InventarioFacade.js';
import { TransicaoInvalidaError } from '../../domain/stock/TransicaoInvalidaError.js';
import { MaterialNaoEncontradoError } from '../../application/services/MaterialService.js';
import { StockMinimoDto } from '../dto/movimento.dto.js';
import { criarMiddlewareAuth } from '../middlewares/auth.js';
import { exigirPerfil } from '../middlewares/perfil.js';
import type { AutenticacaoService } from '../../application/services/AutenticacaoService.js';

export function criarReposicaoRouter(autenticacao: AutenticacaoService, facade: InventarioFacade) {
  const router = Router({ mergeParams: true });
  const auth = criarMiddlewareAuth(autenticacao);
  const soAdmin = exigirPerfil('ADMINISTRADOR');

  // POST /materiais/:id/iniciar-reposicao (ADMIN)
  router.post('/:id/iniciar-reposicao', auth, soAdmin, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) { res.status(400).json({ codigo: 'VALIDACAO', mensagem: 'ID inválido' }); return; }
      const resultado = await facade.iniciarReposicao({ idMaterial: id, idUsuario: req.usuario!.id });
      res.json({ stock: resultado });
    } catch (err) {
      if (err instanceof TransicaoInvalidaError) { res.status(409).json({ codigo: 'TRANSICAO_INVALIDA', mensagem: err.message }); return; }
      if (err instanceof MaterialNaoEncontradoError) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: err.message }); return; }
      next(err);
    }
  });

  // POST /materiais/:id/cancelar-reposicao (ADMIN)
  router.post('/:id/cancelar-reposicao', auth, soAdmin, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) { res.status(400).json({ codigo: 'VALIDACAO', mensagem: 'ID inválido' }); return; }
      const resultado = await facade.cancelarReposicao({ idMaterial: id, idUsuario: req.usuario!.id });
      res.json({ stock: resultado });
    } catch (err) {
      if (err instanceof TransicaoInvalidaError) { res.status(409).json({ codigo: 'TRANSICAO_INVALIDA', mensagem: err.message }); return; }
      if (err instanceof MaterialNaoEncontradoError) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: err.message }); return; }
      next(err);
    }
  });

  // GET /materiais/:id/stock (consulta pública entre autenticados)
  router.get('/:id/stock', auth, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) { res.status(400).json({ codigo: 'VALIDACAO', mensagem: 'ID inválido' }); return; }
      const resultado = await facade.consultarStock(id);
      res.json({ stock: resultado });
    } catch (err) {
      if (err instanceof MaterialNaoEncontradoError) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: err.message }); return; }
      next(err);
    }
  });

  // PUT /materiais/:id/stock-minimo (ADMIN)
  router.put('/:id/stock-minimo', auth, soAdmin, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) { res.status(400).json({ codigo: 'VALIDACAO', mensagem: 'ID inválido' }); return; }
      const dto = StockMinimoDto.parse(req.body);
      const resultado = await facade.alterarStockMinimo({
        idMaterial: id,
        idUsuario: req.usuario!.id,
        novoMinimo: dto.novoMinimo,
      });
      res.json({ stock: resultado });
    } catch (err) {
      if (err instanceof MaterialNaoEncontradoError) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: err.message }); return; }
      next(err);
    }
  });

  return router;
}
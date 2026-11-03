import { Router } from 'express';
import type { RequisicaoService } from '../../application/services/RequisicaoService.js';
import { RequisicaoNaoEncontradaError, MaterialNaoEncontradoError } from '../../application/services/RequisicaoService.js';
import { TransicaoRequisicaoInvalidaError } from '../../domain/requisicao/TransicaoRequisicaoInvalidaError.js';
import { QuantidadeInvalidaError } from '../../domain/stock/QuantidadeInvalidaError.js';
import { CriarRequisicaoSchema, FiltroRequisicoesSchema } from '../dto/requisicao.dto.js';
import { criarMiddlewareAuth } from '../middlewares/auth.js';
import { exigirPerfil } from '../middlewares/perfil.js';
import type { AutenticacaoService } from '../../application/services/AutenticacaoService.js';

export function criarRequisicoesRouter(autenticacao: AutenticacaoService, service: RequisicaoService) {
  const router = Router();
  const auth = criarMiddlewareAuth(autenticacao);
  const podeAprovar = exigirPerfil('ADMINISTRADOR', 'ATENDENTE');

  // POST /requisicoes (MECANICO e ADMIN)
  router.post('/', auth, exigirPerfil('MECANICO', 'ADMINISTRADOR'), async (req, res, next) => {
    try {
      const dto = CriarRequisicaoSchema.parse(req.body);
      const criada = await service.criar(dto, req.usuario!.id);
      res.status(201).json({ requisicao: criada });
    } catch (err) {
      if (err instanceof MaterialNaoEncontradoError) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: err.message }); return; }
      if (err instanceof QuantidadeInvalidaError) { res.status(400).json({ codigo: 'VALIDACAO', mensagem: err.message }); return; }
      next(err);
    }
  });

  // GET /requisicoes (MECANICO vê só as suas; ATENDENTE/ADMIN veem todas)
  router.get('/', auth, async (req, res, next) => {
    try {
      const filtro = FiltroRequisicoesSchema.parse(req.query);
      const idMecanico = req.usuario!.perfil === 'MECANICO' ? req.usuario!.id : undefined;
      const resultado = await service.listar({ ...filtro, idMecanico });
      res.json(resultado);
    } catch (err) { next(err); }
  });

  // PATCH /requisicoes/:id/aprovar (ATENDENTE/ADMIN)
  router.patch('/:id/aprovar', auth, podeAprovar, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) { res.status(400).json({ codigo: 'VALIDACAO', mensagem: 'ID inválido' }); return; }
      const r = await service.aprovar(id, req.usuario!.id);
      res.json({ requisicao: r });
    } catch (err) {
      if (err instanceof RequisicaoNaoEncontradaError) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: err.message }); return; }
      if (err instanceof TransicaoRequisicaoInvalidaError) { res.status(409).json({ codigo: 'TRANSICAO_INVALIDA', mensagem: err.message }); return; }
      next(err);
    }
  });

  // PATCH /requisicoes/:id/reprovar (ATENDENTE/ADMIN)
  router.patch('/:id/reprovar', auth, podeAprovar, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) { res.status(400).json({ codigo: 'VALIDACAO', mensagem: 'ID inválido' }); return; }
      const r = await service.reprovar(id, req.usuario!.id);
      res.json({ requisicao: r });
    } catch (err) {
      if (err instanceof RequisicaoNaoEncontradaError) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: err.message }); return; }
      if (err instanceof TransicaoRequisicaoInvalidaError) { res.status(409).json({ codigo: 'TRANSICAO_INVALIDA', mensagem: err.message }); return; }
      next(err);
    }
  });

  // POST /requisicoes/:id/devolver (ATENDENTE/ADMIN)
  router.post('/:id/devolver', auth, podeAprovar, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (Number.isNaN(id)) { res.status(400).json({ codigo: 'VALIDACAO', mensagem: 'ID inválido' }); return; }
      const r = await service.devolver(id);
      res.json({ requisicao: r });
    } catch (err) {
      if (err instanceof RequisicaoNaoEncontradaError) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: err.message }); return; }
      if (err instanceof TransicaoRequisicaoInvalidaError) { res.status(409).json({ codigo: 'TRANSICAO_INVALIDA', mensagem: err.message }); return; }
      next(err);
    }
  });

  return router;
}
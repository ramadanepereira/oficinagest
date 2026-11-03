import { Router } from 'express';
import type { InventarioFacade } from '../../application/InventarioFacade.js';
import { StockInsuficienteError } from '../../domain/stock/StockInsuficienteError.js';
import { TransicaoInvalidaError } from '../../domain/stock/TransicaoInvalidaError.js';
import { QuantidadeInvalidaError } from '../../domain/stock/QuantidadeInvalidaError.js';
import {
  RegistarEntradaDto,
  RegistarSaidaDto,
  RegistarAjusteDto,
  FiltroMovimentosDto,
} from '../dto/movimento.dto.js';
import { criarMiddlewareAuth } from '../middlewares/auth.js';
import { exigirPerfil } from '../middlewares/perfil.js';
import { MaterialNaoEncontradoError } from '../../application/services/MaterialService.js';
import type { AutenticacaoService } from '../../application/services/AutenticacaoService.js';
import type { HistoricoRepository } from '../../application/ports/HistoricoRepository.js';

export function criarMovimentosRouter(
  autenticacao: AutenticacaoService,
  facade: InventarioFacade,
  historico: HistoricoRepository,
) {
  const router = Router();
  const auth = criarMiddlewareAuth(autenticacao);
  // Atendente e Admin podem fazer entradas e saídas; mecânico só consulta.
  const podeMovimentar = exigirPerfil('ADMINISTRADOR', 'ATENDENTE');
  const soAdmin = exigirPerfil('ADMINISTRADOR');

  // POST /movimentos/entradas (ADMIN ou ATENDENTE)
  router.post('/entradas', auth, podeMovimentar, async (req, res, next) => {
    try {
      const dto = RegistarEntradaDto.parse(req.body);
      const resultado = await facade.registarEntrada({
        idMaterial: dto.idMaterial,
        quantidade: dto.quantidade,
        idUsuario: req.usuario!.id,
        observacao: dto.observacao,
      });
      res.status(201).json({ stock: resultado });
    } catch (err) {
      if (err instanceof MaterialNaoEncontradoError) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: err.message }); return; }
      if (err instanceof QuantidadeInvalidaError) { res.status(400).json({ codigo: 'VALIDACAO', mensagem: err.message }); return; }
      next(err);
    }
  });

  // POST /movimentos/saidas (ADMIN ou ATENDENTE)
  router.post('/saidas', auth, podeMovimentar, async (req, res, next) => {
    try {
      const dto = RegistarSaidaDto.parse(req.body);
      const resultado = await facade.registarSaida({
        idMaterial: dto.idMaterial,
        quantidade: dto.quantidade,
        idUsuario: req.usuario!.id,
        observacao: dto.observacao,
      });
      res.status(201).json({ stock: resultado });
    } catch (err) {
      if (err instanceof StockInsuficienteError) { res.status(409).json({ codigo: 'STOCK_INSUFICIENTE', mensagem: err.message }); return; }
      if (err instanceof MaterialNaoEncontradoError) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: err.message }); return; }
      if (err instanceof QuantidadeInvalidaError) { res.status(400).json({ codigo: 'VALIDACAO', mensagem: err.message }); return; }
      next(err);
    }
  });

  // POST /movimentos/ajustes (só ADMIN, secção 6.5 — observação obrigatória)
  router.post('/ajustes', auth, soAdmin, async (req, res, next) => {
    try {
      const dto = RegistarAjusteDto.parse(req.body);
      const resultado = await facade.registarAjuste({
        idMaterial: dto.idMaterial,
        quantidade: dto.quantidade,
        idUsuario: req.usuario!.id,
        observacao: dto.observacao,
      });
      res.status(201).json({ stock: resultado });
    } catch (err) {
      if (err instanceof StockInsuficienteError) { res.status(409).json({ codigo: 'STOCK_INSUFICIENTE', mensagem: err.message }); return; }
      if (err instanceof MaterialNaoEncontradoError) { res.status(404).json({ codigo: 'NAO_ENCONTRADO', mensagem: err.message }); return; }
      if (err instanceof QuantidadeInvalidaError) { res.status(400).json({ codigo: 'VALIDACAO', mensagem: err.message }); return; }
      next(err);
    }
  });

  // GET /movimentos?query params (todos os autenticados)
  router.get('/', auth, async (req, res, next) => {
    try {
      const filtro = FiltroMovimentosDto.parse(req.query);
      const resultado = await historico.listarMovimentos(filtro);
      res.json(resultado);
    } catch (err) { next(err); }
  });

  return router;
}
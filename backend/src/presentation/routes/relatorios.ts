import { Router } from 'express';
import type { RelatorioService } from '../../application/services/RelatorioService.js';
import { FiltroRelatorioSchema } from '../dto/relatorio.dto.js';
import { criarMiddlewareAuth } from '../middlewares/auth.js';
import { exigirPerfil } from '../middlewares/perfil.js';
import type { AutenticacaoService } from '../../application/services/AutenticacaoService.js';

export function criarRelatoriosRouter(
  autenticacao: AutenticacaoService,
  relatorioService: RelatorioService,
) {
  const router = Router();
  const auth = criarMiddlewareAuth(autenticacao);
  // ATENDENTE e ADMIN podem ver relatórios; MECÂNICO não (secção 6).
  const podeVer = exigirPerfil('ADMINISTRADOR', 'ATENDENTE');

  // GET /relatorios/movimentos?periodo=diario|semanal|mensal
  router.get('/movimentos', auth, podeVer, async (req, res, next) => {
    try {
      const filtro = FiltroRelatorioSchema.parse(req.query);
      const relatorio = await relatorioService.movimentos(filtro);
      res.json(relatorio);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
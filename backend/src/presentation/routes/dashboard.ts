import { Router } from 'express';
import type { DashboardService } from '../../application/services/DashboardService.js';
import { criarMiddlewareAuth } from '../middlewares/auth.js';
import type { AutenticacaoService } from '../../application/services/AutenticacaoService.js';

export function criarDashboardRouter(
  autenticacao: AutenticacaoService,
  dashboardService: DashboardService,
) {
  const router = Router();
  const auth = criarMiddlewareAuth(autenticacao);

  // GET /dashboard/resumo — disponível para todos os perfis autenticados.
  // Cada perfil vê o mesmo resumo; a filtragem de acções rápidas é feita no frontend.
  router.get('/resumo', auth, async (_req, res, next) => {
    try {
      const resumo = await dashboardService.resumo();
      res.json(resumo);
    } catch (err) {
      next(err);
    }
  });

  return router;
}
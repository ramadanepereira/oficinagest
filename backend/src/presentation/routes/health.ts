// Endpoint de saúde: responde sem autenticação. Usado por load balancers e
// pelo passo de deploy para confirmar que o serviço está activo.

import { Router } from 'express';
import type { Request, Response } from 'express';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

export default router;
// Rate-limit específico para /auth/login: 5 tentativas por IP em 15 minutos.
// Protege contra ataques de força bruta.
import rateLimit from 'express-rate-limit';

export const rateLimitLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    codigo: 'MUITAS_TENTATIVAS',
    mensagem: 'Demasiadas tentativas de login. Tente novamente em 15 minutos.',
  },
});
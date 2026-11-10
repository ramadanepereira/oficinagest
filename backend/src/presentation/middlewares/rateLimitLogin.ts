import rateLimit from 'express-rate-limit';

// Proteção anti-força-bruta no login.
// Em PRODUÇÃO: 5 tentativas / 15 min por IP (segurança real).
// Em DESENVOLVIMENTO: 100 tentativas / 15 min (não bloqueia testes manuais).
const isProd = process.env.NODE_ENV === 'production';

export const rateLimitLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 5 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    codigo: 'RATE_LIMIT_LOGIN',
    mensagem: 'Demasiadas tentativas de login. Tente novamente em 15 minutos.',
  },
});
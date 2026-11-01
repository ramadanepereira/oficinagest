// Middleware central de erros: traduz qualquer exceção para o formato uniforme
// { codigo, mensagem } definido no §9 do enunciado.
// Erros de domínio (StockInsuficienteError, TransicaoInvalidaError) serão tratados
// nos sub-passos seguintes; agora trata erros genéricos de validação/HTTP.

import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export interface ErroApi {
  codigo: string;
  mensagem: string;
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ErroApi>,
  _next: NextFunction
): void {
  // Validação Zod (DTO inválido)
  if (err instanceof z.ZodError) {
    res.status(400).json({
      codigo: 'VALIDACAO',
      mensagem: err.errors.map((e) => e.message).join('; '),
    });
    return;
  }

  // Erros com status HTTP explícito (ex.: 404 Not Found)
  if ('status' in err && typeof (err as any).status === 'number') {
    res.status((err as any).status).json({
      codigo: (err as any).codigo || 'ERRO',
      mensagem: err.message,
    });
    return;
  }

  // Erro genérico (bug no servidor)
  console.error('❌ Erro não tratado:', err);
  res.status(500).json({
    codigo: 'ERRO_INTERNO',
    mensagem: 'Erro interno do servidor',
  });
}
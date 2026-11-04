// Único módulo que faz fetch. Todas as páginas/hooks usam daqui.
// Em dev, o MSW intercepta as chamadas a /api/*; em produção, vai para o backend.
import type { ErroApi } from './types.ts';

const API_BASE = '/api';

export class ApiError extends Error {
  constructor(public codigo: string, message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include', // cookie httpOnly
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });

  if (!res.ok) {
    let body: ErroApi = { codigo: 'ERRO', mensagem: res.statusText };
    try { body = (await res.json()) as ErroApi; } catch { /* ignora */ }
    throw new ApiError(body.codigo, body.mensagem, res.status);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
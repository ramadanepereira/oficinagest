import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/cliente.ts';

export interface RequisicaoDto {
  id: number;
  idMaterial: number;
  idMecanico: number;
  idAtendente: number | null;
  quantidade: number;
  estado: 'PENDENTE' | 'APROVADA' | 'REPROVADA' | 'DEVOLVIDA';
  criadoEm: string;
  material?: { id: number; codigo: string; nome: string } | null;
  mecanico?: { id: number; nome: string } | null;
  atendente?: { id: number; nome: string } | null;
}

export interface PaginaRequisicoes { itens: RequisicaoDto[]; total: number; }

export const TAMANHO_PAGINA = 10;

export function useRequisicoes(filtro?: { estado?: string; pagina?: number }) {
  const params = new URLSearchParams();
  if (filtro?.estado) params.set('estado', filtro.estado);
  params.set('pagina', String(filtro?.pagina ?? 1));
  params.set('tamanho', String(TAMANHO_PAGINA));
  return useQuery({
    queryKey: ['requisicoes', filtro?.estado, filtro?.pagina],
    queryFn: () => api.get<PaginaRequisicoes>(`/requisicoes?${params.toString()}`),
  });
}

export function useMutacoesRequisicao() {
  const qc = useQueryClient();
  const invalidar = () => qc.invalidateQueries({ queryKey: ['requisicoes'] });
  return {
    criar: useMutation({ mutationFn: (dto: { idMaterial: number; quantidade: number }) => api.post('/requisicoes', dto), onSuccess: invalidar }),
    aprovar: useMutation({ mutationFn: (id: number) => api.patch(`/requisicoes/${id}/aprovar`), onSuccess: invalidar }),
    reprovar: useMutation({ mutationFn: (id: number) => api.patch(`/requisicoes/${id}/reprovar`), onSuccess: invalidar }),
    devolver: useMutation({ mutationFn: (id: number) => api.post(`/requisicoes/${id}/devolver`), onSuccess: invalidar }),
  };
}
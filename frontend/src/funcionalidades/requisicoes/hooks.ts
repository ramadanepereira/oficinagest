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
  material?: { id: number; codigo: string; nome: string };
  mecanico?: { id: number; nome: string };
  atendente?: { id: number; nome: string } | null;
}

export interface PaginaRequisicoes {
  itens: RequisicaoDto[];
  total: number;
}

export function useRequisicoes(filtro?: { estado?: string }) {
  const qs = filtro?.estado ? `?estado=${filtro.estado}` : '';
  return useQuery({
    queryKey: ['requisicoes', filtro?.estado],
    queryFn: () => api.get<PaginaRequisicoes>(`/requisicoes${qs}`),
  });
}

export function useMutacoesRequisicao() {
  const qc = useQueryClient();
  const invalidar = () => qc.invalidateQueries({ queryKey: ['requisicoes'] });
  return {
    criar: useMutation({
      mutationFn: (dto: { idMaterial: number; quantidade: number }) =>
        api.post('/requisicoes', dto),
      onSuccess: invalidar,
    }),
    aprovar: useMutation({
      mutationFn: (id: number) => api.patch(`/requisicoes/${id}/aprovar`),
      onSuccess: invalidar,
    }),
    reprovar: useMutation({
      mutationFn: (id: number) => api.patch(`/requisicoes/${id}/reprovar`),
      onSuccess: invalidar,
    }),
    devolver: useMutation({
      mutationFn: (id: number) => api.post(`/requisicoes/${id}/devolver`),
      onSuccess: invalidar,
    }),
  };
}
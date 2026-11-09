import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/cliente.ts';
import type { Movimento, Pagina } from '../../api/types.ts';

export function useMovimentos() {
  return useQuery({
    queryKey: ['movimentos'],
    queryFn: () => api.get<Pagina<Movimento>>('/movimentos'),
  });
}

export type ModoMovimento = 'entrada' | 'saida' | 'ajuste';

const CAMINHO: Record<ModoMovimento, string> = {
  entrada: '/movimentos/entradas',
  saida: '/movimentos/saidas',
  ajuste: '/movimentos/ajustes',
};

export function useRegistarMovimento(modo: ModoMovimento) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: { idMaterial: number; quantidade: number; observacao?: string }) =>
      api.post(CAMINHO[modo], dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['materiais'] });
      qc.invalidateQueries({ queryKey: ['materiais-codigos'] });
      qc.invalidateQueries({ queryKey: ['movimentos'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
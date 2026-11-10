import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/cliente.ts';
import type { Utilizador } from '../../api/types.ts';

export function useUtilizadores() {
  return useQuery({
    queryKey: ['utilizadores'],
    queryFn: () => api.get<{ utilizadores: Utilizador[] }>('/utilizadores'),
  });
}

export interface CriarUsuarioDto {
  nome: string; username: string; email: string; telefone?: string;
  password: string; perfil: 'ADMINISTRADOR' | 'ATENDENTE' | 'MECANICO';
}
export interface EditarUsuarioDto {
  nome?: string; email?: string; telefone?: string; password?: string;
  perfil?: 'ADMINISTRADOR' | 'ATENDENTE' | 'MECANICO'; activo?: boolean;
}

export function useMutacoesUsuario() {
  const qc = useQueryClient();
  const invalidar = () => qc.invalidateQueries({ queryKey: ['utilizadores'] });
  return {
    criar: useMutation({ mutationFn: (dto: CriarUsuarioDto) => api.post('/utilizadores', dto), onSuccess: invalidar }),
    atualizar: useMutation({ mutationFn: ({ id, dto }: { id: number; dto: EditarUsuarioDto }) => api.put(`/utilizadores/${id}`, dto), onSuccess: invalidar }),
    desativar: useMutation({ mutationFn: (id: number) => api.delete(`/utilizadores/${id}`), onSuccess: invalidar }),
  };
}
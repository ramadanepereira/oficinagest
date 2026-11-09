import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/cliente.ts';
import type { Categoria } from '../../api/types.ts';

// Partilha a queryKey ['categorias'] com o useCategorias do inventario,
// para que criar/editar aqui actualize também os selects de material.
export function useListaCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: () => api.get<{ categorias: Categoria[] }>('/categorias'),
  });
}

export function useMutacoesCategoria() {
  const qc = useQueryClient();
  const invalidar = () => qc.invalidateQueries({ queryKey: ['categorias'] });
  return {
    criar: useMutation({ mutationFn: (descricao: string) => api.post('/categorias', { descricao }), onSuccess: invalidar }),
    atualizar: useMutation({ mutationFn: ({ id, descricao }: { id: number; descricao: string }) => api.put(`/categorias/${id}`, { descricao }), onSuccess: invalidar }),
    desativar: useMutation({ mutationFn: (id: number) => api.delete(`/categorias/${id}`), onSuccess: invalidar }),
  };
}
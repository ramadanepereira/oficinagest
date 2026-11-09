import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/cliente.ts';
import type { Material, Categoria, Pagina } from '../../api/types.ts';
import type { CriarMaterialValues, EditarMaterialValues } from './schema.ts';

export interface FiltroInventario {
  query?: string;
  tipo?: string;
  categoria?: number;
  estado?: string;
  incluirInactivos?: boolean;
  pagina?: number;
}

const TAMANHO = 8;

function qs(f: FiltroInventario): string {
  const p = new URLSearchParams();
  if (f.query) p.set('query', f.query);
  if (f.tipo) p.set('tipo', f.tipo);
  if (f.categoria) p.set('categoria', String(f.categoria));
  if (f.estado) p.set('estado', f.estado);
  if (f.incluirInactivos) p.set('incluirInactivos', 'true');
  p.set('pagina', String(f.pagina ?? 1));
  p.set('tamanho', String(TAMANHO));
  return p.toString();
}

export function useMateriais(f: FiltroInventario) {
  return useQuery({
    queryKey: ['materiais', f],
    queryFn: () => api.get<Pagina<Material>>(`/materiais?${qs(f)}`),
  });
}

// Lista larga de códigos (inclui inactivos) só para sugerir o próximo código livre.
export function useCodigosMateriais() {
  return useQuery({
    queryKey: ['materiais-codigos'],
    queryFn: () => api.get<Pagina<Material>>('/materiais?incluirInactivos=true&tamanho=200'),
  });
}

export function useCategorias() {
  return useQuery({
    queryKey: ['categorias'],
    queryFn: () => api.get<{ categorias: Categoria[] }>('/categorias'),
  });
}

const PREFIXOS: Record<string, string> = { PECA: 'PEC', FERRAMENTA: 'FER', EQUIPAMENTO: 'EQU' };

// Devolve o próximo código livre para o tipo (ex.: PEC-006).
export function gerarCodigo(tipo: string, codigos: string[]): string {
  const pref = PREFIXOS[tipo] ?? 'MAT';
  let max = 0;
  for (const c of codigos) {
    const m = c.match(new RegExp(`^${pref}-(\\d+)$`));
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `${pref}-${String(max + 1).padStart(3, '0')}`;
}

export function useMutacoesMaterial() {
  const qc = useQueryClient();
  const invalidar = () => {
    qc.invalidateQueries({ queryKey: ['materiais'] });
    qc.invalidateQueries({ queryKey: ['materiais-codigos'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };
  return {
    criar: useMutation({ mutationFn: (dto: CriarMaterialValues) => api.post('/materiais', dto), onSuccess: invalidar }),
    atualizar: useMutation({ mutationFn: ({ id, dto }: { id: number; dto: EditarMaterialValues }) => api.put(`/materiais/${id}`, dto), onSuccess: invalidar }),
    desativar: useMutation({ mutationFn: (id: number) => api.delete(`/materiais/${id}`), onSuccess: invalidar }),
    reativar: useMutation({ mutationFn: (id: number) => api.post(`/materiais/${id}/reativar`), onSuccess: invalidar }),
  };
}
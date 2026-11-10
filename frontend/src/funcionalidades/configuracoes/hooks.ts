import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../api/cliente.ts';
import type { Material, Movimento, Categoria, Utilizador } from '../../api/types.ts';

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.get<{ status: string; timestamp: string }>('/health'),
    staleTime: 60_000,
  });
}

interface Backup {
  exportadoEm: string;
  versao: string;
  materiais: Material[];
  movimentos: Movimento[];
  categorias: Categoria[];
  utilizadores: Utilizador[];
}

// Descarrega um JSON com os dados do sistema. Util para backup em oficinas
// sem acesso a pg_dump no servidor. Nao substitui backup real da BD.
export function useExportarDados() {
  return useMutation({
    mutationFn: async (): Promise<Backup> => {
      const [mat, mov, cat, usr] = await Promise.all([
        api.get<{ itens: Material[]; total: number }>('/materiais?incluirInactivos=true&tamanho=1000'),
        api.get<{ itens: Movimento[]; total: number }>('/movimentos?tamanho=10000'),
        api.get<{ categorias: Categoria[] }>('/categorias'),
        api.get<{ utilizadores: Utilizador[] }>('/utilizadores'),
      ]);
      return {
        exportadoEm: new Date().toISOString(),
        versao: '1.0.0',
        materiais: mat.itens,
        movimentos: mov.itens,
        categorias: cat.categorias,
        utilizadores: usr.utilizadores,
      };
    },
    onSuccess: (backup) => {
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `oficinagest-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });
}
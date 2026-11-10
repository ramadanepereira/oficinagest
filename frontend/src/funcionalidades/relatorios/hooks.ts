import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/cliente.ts';

export type Periodo = 'diario' | 'semanal' | 'mensal';

export interface FiltroRelatorio {
  periodo: Periodo;
  tipo?: string;
  idCategoria?: number;
}

export interface RelatorioMovimentos {
  periodo: Periodo;
  desde: string;
  ate: string;
  totalMovimentos: number;
  porPeriodo: { periodo: string; entradas: number; saidas: number; ajustesEntrada: number; ajustesSaida: number; total: number }[];
  porTipo: { tipo: 'PECA' | 'FERRAMENTA' | 'EQUIPAMENTO'; total: number }[];
  topMateriais: { idMaterial: number; codigo: string; nome: string; movimentos: number; quantidadeTotal: number }[];
}

export function useRelatorio(f: FiltroRelatorio) {
  const p = new URLSearchParams();
  p.set('periodo', f.periodo);
  if (f.tipo) p.set('tipo', f.tipo);
  if (f.idCategoria) p.set('idCategoria', String(f.idCategoria));
  return useQuery({
    queryKey: ['relatorio', f],
    queryFn: () => api.get<RelatorioMovimentos>(`/relatorios/movimentos?${p.toString()}`),
  });
}
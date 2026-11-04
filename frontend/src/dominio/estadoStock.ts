import { CheckCircle2, TriangleAlert, XCircle, RefreshCw, type LucideIcon } from 'lucide-react';
import type { EstadoStock } from '../api/types.ts';

// Apresentação dos estados (secção 9): rótulo, cor e ícone. Sem lógica de transição.
export interface ApresentacaoEstado {
  rotulo: string;
  classes: string;
  Icone: LucideIcon;
}

export const MAPA_ESTADO: Record<EstadoStock, ApresentacaoEstado> = {
  DISPONIVEL:   { rotulo: 'Disponível',     classes: 'bg-state-ok/10 text-state-ok',       Icone: CheckCircle2 },
  STOCK_BAIXO:  { rotulo: 'Stock baixo',    classes: 'bg-state-warn/10 text-state-warn',   Icone: TriangleAlert },
  ESGOTADO:     { rotulo: 'Esgotado',       classes: 'bg-state-error/10 text-state-error', Icone: XCircle },
  EM_REPOSICAO: { rotulo: 'Em reposição',   classes: 'bg-state-info/10 text-state-info',   Icone: RefreshCw },
};
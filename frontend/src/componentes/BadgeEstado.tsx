import type { EstadoStock } from '../api/types.ts';
import { MAPA_ESTADO } from '../dominio/estadoStock.ts';

export function BadgeEstado({ estado }: { estado: EstadoStock }) {
  const a = MAPA_ESTADO[estado];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${a.classes}`}>
      <a.Icone className="h-3.5 w-3.5" />
      {a.rotulo}
    </span>
  );
}
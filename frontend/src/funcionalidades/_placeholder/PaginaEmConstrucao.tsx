import { HardHat } from 'lucide-react';
import { Cartao } from '../../componentes/Cartao.tsx';

export function PaginaEmConstrucao({ titulo }: { titulo: string }) {
  return (
    <Cartao className="flex flex-col items-center justify-center gap-3 p-16 text-center">
      <HardHat className="h-10 w-10 text-state-warn" />
      <h1 className="text-xl font-semibold">{titulo}</h1>
      <p className="max-w-sm text-sm text-muted">
        Este ecrã será implementado nos próximos sub-passos (F2–F4), seguindo os mockups.
      </p>
    </Cartao>
  );
}
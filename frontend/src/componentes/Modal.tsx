import type { ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({ aberto, onFechar, titulo, children }: {
  aberto: boolean; onFechar: () => void; titulo: string; children: ReactNode;
}) {
  if (!aberto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onFechar} />
      <div className="relative w-full max-w-md rounded-card border bg-card p-6 shadow-lg dark:bg-card-dark">
        <button onClick={onFechar} className="absolute right-3 top-3 text-muted hover:text-text" aria-label="Fechar">
          <X className="h-4 w-4" />
        </button>
        <h2 className="mb-3 text-lg font-semibold">{titulo}</h2>
        {children}
      </div>
    </div>
  );
}
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal.tsx';

export function Confirmacao({ aberto, onFechar, onConfirmar, titulo, mensagem, ocupado }: {
  aberto: boolean; onFechar: () => void; onConfirmar: () => void;
  titulo: string; mensagem: string; ocupado?: boolean;
}) {
  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={titulo}>
      <div className="space-y-4">
        <p className="flex items-start gap-2 text-sm text-muted">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-state-warn" />
          {mensagem}
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onFechar} className="rounded-lg border px-4 py-2 text-sm hover:bg-surface dark:hover:bg-surface-dark">Cancelar</button>
          <button onClick={onConfirmar} disabled={ocupado} className="rounded-lg bg-state-error px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
            {ocupado ? 'A confirmar…' : 'Confirmar'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
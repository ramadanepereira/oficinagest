import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../componentes/Modal.tsx';
import { useMateriais } from '../inventario/hooks.ts';
import { useMutacoesRequisicao } from './hooks.ts';
import { ApiError } from '../../api/cliente.ts';

const Schema = z.object({
  idMaterial: z.coerce.number().int().positive('Selecione um material'),
  quantidade: z.coerce.number().int('Inteiro').positive('Deve ser > 0'),
});
type Values = z.infer<typeof Schema>;

export function ModalRequisicao({ aberto, onFechar }: {
  aberto: boolean; onFechar: () => void;
}) {
  const { data: materiais } = useMateriais({ tamanho: 200 });
  const { criar } = useMutacoesRequisicao();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { quantidade: 1 },
  });

  async function submeter(v: Values) {
    try {
      await criar.mutateAsync({ idMaterial: v.idMaterial, quantidade: v.quantidade });
      reset();
      onFechar();
    } catch { /* erro abaixo */ }
  }

  const inputCls = 'w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary dark:bg-surface-dark';

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo="Nova Requisição">
      <form onSubmit={handleSubmit(submeter)} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm">Material *</label>
          <select {...register('idMaterial')} className={inputCls}>
            <option value="">Selecionar…</option>
            {(materiais?.itens ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.codigo} — {m.nome} (stock: {m.stock?.quantidade ?? 0})
              </option>
            ))}
          </select>
          {errors.idMaterial && <p className="mt-1 text-xs text-state-error">{errors.idMaterial.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm">Quantidade *</label>
          <input type="number" {...register('quantidade')} className={inputCls} />
          {errors.quantidade && <p className="mt-1 text-xs text-state-error">{errors.quantidade.message}</p>}
        </div>
        {criar.error && (
          <p className="rounded-lg bg-state-error/10 p-2 text-sm text-state-error">
            {criar.error instanceof ApiError ? criar.error.message : 'Erro'}
          </p>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onFechar} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button>
          <button type="submit" disabled={criar.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
            {criar.isPending ? 'A criar…' : 'Criar Requisição'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
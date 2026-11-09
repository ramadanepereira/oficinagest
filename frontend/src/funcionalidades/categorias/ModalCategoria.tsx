import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../componentes/Modal.tsx';
import { useMutacoesCategoria } from './hooks.ts';
import type { Categoria } from '../../api/types.ts';
import { ApiError } from '../../api/cliente.ts';

const Schema = z.object({ descricao: z.string().min(1, 'A descrição é obrigatória') });
type Values = z.infer<typeof Schema>;

export function ModalCategoria({ aberto, onFechar, categoria }: {
  aberto: boolean; onFechar: () => void; categoria: Categoria | null;
}) {
  const { criar, atualizar } = useMutacoesCategoria();
  const { register, handleSubmit, formState: { errors } } = useForm<Values>({
    resolver: zodResolver(Schema),
    defaultValues: { descricao: categoria?.descricao ?? '' },
  });

  async function submeter(v: Values) {
    try {
      if (categoria) await atualizar.mutateAsync({ id: categoria.id, descricao: v.descricao });
      else await criar.mutateAsync(v.descricao);
      onFechar();
    } catch { /* erro abaixo */ }
  }

  const erro = criar.error ?? atualizar.error;

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={categoria ? 'Editar categoria' : 'Nova categoria'}>
      <form onSubmit={handleSubmit(submeter)} className="space-y-3">
        <div>
          <label className="mb-1 block text-sm">Descrição *</label>
          <input {...register('descricao')} autoFocus
            className="w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary dark:bg-surface-dark"
            placeholder="Ex.: Ferramentas" />
          {errors.descricao && <p className="mt-1 text-xs text-state-error">{errors.descricao.message}</p>}
        </div>
        {erro && <p className="rounded-lg bg-state-error/10 p-2 text-sm text-state-error">{erro instanceof ApiError ? erro.message : 'Erro'}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onFechar} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button>
          <button type="submit" disabled={criar.isPending || atualizar.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}
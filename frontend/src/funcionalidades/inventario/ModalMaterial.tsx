import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '../../componentes/Modal.tsx';
import { useCategorias, useMutacoesMaterial, useCodigosMateriais, gerarCodigo } from './hooks.ts';
import { CriarMaterialSchema, EditarMaterialSchema, type CriarMaterialValues, type EditarMaterialValues } from './schema.ts';
import type { Material } from '../../api/types.ts';
import { ApiError } from '../../api/cliente.ts';

const inputCls = 'w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary dark:bg-surface-dark';

export function ModalMaterial({ aberto, onFechar, material }: {
  aberto: boolean; onFechar: () => void; material: Material | null;
}) {
  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={material ? 'Editar material' : 'Adicionar material'}>
      {/* key força o formulário de edição a recriar-se por material (valores sempre correctos) */}
      {material
        ? <FormEditar key={material.id} material={material} onFechar={onFechar} />
        : <FormCriar onFechar={onFechar} />}
    </Modal>
  );
}

function FormCriar({ onFechar }: { onFechar: () => void }) {
  const { data: cat } = useCategorias();
  const { data: codigos } = useCodigosMateriais();
  const { criar } = useMutacoesMaterial();
  const [codigoTocado, setCodigoTocado] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CriarMaterialValues>({
    resolver: zodResolver(CriarMaterialSchema),
    defaultValues: { tipo: 'PECA', unidade: 'un', quantidadeInicial: 0, stockMinimo: 0 },
  });

  const tipoActual = watch('tipo');

  // Preenche o código automaticamente com o próximo livre do tipo,
  // enquanto o utilizador não escrever à mão.
  useEffect(() => {
    if (!codigoTocado && codigos) {
      setValue('codigo', gerarCodigo(tipoActual, codigos.itens.map((m) => m.codigo)));
    }
  }, [tipoActual, codigos, codigoTocado, setValue]);

  async function submeter(v: CriarMaterialValues) {
    try { await criar.mutateAsync(v); onFechar(); } catch { /* erro mostrado abaixo */ }
  }

  return (
    <form onSubmit={handleSubmit(submeter)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm">Código * <span className="text-xs text-muted">(automático)</span></label>
          <input {...register('codigo')} onChange={(e) => { setCodigoTocado(true); }} className={inputCls} placeholder="PEC-001" />
          {errors.codigo && <p className="mt-1 text-xs text-state-error">{errors.codigo.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm">Tipo *</label>
          <select {...register('tipo')} className={inputCls}>
            <option value="PECA">Peça</option>
            <option value="FERRAMENTA">Ferramenta</option>
            <option value="EQUIPAMENTO">Equipamento</option>
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm">Nome *</label>
        <input {...register('nome')} className={inputCls} />
        {errors.nome && <p className="mt-1 text-xs text-state-error">{errors.nome.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm">Categoria *</label>
          <select {...register('idCategoria')} className={inputCls}>
            <option value="">Selecionar…</option>
            {(cat?.categorias ?? []).map((c) => <option key={c.id} value={c.id}>{c.descricao}</option>)}
          </select>
          {errors.idCategoria && <p className="mt-1 text-xs text-state-error">{errors.idCategoria.message}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm">Unidade</label>
          <input {...register('unidade')} className={inputCls} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm">Quantidade inicial</label>
          <input type="number" {...register('quantidadeInicial')} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Stock mínimo</label>
          <input type="number" {...register('stockMinimo')} className={inputCls} />
        </div>
      </div>
      {criar.error && <p className="rounded-lg bg-state-error/10 p-2 text-sm text-state-error">{criar.error instanceof ApiError ? criar.error.message : 'Erro'}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onFechar} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button>
        <button type="submit" disabled={criar.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
          {criar.isPending ? 'A guardar…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}

function FormEditar({ material, onFechar }: { material: Material; onFechar: () => void }) {
  const { atualizar } = useMutacoesMaterial();
  const { register, handleSubmit, formState: { errors } } = useForm<EditarMaterialValues>({
    resolver: zodResolver(EditarMaterialSchema),
    defaultValues: {
      nome: material.nome,
      unidade: material.unidade,
      stockMinimo: material.stock?.stockMinimo ?? 0,
    },
  });

  async function submeter(v: EditarMaterialValues) {
    try { await atualizar.mutateAsync({ id: material.id, dto: v }); onFechar(); } catch { /* erro mostrado abaixo */ }
  }

  return (
    <form onSubmit={handleSubmit(submeter)} className="space-y-3">
      <p className="rounded-lg bg-surface p-2 text-xs text-muted dark:bg-surface-dark">
        Código {material.codigo} · tipo {material.tipo} (não editável).
      </p>
      <div>
        <label className="mb-1 block text-sm">Nome *</label>
        <input {...register('nome')} className={inputCls} />
        {errors.nome && <p className="mt-1 text-xs text-state-error">{errors.nome.message}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm">Unidade</label>
          <input {...register('unidade')} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Stock mínimo</label>
          <input type="number" {...register('stockMinimo')} className={inputCls} />
        </div>
      </div>
      {atualizar.error && <p className="rounded-lg bg-state-error/10 p-2 text-sm text-state-error">{atualizar.error instanceof ApiError ? atualizar.error.message : 'Erro'}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onFechar} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button>
        <button type="submit" disabled={atualizar.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
          {atualizar.isPending ? 'A guardar…' : 'Guardar'}
        </button>
      </div>
    </form>
  );
}
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Modal } from '../../componentes/Modal.tsx';
import { useMutacoesUsuario } from './hooks.ts';
import type { Utilizador } from '../../api/types.ts';
import { ApiError } from '../../api/cliente.ts';

const CriarSchema = z.object({
  nome: z.string().min(1, 'Obrigatório'),
  username: z.string().min(3, 'Mínimo 3 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  perfil: z.enum(['ADMINISTRADOR', 'ATENDENTE', 'MECANICO']),
});
const EditarSchema = z.object({
  nome: z.string().min(1, 'Obrigatório'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  password: z.string().optional().refine((v) => !v || v.length >= 6, 'Mínimo 6 caracteres'),
  perfil: z.enum(['ADMINISTRADOR', 'ATENDENTE', 'MECANICO']),
});

const inputCls = 'w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary dark:bg-surface-dark';

export function ModalUsuario({ aberto, onFechar, usuario }: {
  aberto: boolean; onFechar: () => void; usuario: Utilizador | null;
}) {
  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={usuario ? 'Editar utilizador' : 'Novo utilizador'}>
      {usuario
        ? <FormEditar key={usuario.id} usuario={usuario} onFechar={onFechar} />
        : <FormCriar onFechar={onFechar} />}
    </Modal>
  );
}

function FormCriar({ onFechar }: { onFechar: () => void }) {
  const { criar } = useMutacoesUsuario();
  const [erros, setErros] = useState<Record<string, string>>({});
  const { register, handleSubmit } = useForm({ defaultValues: { perfil: 'MECANICO' as const } });

  async function submeter(v: any) {
    const r = CriarSchema.safeParse(v);
    if (!r.success) {
      const m: Record<string, string> = {};
      for (const i of r.error.issues) m[String(i.path[0])] = i.message;
      setErros(m); return;
    }
    setErros({});
    try { await criar.mutateAsync(r.data); onFechar(); } catch { /* abaixo */ }
  }

  return (
    <form onSubmit={handleSubmit(submeter)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label className="mb-1 block text-sm">Nome *</label><input {...register('nome')} className={inputCls} />{erros.nome && <p className="mt-1 text-xs text-state-error">{erros.nome}</p>}</div>
        <div><label className="mb-1 block text-sm">Username *</label><input {...register('username')} className={inputCls} />{erros.username && <p className="mt-1 text-xs text-state-error">{erros.username}</p>}</div>
      </div>
      <div><label className="mb-1 block text-sm">Email *</label><input {...register('email')} className={inputCls} />{erros.email && <p className="mt-1 text-xs text-state-error">{erros.email}</p>}</div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="mb-1 block text-sm">Telefone</label><input {...register('telefone')} className={inputCls} /></div>
        <div><label className="mb-1 block text-sm">Perfil *</label>
          <select {...register('perfil')} className={inputCls}>
            <option value="MECANICO">Mecânico</option><option value="ATENDENTE">Atendente</option><option value="ADMINISTRADOR">Administrador</option>
          </select>
        </div>
      </div>
      <div><label className="mb-1 block text-sm">Palavra-passe *</label><input type="password" {...register('password')} className={inputCls} />{erros.password && <p className="mt-1 text-xs text-state-error">{erros.password}</p>}</div>
      {criar.error && <p className="rounded-lg bg-state-error/10 p-2 text-sm text-state-error">{criar.error instanceof ApiError ? criar.error.message : 'Erro'}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onFechar} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button>
        <button type="submit" disabled={criar.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">Guardar</button>
      </div>
    </form>
  );
}

function FormEditar({ usuario, onFechar }: { usuario: Utilizador; onFechar: () => void }) {
  const { atualizar } = useMutacoesUsuario();
  const [erros, setErros] = useState<Record<string, string>>({});
  const { register, handleSubmit } = useForm({
    defaultValues: { nome: usuario.nome, email: usuario.email, telefone: usuario.telefone ?? '', password: '', perfil: usuario.perfil },
  });

  async function submeter(v: any) {
    const r = EditarSchema.safeParse({ ...v, password: v.password || undefined });
    if (!r.success) {
      const m: Record<string, string> = {};
      for (const i of r.error.issues) m[String(i.path[0])] = i.message;
      setErros(m); return;
    }
    setErros({});
    const dto: any = { nome: r.data.nome, email: r.data.email, telefone: r.data.telefone, perfil: r.data.perfil };
    if (r.data.password) dto.password = r.data.password;
    try { await atualizar.mutateAsync({ id: usuario.id, dto }); onFechar(); } catch { /* abaixo */ }
  }

  return (
    <form onSubmit={handleSubmit(submeter)} className="space-y-3">
      <p className="rounded-lg bg-surface p-2 text-xs text-muted dark:bg-surface-dark">Username {usuario.username} (não editável).</p>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="mb-1 block text-sm">Nome *</label><input {...register('nome')} className={inputCls} />{erros.nome && <p className="mt-1 text-xs text-state-error">{erros.nome}</p>}</div>
        <div><label className="mb-1 block text-sm">Perfil *</label>
          <select {...register('perfil')} className={inputCls}>
            <option value="MECANICO">Mecânico</option><option value="ATENDENTE">Atendente</option><option value="ADMINISTRADOR">Administrador</option>
          </select>
        </div>
      </div>
      <div><label className="mb-1 block text-sm">Email *</label><input {...register('email')} className={inputCls} />{erros.email && <p className="mt-1 text-xs text-state-error">{erros.email}</p>}</div>
      <div><label className="mb-1 block text-sm">Telefone</label><input {...register('telefone')} className={inputCls} /></div>
      <div><label className="mb-1 block text-sm">Nova palavra-passe <span className="text-xs text-muted">(deixar vazio para manter)</span></label><input type="password" {...register('password')} className={inputCls} />{erros.password && <p className="mt-1 text-xs text-state-error">{erros.password}</p>}</div>
      {atualizar.error && <p className="rounded-lg bg-state-error/10 p-2 text-sm text-state-error">{atualizar.error instanceof ApiError ? atualizar.error.message : 'Erro'}</p>}
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onFechar} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button>
        <button type="submit" disabled={atualizar.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">Guardar</button>
      </div>
    </form>
  );
}
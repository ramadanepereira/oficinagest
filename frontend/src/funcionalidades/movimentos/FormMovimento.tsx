import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowDown, ArrowUp, SlidersHorizontal } from 'lucide-react';
import { useMateriais } from '../inventario/hooks.ts';
import { useRegistarMovimento, type ModoMovimento } from './hooks.ts';
import { MovimentoSchema, AjusteSchema, type MovimentoValues } from './schema.ts';
import { ApiError } from '../../api/cliente.ts';

const CONFIG: Record<ModoMovimento, { titulo: string; Icone: typeof ArrowUp; cor: string }> = {
  entrada: { titulo: 'Entrada de Stock', Icone: ArrowUp, cor: 'text-state-ok' },
  saida: { titulo: 'Saída de Stock', Icone: ArrowDown, cor: 'text-state-error' },
  ajuste: { titulo: 'Ajuste de Stock (ADMIN)', Icone: SlidersHorizontal, cor: 'text-state-warn' },
};

const inputCls = 'w-full rounded-lg border bg-surface px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary dark:bg-surface-dark';

export function FormMovimento({ modo }: { modo: ModoMovimento }) {
  const { data } = useMateriais({ tamanho: 100 });
  const registar = useRegistarMovimento(modo);
  const [errosCampo, setErrosCampo] = useState<Record<string, string>>({});
  const { titulo, Icone, cor } = CONFIG[modo];

  const { register, handleSubmit, reset } = useForm<MovimentoValues>({
    defaultValues: { quantidade: modo === 'ajuste' ? 0 : 1, observacao: '' },
  });

  async function submeter(v: MovimentoValues) {
    const schema = modo === 'ajuste' ? AjusteSchema : MovimentoSchema;
    const r = schema.safeParse(v);
    if (!r.success) {
      const map: Record<string, string> = {};
      for (const iss of r.error.issues) map[String(iss.path[0])] = iss.message;
      setErrosCampo(map);
      return;
    }
    setErrosCampo({});
    try {
      await registar.mutateAsync({ idMaterial: r.data.idMaterial, quantidade: r.data.quantidade, observacao: r.data.observacao });
      reset({ quantidade: modo === 'ajuste' ? 0 : 1, observacao: '' });
    } catch { /* erro API mostrado abaixo */ }
  }

  const erroApi = registar.error instanceof ApiError ? registar.error.message : null;

  return (
    <form onSubmit={handleSubmit(submeter)} className="space-y-3">
      <h2 className={`flex items-center gap-2 font-semibold ${cor}`}>
        <Icone className="h-4 w-4" /> {titulo}
      </h2>
      <div>
        <label className="mb-1 block text-sm">Material *</label>
        <select {...register('idMaterial')} className={inputCls}>
          <option value="">Selecionar…</option>
          {(data?.itens ?? []).map((m) => (
            <option key={m.id} value={m.id}>{m.codigo} — {m.nome} (stock: {m.stock?.quantidade ?? 0})</option>
          ))}
        </select>
        {errosCampo.idMaterial && <p className="mt-1 text-xs text-state-error">{errosCampo.idMaterial}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm">
          Quantidade * {modo === 'ajuste' && <span className="text-xs text-muted">(+ entra, − sai)</span>}
        </label>
        <input type="number" {...register('quantidade')} className={inputCls} />
        {errosCampo.quantidade && <p className="mt-1 text-xs text-state-error">{errosCampo.quantidade}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm">
          Observação {modo === 'ajuste' ? '*' : '(opcional)'}
        </label>
        <input {...register('observacao')} className={inputCls} placeholder={modo === 'ajuste' ? 'Motivo do ajuste…' : ''} />
        {errosCampo.observacao && <p className="mt-1 text-xs text-state-error">{errosCampo.observacao}</p>}
      </div>
      {erroApi && <p className="rounded-lg bg-state-error/10 p-2 text-sm text-state-error">{erroApi}</p>}
      <button type="submit" disabled={registar.isPending}
        className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
        {registar.isPending ? 'A registar…' : 'Registar'}
      </button>
    </form>
  );
}
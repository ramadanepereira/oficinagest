import { useState } from 'react';
import { Sun, Moon, Download, HardHat, CheckCircle2, XCircle, Clock, Info } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider.tsx';
import { pode } from '../../auth/permissoes.ts';
import { useTema } from '../../tema/useTema.ts';
import { useHealth, useExportarDados } from './hooks.ts';
import { Cartao } from '../../componentes/Cartao.tsx';

const opcoesTema: { valor: boolean; rotulo: string; Icone: typeof Sun }[] = [
  { valor: false, rotulo: 'Claro', Icone: Sun },
  { valor: true, rotulo: 'Escuro', Icone: Moon },
];

export function PaginaConfiguracoes() {
  const { usuario } = useAuth();
  const { dark, setDark } = useTema();
  const { data: health, isLoading: healthLoading, refetch: refetchHealth } = useHealth();
  const exportar = useExportarDados();
  const [confirmacaoBackup, setConfirmacaoBackup] = useState(false);

  const podeExportar = usuario ? pode(usuario.perfil, 'exportarDados') : false;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Configurações</h1>

      {/* Estado do sistema */}
      <Cartao className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <HardHat className="h-4 w-4" /> Estado do sistema
          </h2>
          <button onClick={() => refetchHealth()} className="text-xs font-medium text-primary hover:underline">
            Verificar novamente
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            {healthLoading ? <Clock className="h-5 w-5 text-muted" />
              : health ? <CheckCircle2 className="h-5 w-5 text-state-ok" />
              : <XCircle className="h-5 w-5 text-state-error" />}
            <div>
              <p className="text-xs text-muted">Backend</p>
              <p className="text-sm font-medium">{healthLoading ? 'A verificar…' : health ? 'Online' : 'Offline'}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted">Versão</p>
            <p className="text-sm font-medium">OficinaGest v1.0.0</p>
          </div>
          <div>
            <p className="text-xs text-muted">Hora do servidor</p>
            <p className="text-sm font-medium">
              {health?.timestamp
                ? new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'medium' }).format(new Date(health.timestamp))
                : '—'}
            </p>
          </div>
        </div>
      </Cartao>

      {/* Aparência (pessoal, todos os perfis) */}
      <Cartao className="p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <Sun className="h-4 w-4" /> Aparência
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {opcoesTema.map((o) => {
            const activo = dark === o.valor;
            return (
              <button key={o.rotulo} onClick={() => setDark(o.valor)}
                className={`flex flex-col items-center gap-2 rounded-card border p-4 transition-colors ${
                  activo ? 'border-primary bg-primary/5 text-primary' : 'hover:bg-surface dark:hover:bg-surface-dark'
                }`}>
                <o.Icone className="h-6 w-6" />
                <span className="text-sm font-medium">{o.rotulo}</span>
                {activo && <CheckCircle2 className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted">
          A sua preferência é guardada localmente neste navegador.
        </p>
      </Cartao>

      {/* Dados e backup — SÓ ADMIN */}
      {podeExportar && (
        <Cartao className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <Download className="h-4 w-4" /> Dados e backup
          </h2>
          <p className="mb-4 text-sm text-muted">
            Descarrega um ficheiro JSON com os dados do sistema (materiais, movimentos, categorias e utilizadores).
            Útil como cópia de segurança rápida. Não substitui um backup real da base de dados.
          </p>
          {!confirmacaoBackup ? (
            <button onClick={() => setConfirmacaoBackup(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover">
              <Download className="h-4 w-4" /> Exportar dados do sistema
            </button>
          ) : (
            <div className="rounded-lg border border-state-warn/30 bg-state-warn/5 p-4">
              <p className="mb-3 text-sm">
                Confirma a exportação? O ficheiro contém todos os dados do sistema e deve ser guardado em local seguro.
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmacaoBackup(false)} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button>
                <button onClick={() => { exportar.mutate(); setConfirmacaoBackup(false); }}
                  disabled={exportar.isPending}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50">
                  {exportar.isPending ? 'A exportar…' : 'Confirmar e descarregar'}
                </button>
              </div>
            </div>
          )}
        </Cartao>
      )}

      {/* Sobre (todos os perfis) */}
      <Cartao className="p-5">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <Info className="h-4 w-4" /> Sobre o OficinaGest
        </h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted">Descrição</dt>
            <dd>Sistema de Gestão de Inventário para Oficinas</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Versão</dt>
            <dd>1.0.0</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Sessão atual</dt>
            <dd>{usuario?.nome} ({usuario?.perfil})</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Recuperação de palavra-passe</dt>
            <dd>Pelo administrador em Utilizadores → Editar, ou no servidor com <code className="rounded bg-surface px-1 py-0.5 text-xs dark:bg-surface-dark">npm run reset-password</code></dd>
          </div>
        </dl>
      </Cartao>
    </div>
  );
}
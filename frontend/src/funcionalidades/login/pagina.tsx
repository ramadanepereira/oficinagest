import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, LogIn, Package, Wrench, Monitor, Mail } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider.tsx';
import { ApiError } from '../../api/cliente.ts';
import { Logo } from '../../componentes/Logo.tsx';
import { ToggleTema } from '../../tema/ToggleTema.tsx';
import { Modal } from '../../componentes/Modal.tsx';

const EMAIL_ADMIN = 'administrador@oficinagest.local';

export function LoginPage() {
  const { login, usuario } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mostrar, setMostrar] = useState(false);
  const [lembrar, setLembrar] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aEnviar, setAEnviar] = useState(false);
  const [modal, setModal] = useState<'reset' | 'conta' | null>(null);

  if (usuario) { navigate('/dashboard', { replace: true }); return null; }

  async function submeter(e: FormEvent) {
    e.preventDefault();
    setErro(null); setAEnviar(true);
    try {
      await login(username, password, lembrar);
      navigate('/dashboard');
    } catch (err) {
      setErro(err instanceof ApiError ? err.message : 'Erro de ligação ao servidor');
    } finally { setAEnviar(false); }
  }

  const features = [
    { Icone: Package, titulo: 'Peças', texto: 'Controle peças de reposição e componentes.' },
    { Icone: Wrench, titulo: 'Ferramentas', texto: 'Mantenha suas ferramentas organizadas.' },
    { Icone: Monitor, titulo: 'Equipamentos', texto: 'Gerencie seus equipamentos e ativos.' },
  ];

  return (
    <div className="grid min-h-screen lg:grid-cols-[42%_58%]">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#0d1a17] via-[#0a121d] to-[#081019] p-10 text-white lg:flex">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full border-[28px] border-white/5" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full border-[24px] border-white/5" />
        <div className="relative flex items-center gap-3">
          <Logo tamanho={52} corChave="#ffffff" />
          <div>
            <p className="text-2xl font-bold">Oficina<span className="text-primary">Gest</span></p>
            <p className="text-sm text-white/60">Sistema de Inventário para Oficinas</p>
          </div>
        </div>
        <div className="relative space-y-8">
          <h1 className="text-4xl font-bold leading-tight">Controle o seu stock,<br />optimize a sua <span className="text-primary">oficina.</span></h1>
          <ul className="space-y-6">
            {features.map((f) => (
              <li key={f.titulo} className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary text-primary"><f.Icone className="h-5 w-5" /></span>
                <div><p className="font-semibold">{f.titulo}</p><p className="text-sm text-white/60">{f.texto}</p></div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative flex items-center gap-3 text-sm text-white/70"><span className="h-0.5 w-6 rounded bg-primary" />Sistema simples, eficiente e feito para a sua oficina.</p>
      </div>

      <div className="relative flex flex-col items-center justify-center bg-surface px-6 pt-20 pb-16 dark:bg-surface-dark">
        <div className="absolute right-6 top-6"><ToggleTema /></div>

        <div className="w-full max-w-md rounded-card border bg-card p-8 shadow-sm dark:bg-card-dark">
          <div className="mb-6 flex flex-col items-center text-center">
            <Logo tamanho={64} corChave="#0b1220" />
            <h1 className="mt-3 text-2xl font-bold">Oficina<span className="text-primary">Gest</span></h1>
            <p className="text-sm text-muted">Gestão de Inventário para Oficinas</p>
            <h2 className="mt-5 text-2xl font-bold">Bem-vindo de volta!</h2>
            <p className="mt-1 text-sm text-muted">Aceder ao Sistema!</p>
          </div>

          <form onSubmit={submeter} className="space-y-4">
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Nome de utilizador" required
                className="w-full rounded-lg border bg-surface py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary dark:bg-surface-dark" />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" />
              <input type={mostrar ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Palavra-passe" required
                className="w-full rounded-lg border bg-surface py-2.5 pl-9 pr-10 text-sm outline-none focus:ring-2 focus:ring-primary dark:bg-surface-dark" />
              <button type="button" onClick={() => setMostrar((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text"
                aria-label={mostrar ? 'Ocultar' : 'Mostrar'}>{mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2" title="Mantém a sessão aberta por 30 dias">
                <input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} className="h-4 w-4 rounded accent-[#1f9d5a]" />
                Lembrar-me
              </label>
              <button type="button" onClick={() => setModal('reset')} className="font-medium text-primary hover:underline">
                Esqueceu a sua palavra-passe?
              </button>
            </div>

            {erro && <div className="rounded-lg bg-state-error/10 p-3 text-sm text-state-error">{erro}</div>}

            <button type="submit" disabled={aEnviar}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50">
              <LogIn className="h-4 w-4" />{aEnviar ? 'A entrar…' : 'Entrar'}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border dark:bg-border-dark" /> ou <span className="h-px flex-1 bg-border dark:bg-border-dark" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button disabled title="Indisponível — fale com o administrador" className="flex items-center justify-center gap-2 rounded-lg border bg-card py-2.5 text-sm opacity-60 dark:bg-card-dark">
              <span className="grid grid-cols-2 gap-0.5"><span className="h-2 w-2 bg-[#f25022]" /><span className="h-2 w-2 bg-[#7fba00]" /><span className="h-2 w-2 bg-[#00a4ef]" /><span className="h-2 w-2 bg-[#ffb900]" /></span>
              Entrar com Microsoft
            </button>
            <button disabled title="Indisponível — fale com o administrador" className="flex items-center justify-center gap-2 rounded-lg border bg-card py-2.5 text-sm opacity-60 dark:bg-card-dark">
              <span className="font-bold text-[#4285F4]">G</span> Entrar com Google
            </button>
          </div>

          <p className="mt-5 text-center text-sm text-muted">
            Ainda não tem conta?{' '}
            <button type="button" onClick={() => setModal('conta')} className="font-medium text-primary hover:underline">
              Fale com o administrador
            </button>.
          </p>
        </div>

        <p className="absolute bottom-4 right-6 text-xs text-muted">OficinaGest v1.0.0 &nbsp;|&nbsp; Gestão de Inventário para Oficinas</p>
      </div>

      <Modal aberto={modal !== null} onFechar={() => setModal(null)}
        titulo={modal === 'reset' ? 'Repor palavra-passe' : 'Pedir uma conta'}>
        <div className="space-y-3 text-sm text-muted">
          {modal === 'reset' ? (
            <p>O OficinaGest não faz reposição automática de palavras-passe. Contacte o administrador do sistema para repor o seu acesso.</p>
          ) : (
            <p>As contas de utilizador são criadas exclusivamente pelo administrador. Peça-lhe para lhe criar um acesso com o perfil adequado (Atendente ou Mecânico).</p>
          )}
          <p className="flex items-center gap-2 rounded-lg bg-surface p-3 font-medium text-text dark:bg-surface-dark dark:text-text-dark">
            <Mail className="h-4 w-4 text-primary" /> {EMAIL_ADMIN}
          </p>
        </div>
      </Modal>
    </div>
  );
}
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTema, type PreferenciaTema } from './useTema.ts';

const ORDEM: PreferenciaTema[] = ['claro', 'escuro', 'sistema'];

export function ToggleTema() {
  const { preferencia, setPreferencia } = useTema();
  const seguinte = () => {
    const i = ORDEM.indexOf(preferencia);
    setPreferencia(ORDEM[(i + 1) % ORDEM.length]);
  };
  const Icone = preferencia === 'claro' ? Sun : preferencia === 'escuro' ? Moon : Monitor;
  const rotulo = preferencia === 'claro' ? 'Tema claro' : preferencia === 'escuro' ? 'Tema escuro' : 'Tema do sistema';
  return (
    <button onClick={seguinte} aria-label={rotulo} title={rotulo}
      className="rounded-full p-2 text-muted hover:bg-surface dark:hover:bg-surface-dark">
      <Icone className="h-5 w-5" />
    </button>
  );
}
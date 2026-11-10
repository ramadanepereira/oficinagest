import { useEffect, useState } from 'react';

export type PreferenciaTema = 'claro' | 'escuro' | 'sistema';

function temaActual(): PreferenciaTema {
  const guardado = localStorage.getItem('tema') as PreferenciaTema | null;
  if (guardado === 'claro' || guardado === 'escuro' || guardado === 'sistema') return guardado;
  return 'sistema';
}

function aplicar(p: PreferenciaTema) {
  const escuro =
    p === 'escuro' || (p === 'sistema' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', escuro);
}

// Preferência de tema guardada em localStorage (nunca tokens/dados sensíveis).
export function useTema() {
  const [preferencia, setPreferencia] = useState<PreferenciaTema>(temaActual);

  useEffect(() => {
    aplicar(preferencia);
    localStorage.setItem('tema', preferencia);
    if (preferencia === 'sistema') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => aplicar('sistema');
      mql.addEventListener('change', handler);
      return () => mql.removeEventListener('change', handler);
    }
  }, [preferencia]);

  return { preferencia, setPreferencia };
}
import { useEffect, useState } from 'react';

// Preferência de tema guardada em localStorage (só o tema; nunca tokens/dados).
export function useTema() {
  const [dark, setDark] = useState<boolean>(() => localStorage.getItem('tema') === 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('tema', dark ? 'dark' : 'light');
  }, [dark]);

  return { dark, alternar: () => setDark((d) => !d) };
}
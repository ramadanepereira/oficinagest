import { Moon, Sun } from 'lucide-react';
import { useTema } from './useTema.ts';

export function ToggleTema() {
  const { dark, alternar } = useTema();
  return (
    <button onClick={alternar} aria-label="Alternar tema"
      className="flex items-center rounded-full border bg-card p-1 shadow-sm dark:bg-card-dark">
      <span className={`flex h-7 w-7 items-center justify-center rounded-full ${dark ? 'bg-transparent text-muted' : 'bg-primary text-white'}`}>
        <Moon className="h-4 w-4" />
      </span>
      <span className={`flex h-7 w-7 items-center justify-center rounded-full ${dark ? 'bg-primary text-white' : 'bg-transparent text-muted'}`}>
        <Sun className="h-4 w-4" />
      </span>
    </button>
  );
}
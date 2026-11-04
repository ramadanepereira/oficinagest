import type { ReactNode } from 'react';

export function Cartao({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-card border bg-card dark:bg-card-dark shadow-sm ${className}`}>
      {children}
    </div>
  );
}
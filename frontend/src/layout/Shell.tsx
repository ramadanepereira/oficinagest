import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.tsx';
import { BarraSuperior } from './BarraSuperior.tsx';

export function Shell() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Overlay escuro por trás do drawer em mobile */}
      {menuAberto && (
        <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setMenuAberto(false)} />
      )}
      <Sidebar aberto={menuAberto} onFechar={() => setMenuAberto(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <BarraSuperior onAbrirMenu={() => setMenuAberto(true)} />
        <main className="relative flex-1 overflow-y-auto bg-surface p-4 sm:p-6 dark:bg-surface-dark">
          <Outlet />
          <p className="mt-4 flex items-center justify-end gap-1.5 text-xs text-muted">
            <span className="h-2 w-2 rounded-full bg-state-ok" /> Sistema online
          </p>
        </main>
      </div>
    </div>
  );
}
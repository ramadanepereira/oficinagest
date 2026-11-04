import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.tsx';
import { BarraSuperior } from './BarraSuperior.tsx';

export function Shell() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <BarraSuperior />
        <main className="relative flex-1 overflow-y-auto bg-surface p-6 dark:bg-surface-dark">
          <Outlet />
          <p className="pointer-events-none fixed bottom-3 right-4 flex items-center gap-1.5 text-xs text-muted">
            <span className="h-2 w-2 rounded-full bg-state-ok" /> Sistema online
          </p>
        </main>
      </div>
    </div>
  );
}
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import { RotaProtegida } from './RotaProtegida.tsx';
import type { Utilizador } from '../api/types.ts';

const estadoAuth: { usuario: Utilizador | null; carregando: boolean } = { usuario: null, carregando: false };
vi.mock('./AuthProvider.tsx', () => ({ useAuth: () => estadoAuth }));

const admin: Utilizador = { id: 1, nome: 'A', username: 'a', email: 'a@a', perfil: 'ADMINISTRADOR', activo: true };
const mec: Utilizador = { id: 3, nome: 'M', username: 'm', email: 'm@m', perfil: 'MECANICO', activo: true };

function renderRota(accao?: Parameters<typeof RotaProtegida>[0]['accao']) {
  return render(
    <MemoryRouter initialEntries={['/alvo']}>
      <Routes>
        <Route path="/login" element={<div>LOGIN</div>} />
        <Route path="/alvo" element={<RotaProtegida accao={accao}><div>CONTEUDO</div></RotaProtegida>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RotaProtegida', () => {
  it('redireciona para /login sem sessão', () => {
    estadoAuth.usuario = null;
    renderRota();
    expect(screen.getByText('LOGIN')).toBeInTheDocument();
  });
  it('mostra o conteúdo com sessão e permissão', () => {
    estadoAuth.usuario = admin;
    renderRota('gerirUtilizadores');
    expect(screen.getByText('CONTEUDO')).toBeInTheDocument();
  });
  it('bloqueia (Sem permissão) sem a acção necessária', () => {
    estadoAuth.usuario = mec;
    renderRota('gerirUtilizadores');
    expect(screen.getByText(/Sem permissão/i)).toBeInTheDocument();
  });
});
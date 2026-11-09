import { render, screen } from '@testing-library/react';
import { BadgeEstado } from './BadgeEstado.tsx';
import { MAPA_ESTADO } from '../dominio/estadoStock.ts';
import type { EstadoStock } from '../api/types.ts';

const estados: EstadoStock[] = ['DISPONIVEL', 'STOCK_BAIXO', 'ESGOTADO', 'EM_REPOSICAO'];

describe('BadgeEstado (secção 9)', () => {
  for (const e of estados) {
    it(`mostra o rótulo correcto para ${e}`, () => {
      render(<BadgeEstado estado={e} />);
      expect(screen.getByText(MAPA_ESTADO[e].rotulo)).toBeInTheDocument();
    });
  }
});
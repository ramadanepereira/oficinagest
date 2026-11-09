import { render, screen } from '@testing-library/react';
import { BotoesReposicao } from './BotoesReposicao.tsx';
import type { Material } from '../api/types.ts';

function mat(estado: Material['stock'] extends infer _ ? any : never): Material {
  return {
    id: 1, codigo: 'T-1', nome: 'Teste', tipo: 'PECA', idCategoria: 1, unidade: 'un', activo: true,
    stock: { quantidade: 1, stockMinimo: 1, estado },
  };
}
const noop = () => {};

describe('BotoesReposicao (secção 9)', () => {
  it('ADMIN + STOCK_BAIXO mostra Iniciar', () => {
    render(<BotoesReposicao material={mat('STOCK_BAIXO')} perfil="ADMINISTRADOR" onIniciar={noop} onCancelar={noop} />);
    expect(screen.getByTitle('Iniciar reposição')).toBeInTheDocument();
  });
  it('ADMIN + ESGOTADO mostra Iniciar', () => {
    render(<BotoesReposicao material={mat('ESGOTADO')} perfil="ADMINISTRADOR" onIniciar={noop} onCancelar={noop} />);
    expect(screen.getByTitle('Iniciar reposição')).toBeInTheDocument();
  });
  it('ADMIN + EM_REPOSICAO mostra Cancelar', () => {
    render(<BotoesReposicao material={mat('EM_REPOSICAO')} perfil="ADMINISTRADOR" onIniciar={noop} onCancelar={noop} />);
    expect(screen.getByTitle('Cancelar reposição')).toBeInTheDocument();
  });
  it('ADMIN + DISPONIVEL não mostra botões', () => {
    render(<BotoesReposicao material={mat('DISPONIVEL')} perfil="ADMINISTRADOR" onIniciar={noop} onCancelar={noop} />);
    expect(screen.queryByTitle('Iniciar reposição')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Cancelar reposição')).not.toBeInTheDocument();
  });
  it('MECANICO + STOCK_BAIXO não mostra botões (só ADMIN)', () => {
    render(<BotoesReposicao material={mat('STOCK_BAIXO')} perfil="MECANICO" onIniciar={noop} onCancelar={noop} />);
    expect(screen.queryByTitle('Iniciar reposição')).not.toBeInTheDocument();
  });
});
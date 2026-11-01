import { describe, it, expect } from 'vitest';
import { MaterialFactory, TipoMaterialInvalidoError } from './MaterialFactory.js';
import { Peca } from './Peca.js';
import { Ferramenta } from './Ferramenta.js';
import { Equipamento } from './Equipamento.js';

const propsBase = {
  id: 1, codigo: 'TST-001', nome: 'Teste', idCategoria: 1,
  unidade: 'un', activo: true, criadoEm: new Date(),
};

describe('MaterialFactory (Factory Method)', () => {
  it('cria Peca para tipo PECA', () => {
    const m = MaterialFactory.criar('PECA', propsBase);
    expect(m).toBeInstanceOf(Peca);
    expect(m.rotuloTipo()).toBe('Peça');
  });
  it('cria Ferramenta para tipo FERRAMENTA', () => {
    const m = MaterialFactory.criar('FERRAMENTA', propsBase);
    expect(m).toBeInstanceOf(Ferramenta);
    expect(m.rotuloTipo()).toBe('Ferramenta');
  });
  it('cria Equipamento para tipo EQUIPAMENTO', () => {
    const m = MaterialFactory.criar('EQUIPAMENTO', propsBase);
    expect(m).toBeInstanceOf(Equipamento);
    expect(m.rotuloTipo()).toBe('Equipamento');
  });
  it('lança erro para tipo inválido', () => {
    expect(() => MaterialFactory.criar('CONSUMIVEL' as any, propsBase))
      .toThrow(TipoMaterialInvalidoError);
  });
});
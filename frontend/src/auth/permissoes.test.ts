import { describe, it, expect } from 'vitest';
import { pode, ITENS_MENU, type Accao } from './permissoes.ts';

describe('permissoes (matriz perfil x accao, secção 6)', () => {
  it('ADMIN pode tudo', () => {
    const accoes: Accao[] = ['verDashboard', 'gerirMateriais', 'registarMovimentos', 'verRelatorios', 'gerirUtilizadores', 'gerirCategorias', 'verConfiguracoes', 'exportarDados'];
    for (const a of accoes) expect(pode('ADMINISTRADOR', a)).toBe(true);
  });
  it('MECANICO não vê relatórios, utilizadores nem regista movimentos', () => {
    expect(pode('MECANICO', 'verRelatorios')).toBe(false);
    expect(pode('MECANICO', 'gerirUtilizadores')).toBe(false);
    expect(pode('MECANICO', 'registarMovimentos')).toBe(false);
  });
  it('MECANICO cria requisições mas não aprova', () => {
    expect(pode('MECANICO', 'criarRequisicoes')).toBe(true);
    expect(pode('MECANICO', 'aprovarRequisicoes')).toBe(false);
  });
  it('ATENDENTE aprova e regista movimentos, mas não gere utilizadores', () => {
    expect(pode('ATENDENTE', 'aprovarRequisicoes')).toBe(true);
    expect(pode('ATENDENTE', 'registarMovimentos')).toBe(true);
    expect(pode('ATENDENTE', 'gerirUtilizadores')).toBe(false);
  });
  it('menu por perfil: MECANICO tem menos itens que ADMIN', () => {
    const admin = ITENS_MENU.filter((i) => pode('ADMINISTRADOR', i.accao)).length;
    const mec = ITENS_MENU.filter((i) => pode('MECANICO', i.accao)).length;
    expect(mec).toBeLessThan(admin);
  });
});
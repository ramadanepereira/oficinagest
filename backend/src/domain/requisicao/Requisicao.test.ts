import { describe, it, expect } from 'vitest';
import { Requisicao } from './Requisicao.js';
import { TransicaoRequisicaoInvalidaError } from './TransicaoRequisicaoInvalidaError.js';

function nova(estado: 'PENDENTE' | 'APROVADA' | 'REPROVADA' | 'DEVOLVIDA' = 'PENDENTE') {
  return new Requisicao({
    id: 1, idMaterial: 1, idMecanico: 1, idAtendente: null,
    quantidade: 2, estado, criadoEm: new Date(),
  });
}

describe('Requisicao (máquina de estados)', () => {
  it('aprovar de PENDENTE -> APROVADA e regista atendente', () => {
    const r = nova('PENDENTE');
    r.aprovar(9);
    expect(r.estado).toBe('APROVADA');
    expect(r.idAtendente).toBe(9);
  });
  it('reprovar de PENDENTE -> REPROVADA e regista atendente', () => {
    const r = nova('PENDENTE');
    r.reprovar(9);
    expect(r.estado).toBe('REPROVADA');
    expect(r.idAtendente).toBe(9);
  });
  it('devolver de APROVADA -> DEVOLVIDA', () => {
    const r = nova('APROVADA');
    r.devolver();
    expect(r.estado).toBe('DEVOLVIDA');
  });
  it('aprovar de APROVADA lança erro', () => {
    const r = nova('APROVADA');
    expect(() => r.aprovar(9)).toThrow(TransicaoRequisicaoInvalidaError);
  });
  it('aprovar de REPROVADA lança erro', () => {
    const r = nova('REPROVADA');
    expect(() => r.aprovar(9)).toThrow(TransicaoRequisicaoInvalidaError);
  });
  it('devolver de PENDENTE lança erro', () => {
    const r = nova('PENDENTE');
    expect(() => r.devolver()).toThrow(TransicaoRequisicaoInvalidaError);
  });
  it('reprovar de DEVOLVIDA lança erro', () => {
    const r = nova('DEVOLVIDA');
    expect(() => r.reprovar(9)).toThrow(TransicaoRequisicaoInvalidaError);
  });
});
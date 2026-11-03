import { describe, it, expect } from 'vitest';
import { Quantidade } from './Quantidade.js';
import { QuantidadeInvalidaError } from './QuantidadeInvalidaError.js';

describe('Quantidade (value object imutável)', () => {
  describe('deStock (RN08: stock ≥ 0)', () => {
    it('aceita 0', () => {
      expect(Quantidade.deStock(0).valor).toBe(0);
    });
    it('aceita inteiros positivos', () => {
      expect(Quantidade.deStock(10).valor).toBe(10);
    });
    it('rejeita negativo', () => {
      expect(() => Quantidade.deStock(-1)).toThrow(QuantidadeInvalidaError);
    });
    it('rejeita decimal', () => {
      expect(() => Quantidade.deStock(1.5)).toThrow(QuantidadeInvalidaError);
    });
  });

  describe('deMovimento (RN11: inteiro > 0)', () => {
    it('aceita 1', () => {
      expect(Quantidade.deMovimento(1).valor).toBe(1);
    });
    it('aceita inteiros positivos', () => {
      expect(Quantidade.deMovimento(10).valor).toBe(10);
    });
    it('rejeita 0', () => {
      expect(() => Quantidade.deMovimento(0)).toThrow(QuantidadeInvalidaError);
    });
    it('rejeita negativo', () => {
      expect(() => Quantidade.deMovimento(-5)).toThrow(QuantidadeInvalidaError);
    });
    it('rejeita decimal', () => {
      expect(() => Quantidade.deMovimento(2.5)).toThrow(QuantidadeInvalidaError);
    });
  });

  describe('operações', () => {
    it('adicionar retorna nova Quantidade (imutável)', () => {
      const a = Quantidade.deStock(5);
      const b = Quantidade.deStock(3);
      const c = a.adicionar(b);
      expect(c.valor).toBe(8);
      expect(a.valor).toBe(5); // original preservado
    });
    it('subtrair retorna nova Quantidade', () => {
      const a = Quantidade.deStock(5);
      const b = Quantidade.deStock(3);
      expect(a.subtrair(b).valor).toBe(2);
    });
    it('subtrair mais do que existe lança erro (RN08)', () => {
      const a = Quantidade.deStock(2);
      const b = Quantidade.deStock(5);
      expect(() => a.subtrair(b)).toThrow(QuantidadeInvalidaError);
    });
  });
});
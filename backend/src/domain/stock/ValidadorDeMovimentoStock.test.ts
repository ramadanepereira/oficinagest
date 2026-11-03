import { describe, it, expect } from 'vitest';
import { ValidadorDeMovimentoStock } from './ValidadorDeMovimentoStock.js';
import { StockInsuficienteError } from './StockInsuficienteError.js';
import { QuantidadeInvalidaError } from './QuantidadeInvalidaError.js';

describe('ValidadorDeMovimentoStock (RN02/RN11)', () => {
  describe('validarEntrada', () => {
    it('aceita inteiro > 0', () => {
      expect(ValidadorDeMovimentoStock.validarEntrada(5).valor).toBe(5);
    });
    it('rejeita 0 (RN11)', () => {
      expect(() => ValidadorDeMovimentoStock.validarEntrada(0)).toThrow(QuantidadeInvalidaError);
    });
    it('rejeita decimal (RN11)', () => {
      expect(() => ValidadorDeMovimentoStock.validarEntrada(2.5)).toThrow(QuantidadeInvalidaError);
    });
  });

  describe('validarSaida (RN02 + RN11)', () => {
    it('aceita saída quando há stock suficiente', () => {
      expect(ValidadorDeMovimentoStock.validarSaida(10, 3).valor).toBe(3);
    });
    it('aceita saída que esgota o stock (quantidade = stock)', () => {
      expect(ValidadorDeMovimentoStock.validarSaida(5, 5).valor).toBe(5);
    });
    it('rejeita saída quando stock insuficiente (RN02)', () => {
      expect(() => ValidadorDeMovimentoStock.validarSaida(2, 5)).toThrow(StockInsuficienteError);
    });
    it('rejeita saída quando stock é 0 (RN02)', () => {
      expect(() => ValidadorDeMovimentoStock.validarSaida(0, 1)).toThrow(StockInsuficienteError);
    });
    it('rejeita quantidade não inteira (RN11)', () => {
      expect(() => ValidadorDeMovimentoStock.validarSaida(10, 2.5)).toThrow(QuantidadeInvalidaError);
    });
  });

  describe('validarAjuste (observação obrigatória, secção 6.5)', () => {
    it('aceita ajuste positivo com observação', () => {
      expect(ValidadorDeMovimentoStock.validarAjuste(5, 3, 'Inventário corrigido').valor).toBe(3);
    });
    it('aceita ajuste negativo quando há stock suficiente', () => {
      expect(ValidadorDeMovimentoStock.validarAjuste(10, -3, 'Inventário corrigido').valor).toBe(3);
    });
    it('rejeita ajuste sem observação', () => {
      expect(() => ValidadorDeMovimentoStock.validarAjuste(5, 3, undefined)).toThrow(QuantidadeInvalidaError);
      expect(() => ValidadorDeMovimentoStock.validarAjuste(5, 3, '')).toThrow(QuantidadeInvalidaError);
      expect(() => ValidadorDeMovimentoStock.validarAjuste(5, 3, '   ')).toThrow(QuantidadeInvalidaError);
    });
    it('rejeita ajuste negativo quando stock insuficiente (RN02)', () => {
      expect(() => ValidadorDeMovimentoStock.validarAjuste(2, -5, 'Inventário'))
        .toThrow(StockInsuficienteError);
    });
  });
});
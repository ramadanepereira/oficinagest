import { Quantidade } from './Quantidade.js';
import { StockInsuficienteError } from './StockInsuficienteError.js';
import { QuantidadeInvalidaError } from './QuantidadeInvalidaError.js';

// Regras centralizadas aqui (SRP/DRY):
//   - RN02: não é permitida saída sem stock disponível.
//   - RN08: a quantidade em stock nunca é negativa (garantida por Quantidade).
//   - RN11: a quantidade movimentada é inteira > 0 (garantida por Quantidade.deMovimento).
//
// Este validador é chamado DENTRO do UnitOfWork (com FOR UPDATE) para que duas
// saídas simultâneas não deixem o stock negativo (RNF04).
export class ValidadorDeMovimentoStock {
  // Valida uma entrada. Hoje apenas verifica que a quantidade é válida (RN11).
  static validarEntrada(valor: number): Quantidade {
    return Quantidade.deMovimento(valor);
  }

  // Valida uma saída: quantidade válida (RN11) E stock suficiente (RN02).
  static validarSaida(stockActual: number, valor: number): Quantidade {
    const qtdMovimento = Quantidade.deMovimento(valor);
    const stock = Quantidade.deStock(stockActual);

    // RN02: saída sem stock disponível → erro de domínio.
    if (qtdMovimento.maiorQue(stock)) {
      throw new StockInsuficienteError(stockActual, valor);
    }
    return qtdMovimento;
  }

  // Ajustes exigem observação (secção 6.5). Ajustes positivos são entradas;
  // negativos são saídas, e aplicam as mesmas regras (RN02/RN11).
  static validarAjuste(stockActual: number, valor: number, observacao: string | undefined): Quantidade {
    if (!observacao || observacao.trim() === '') {
      // Observação obrigatória em ajustes (secção 6.5).
      throw new QuantidadeInvalidaError('Ajuste exige observação obrigatória');
    }
    if (valor > 0) {
      return Quantidade.deMovimento(valor);
    }
    // Ajuste negativo = saída: aplica RN02 (sem stock, não sai).
    return this.validarSaida(stockActual, Math.abs(valor));
  }
}
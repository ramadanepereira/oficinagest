import { QuantidadeInvalidaError } from './QuantidadeInvalidaError.js';

// VALUE OBJECT imutável: encapsula TODA a validação numérica do stock.
// Campos internos com prefixo _ ; acesso público só pelos getters (SRP/encapsulamento).
//
// RN08: o stock nunca é negativo -> deStock aceita 0 ou mais.
// RN11: a quantidade movimentada é inteira > 0 -> deMovimento aceita > 0.
export class Quantidade {
  private readonly _valor: number;

  private constructor(valor: number) {
    this._valor = valor;
  }

  static deStock(n: number): Quantidade {
    if (!Number.isInteger(n)) {
      throw new QuantidadeInvalidaError(`Quantidade de stock deve ser inteira, recebido: ${n}`);
    }
    if (n < 0) {
      throw new QuantidadeInvalidaError(`Quantidade de stock não pode ser negativa: ${n}`);
    }
    return new Quantidade(n);
  }

  static deMovimento(n: number): Quantidade {
    if (!Number.isInteger(n)) {
      throw new QuantidadeInvalidaError(`Quantidade movimentada deve ser inteira, recebido: ${n}`);
    }
    if (n <= 0) {
      throw new QuantidadeInvalidaError(`Quantidade movimentada deve ser positiva: ${n}`);
    }
    return new Quantidade(n);
  }

  get valor(): number { return this._valor; }

  adicionar(outra: Quantidade): Quantidade {
    return Quantidade.deStock(this._valor + outra._valor);
  }

  subtrair(outra: Quantidade): Quantidade {
    const resultado = this._valor - outra._valor;
    if (resultado < 0) {
      throw new QuantidadeInvalidaError(
        `Stock insuficiente: tem ${this._valor}, tentou retirar ${outra._valor}`,
      );
    }
    return Quantidade.deStock(resultado);
  }

  maiorQue(outra: Quantidade): boolean { return this._valor > outra._valor; }
  menorOuIgualA(outra: Quantidade): boolean { return this._valor <= outra._valor; }
  igualA(outra: Quantidade): boolean { return this._valor === outra._valor; }
  eZero(): boolean { return this._valor === 0; }
}
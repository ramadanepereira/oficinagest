import { QuantidadeInvalidaError } from './QuantidadeInvalidaError.js';

// VALUE OBJECT imutável: encapsula TODA a validação numérica do stock.
// Fora desta classe nunca se manipulam números soltos para quantidades.
//
// RN08: o stock nunca é negativo → deStock aceita 0 ou mais.
// RN11: a quantidade movimentada é inteira > 0 → deMovimento aceita > 0.
//
// A coluna `unidade` do material (un, l, kg...) é apenas texto de apresentação:
// itens fraccionáveis registam-se na unidade de stock (ex.: "Óleo 1 L — garrafa").
export class Quantidade {
  private constructor(private readonly valor: number) {}

  // Factory: cria uma Quantidade para um valor de stock (≥ 0).
  static deStock(n: number): Quantidade {
    if (!Number.isInteger(n)) {
      throw new QuantidadeInvalidaError(`Quantidade de stock deve ser inteira, recebido: ${n}`);
    }
    if (n < 0) {
      // RN08: o stock nunca é negativo.
      throw new QuantidadeInvalidaError(`Quantidade de stock não pode ser negativa: ${n}`);
    }
    return new Quantidade(n);
  }

  // Factory: cria uma Quantidade para um movimento (inteiro > 0).
  static deMovimento(n: number): Quantidade {
    if (!Number.isInteger(n)) {
      throw new QuantidadeInvalidaError(`Quantidade movimentada deve ser inteira, recebido: ${n}`);
    }
    if (n <= 0) {
      // RN11: quantidade > 0 em qualquer movimento.
      throw new QuantidadeInvalidaError(`Quantidade movimentada deve ser positiva: ${n}`);
    }
    return new Quantidade(n);
  }

  get valor(): number { return this.valor; }

  // Retorna uma nova Quantidade com o valor adicionado (imutável).
  adicionar(outra: Quantidade): Quantidade {
    // RN08: a soma nunca é negativa porque ambas as parcelas são ≥ 0.
    return Quantidade.deStock(this.valor + outra.valor);
  }

  // Retorna uma nova Quantidade com o valor subtraído.
  // Se o resultado fosse negativo, lança QuantidadeInvalidaError (RN08).
  subtrair(outra: Quantidade): Quantidade {
    const resultado = this.valor - outra.valor;
    if (resultado < 0) {
      throw new QuantidadeInvalidaError(
        `Stock insuficiente: tem ${this.valor}, tentou retirar ${outra.valor}`
      );
    }
    return Quantidade.deStock(resultado);
  }

  // Comparações úteis (imutáveis).
  maiorQue(outra: Quantidade): boolean { return this.valor > outra.valor; }
  menorOuIgualA(outra: Quantidade): boolean { return this.valor <= outra.valor; }
  igualA(outra: Quantidade): boolean { return this.valor === outra.valor; }
  eZero(): boolean { return this.valor === 0; }
}
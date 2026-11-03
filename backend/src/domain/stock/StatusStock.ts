import { TransicaoInvalidaError } from './TransicaoInvalidaError.js';
import type { EstadoStock } from './EstadoStock.js';

// PADRÃO STATE (secção 6.3 do enunciado):
// Cada classe de estado decide AS SUAS PRÓPRIAS transições.
// PROIBIDO um if/switch central a calcular o estado fora destas classes.
//
// Métodos comuns (recebem qtd pós-operação e min):
//   nome(): EstadoStock
//   aposEntrada(qtd, min): StatusStock
//   aposSaida(qtd, min): StatusStock
//   iniciarReposicao(qtd, min): StatusStock    — pode lançar TransicaoInvalidaError
//   cancelarReposicao(qtd, min): StatusStock   — pode lançar TransicaoInvalidaError
//   aposAlterarMinimo(qtd, min): StatusStock

export interface StatusStock {
  nome(): EstadoStock;
  aposEntrada(qtd: number, min: number): StatusStock;
  aposSaida(qtd: number, min: number): StatusStock;
  iniciarReposicao(qtd: number, min: number): StatusStock;
  cancelarReposicao(qtd: number, min: number): StatusStock;
  aposAlterarMinimo(qtd: number, min: number): StatusStock;
}

// Helper privado: recalcula o estado pela quantidade e mínimo, usado em
// várias transições (entradas, reposição parcial, cancelar reposição,
// alterar mínimo). EM_REPOSICAO nunca é produzido por recálculo.
function recalcular(qtd: number, min: number): StatusStock {
  if (qtd === 0) return new Esgotado();
  if (qtd <= min) return new StockBaixo();
  return new Disponivel();
}

// DISPONIVEL: qtd > min
//   saída       → STOCK_BAIXO se 0 < qtd ≤ min; ESGOTADO se qtd = 0; senão fica
//   entrada     → fica
//   iniciarReposicao → TransicaoInvalidaError (não se repõe o que está disponível)
export class Disponivel implements StatusStock {
  nome(): EstadoStock { return 'DISPONIVEL'; }

  aposEntrada(_qtd: number, _min: number): StatusStock {
    // Entrada em DISPONIVEL: continua DISPONIVEL (qtd já era > min e só cresceu).
    return this;
  }

  aposSaida(qtd: number, min: number): StatusStock {
    // qtd já é o valor PÓS-saída.
    if (qtd === 0) return new Esgotado();
    if (qtd <= min) return new StockBaixo();
    return this;
  }

  iniciarReposicao(qtd: number, min: number): StatusStock {
    // Regra 6.4: DISPONIVEL não aceita iniciar reposição.
    throw new TransicaoInvalidaError(this.nome(), 'iniciarReposicao');
  }

  cancelarReposicao(qtd: number, min: number): StatusStock {
    // Regra 6.4: só EM_REPOSICAO aceita cancelar.
    throw new TransicaoInvalidaError(this.nome(), 'cancelarReposicao');
  }

  aposAlterarMinimo(qtd: number, min: number): StatusStock {
    // Recalcula: se o novo mínimo ficou >= qtd, passa a STOCK_BAIXO.
    return recalcular(qtd, min);
  }
}

// STOCK_BAIXO: 0 < qtd ≤ min
//   entrada     → DISPONIVEL se qtd > min; senão fica
//   saída       → ESGOTADO se qtd = 0; senão fica
//   iniciarReposicao → EM_REPOSICAO
export class StockBaixo implements StatusStock {
  nome(): EstadoStock { return 'STOCK_BAIXO'; }

  aposEntrada(qtd: number, min: number): StatusStock {
    if (qtd > min) return new Disponivel();
    return this;
  }

  aposSaida(qtd: number, _min: number): StatusStock {
    if (qtd === 0) return new Esgotado();
    return this;
  }

  iniciarReposicao(_qtd: number, _min: number): StatusStock {
    return new EmReposicao();
  }

  cancelarReposicao(qtd: number, min: number): StatusStock {
    throw new TransicaoInvalidaError(this.nome(), 'cancelarReposicao');
  }

  aposAlterarMinimo(qtd: number, min: number): StatusStock {
    return recalcular(qtd, min);
  }
}

// ESGOTADO: qtd = 0
//   entrada     → DISPONIVEL se qtd > min; STOCK_BAIXO se 0 < qtd ≤ min
//   saída       → impossível (RN02 rejeita antes de chegar ao estado)
//   iniciarReposicao → EM_REPOSICAO
export class Esgotado implements StatusStock {
  nome(): EstadoStock { return 'ESGOTADO'; }

  aposEntrada(qtd: number, min: number): StatusStock {
    // Regra 6.4: entrada em ESGOTADO calcula o novo estado pela quantidade.
    return recalcular(qtd, min);
  }

  aposSaida(_qtd: number, _min: number): StatusStock {
    // Defensivo: RN02 deveria ter rejeitado antes, mas se chegar aqui, fica.
    return this;
  }

  iniciarReposicao(_qtd: number, _min: number): StatusStock {
    return new EmReposicao();
  }

  cancelarReposicao(qtd: number, min: number): StatusStock {
    throw new TransicaoInvalidaError(this.nome(), 'cancelarReposicao');
  }

  aposAlterarMinimo(qtd: number, min: number): StatusStock {
    // qtd é 0 em ESGOTADO, logo recalcular → Esgotado. Mantém.
    return recalcular(qtd, min);
  }
}

// EM_REPOSICAO: estado "manual", só entra por iniciarReposicao
//   entrada     → DISPONIVEL se qtd > min; senão fica (reposição parcial)
//   saída       → fica (mesmo que qtd chegue a 0) — a reposição não é interrompida
//   cancelarReposicao → recalcula pela quantidade (ESGOTADO, STOCK_BAIXO ou DISPONIVEL)
//   iniciarReposicao → TransicaoInvalidaError (já está em reposição)
export class EmReposicao implements StatusStock {
  nome(): EstadoStock { return 'EM_REPOSICAO'; }

  aposEntrada(qtd: number, min: number): StatusStock {
    // Reposição parcial: se qtd ainda ≤ min, continua EM_REPOSICAO.
    if (qtd > min) return new Disponivel();
    return this;
  }

  aposSaida(qtd: number, min: number): StatusStock {
    // Saída durante reposição: fica EM_REPOSICAO (mesmo com qtd = 0).
    return this;
  }

  iniciarReposicao(qtd: number, min: number): StatusStock {
    throw new TransicaoInvalidaError(this.nome(), 'iniciarReposicao');
  }

  cancelarReposicao(qtd: number, min: number): StatusStock {
    // Cancelamento: recalcula o estado "natural" pela quantidade.
    return recalcular(qtd, min);
  }

  aposAlterarMinimo(qtd: number, min: number): StatusStock {
    // Regra 6.4: aposAlterarMinimo em EM_REPOSICAO NÃO recalcula — fica.
    return this;
  }
}

// Namespace: funções auxiliares que não são métodos de instância.
export namespace StatusStock {
  // Estado inicial ao criar um material (regra 6.2 do enunciado).
  // EM_REPOSICAO nunca é estado inicial (é manual).
  export function inicial(qtd: number, min: number): StatusStock {
    return recalcular(qtd, min);
  }

  // Cria uma instância a partir do ENUM persistido na BD.
  // Usado pelos repositórios ao ler uma linha.
  export function deEstado(estado: EstadoStock): StatusStock {
    switch (estado) {
      case 'DISPONIVEL': return new Disponivel();
      case 'STOCK_BAIXO': return new StockBaixo();
      case 'ESGOTADO': return new Esgotado();
      case 'EM_REPOSICAO': return new EmReposicao();
      default:
        throw new Error(`Estado de stock desconhecido: ${estado}`);
    }
  }
}
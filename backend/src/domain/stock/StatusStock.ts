import type { EstadoStock } from './EstadoStock.js';

// PADRÃO STATE: cada estado é uma classe. Por agora só nome(); as transições
// (aposEntrada, aposSaida, iniciarReposicao...) são ADICIONADAS no Incremento 2 (OCP).
export interface StatusStock { nome(): EstadoStock; }

export class Disponivel implements StatusStock { nome(): EstadoStock { return 'DISPONIVEL'; } }
export class StockBaixo implements StatusStock { nome(): EstadoStock { return 'STOCK_BAIXO'; } }
export class Esgotado implements StatusStock { nome(): EstadoStock { return 'ESGOTADO'; } }
export class EmReposicao implements StatusStock { nome(): EstadoStock { return 'EM_REPOSICAO'; } }

export namespace StatusStock {
  // Regra 6.2: estado inicial calculado pela quantidade e pelo mínimo (RN03).
  export function inicial(qtd: number, min: number): StatusStock {
    if (qtd === 0) return new Esgotado();
    if (qtd <= min) return new StockBaixo();
    return new Disponivel();
  }
}
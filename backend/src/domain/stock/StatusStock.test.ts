import { describe, it, expect } from 'vitest';
import {
  StatusStock,
  Disponivel,
  StockBaixo,
  Esgotado,
  EmReposicao,
} from './StatusStock.js';
import { TransicaoInvalidaError } from './TransicaoInvalidaError.js';

// Teste orientado por tabela que cobre TODAS as linhas da secção 6.4 do enunciado.
// Cada linha da tabela é: [estado inicial, operação, qtd pós-op, min, classe esperada ou erro].
// A função `executar` abstrai a operação a testar.

type Linha = {
  estado: StatusStock;
  op: 'entrada' | 'saida' | 'iniciar' | 'cancelar' | 'minimo';
  qtd: number;
  min: number;
  esperado?: new () => StatusStock;
  erro?: boolean;
  descricao: string;
};

function executar(s: StatusStock, op: Linha['op'], qtd: number, min: number): StatusStock {
  switch (op) {
    case 'entrada': return s.aposEntrada(qtd, min);
    case 'saida': return s.aposSaida(qtd, min);
    case 'iniciar': return s.iniciarReposicao(qtd, min);
    case 'cancelar': return s.cancelarReposicao(qtd, min);
    case 'minimo': return s.aposAlterarMinimo(qtd, min);
  }
}

const linhas: Linha[] = [
  // === DISPONIVEL ===
  { estado: new Disponivel(), op: 'entrada', qtd: 15, min: 5, esperado: Disponivel, descricao: 'DISPONIVEL + entrada → DISPONIVEL (fica)' },
  { estado: new Disponivel(), op: 'saida', qtd: 10, min: 5, esperado: Disponivel, descricao: 'DISPONIVEL + saída com qtd > min → DISPONIVEL (fica)' },
  { estado: new Disponivel(), op: 'saida', qtd: 5, min: 5, esperado: StockBaixo, descricao: 'DISPONIVEL + saída com qtd = min → STOCK_BAIXO' },
  { estado: new Disponivel(), op: 'saida', qtd: 3, min: 5, esperado: StockBaixo, descricao: 'DISPONIVEL + saída com 0 < qtd < min → STOCK_BAIXO' },
  { estado: new Disponivel(), op: 'saida', qtd: 0, min: 5, esperado: Esgotado, descricao: 'DISPONIVEL + saída com qtd = 0 → ESGOTADO' },
  { estado: new Disponivel(), op: 'iniciar', qtd: 10, min: 5, erro: true, descricao: 'DISPONIVEL + iniciarReposicao → erro' },
  { estado: new Disponivel(), op: 'cancelar', qtd: 10, min: 5, erro: true, descricao: 'DISPONIVEL + cancelarReposicao → erro' },
  { estado: new Disponivel(), op: 'minimo', qtd: 10, min: 10, esperado: StockBaixo, descricao: 'DISPONIVEL + alterar mínimo para ≥ qtd → STOCK_BAIXO' },
  { estado: new Disponivel(), op: 'minimo', qtd: 10, min: 5, esperado: Disponivel, descricao: 'DISPONIVEL + alterar mínimo mantendo qtd > min → DISPONIVEL' },

  // === STOCK_BAIXO ===
  { estado: new StockBaixo(), op: 'entrada', qtd: 10, min: 5, esperado: Disponivel, descricao: 'STOCK_BAIXO + entrada com qtd > min → DISPONIVEL' },
  { estado: new StockBaixo(), op: 'entrada', qtd: 5, min: 5, esperado: StockBaixo, descricao: 'STOCK_BAIXO + entrada com qtd = min → STOCK_BAIXO (fica)' },
  { estado: new StockBaixo(), op: 'entrada', qtd: 3, min: 5, esperado: StockBaixo, descricao: 'STOCK_BAIXO + entrada com qtd < min → STOCK_BAIXO (fica)' },
  { estado: new StockBaixo(), op: 'saida', qtd: 3, min: 5, esperado: StockBaixo, descricao: 'STOCK_BAIXO + saída com qtd > 0 → STOCK_BAIXO (fica)' },
  { estado: new StockBaixo(), op: 'saida', qtd: 0, min: 5, esperado: Esgotado, descricao: 'STOCK_BAIXO + saída com qtd = 0 → ESGOTADO' },
  { estado: new StockBaixo(), op: 'iniciar', qtd: 3, min: 5, esperado: EmReposicao, descricao: 'STOCK_BAIXO + iniciarReposicao → EM_REPOSICAO' },
  { estado: new StockBaixo(), op: 'cancelar', qtd: 3, min: 5, erro: true, descricao: 'STOCK_BAIXO + cancelarReposicao → erro' },
  { estado: new StockBaixo(), op: 'minimo', qtd: 3, min: 2, esperado: Disponivel, descricao: 'STOCK_BAIXO + alterar mínimo para < qtd → DISPONIVEL' },
  { estado: new StockBaixo(), op: 'minimo', qtd: 3, min: 5, esperado: StockBaixo, descricao: 'STOCK_BAIXO + alterar mínimo mantendo → STOCK_BAIXO' },

  // === ESGOTADO ===
  { estado: new Esgotado(), op: 'entrada', qtd: 10, min: 5, esperado: Disponivel, descricao: 'ESGOTADO + entrada com qtd > min → DISPONIVEL' },
  { estado: new Esgotado(), op: 'entrada', qtd: 5, min: 5, esperado: StockBaixo, descricao: 'ESGOTADO + entrada com qtd = min → STOCK_BAIXO' },
  { estado: new Esgotado(), op: 'entrada', qtd: 3, min: 5, esperado: StockBaixo, descricao: 'ESGOTADO + entrada com 0 < qtd < min → STOCK_BAIXO' },
  { estado: new Esgotado(), op: 'saida', qtd: 0, min: 5, esperado: Esgotado, descricao: 'ESGOTADO + saída (defensivo) → ESGOTADO (fica)' },
  { estado: new Esgotado(), op: 'iniciar', qtd: 0, min: 5, esperado: EmReposicao, descricao: 'ESGOTADO + iniciarReposicao → EM_REPOSICAO' },
  { estado: new Esgotado(), op: 'cancelar', qtd: 0, min: 5, erro: true, descricao: 'ESGOTADO + cancelarReposicao → erro' },
  { estado: new Esgotado(), op: 'minimo', qtd: 0, min: 5, esperado: Esgotado, descricao: 'ESGOTADO + alterar mínimo → ESGOTADO (qtd=0)' },

  // === EM_REPOSICAO ===
  { estado: new EmReposicao(), op: 'entrada', qtd: 10, min: 5, esperado: Disponivel, descricao: 'EM_REPOSICAO + entrada com qtd > min → DISPONIVEL' },
  { estado: new EmReposicao(), op: 'entrada', qtd: 5, min: 5, esperado: EmReposicao, descricao: 'EM_REPOSICAO + entrada parcial (qtd = min) → EM_REPOSICAO (fica)' },
  { estado: new EmReposicao(), op: 'entrada', qtd: 3, min: 5, esperado: EmReposicao, descricao: 'EM_REPOSICAO + entrada parcial (qtd < min) → EM_REPOSICAO (fica)' },
  { estado: new EmReposicao(), op: 'saida', qtd: 3, min: 5, esperado: EmReposicao, descricao: 'EM_REPOSICAO + saída com qtd > 0 → EM_REPOSICAO (fica)' },
  { estado: new EmReposicao(), op: 'saida', qtd: 0, min: 5, esperado: EmReposicao, descricao: 'EM_REPOSICAO + saída com qtd = 0 → EM_REPOSICAO (fica)' },
  { estado: new EmReposicao(), op: 'iniciar', qtd: 3, min: 5, erro: true, descricao: 'EM_REPOSICAO + iniciarReposicao → erro' },
  { estado: new EmReposicao(), op: 'cancelar', qtd: 0, min: 5, esperado: Esgotado, descricao: 'EM_REPOSICAO + cancelarReposicao com qtd=0 → ESGOTADO' },
  { estado: new EmReposicao(), op: 'cancelar', qtd: 3, min: 5, esperado: StockBaixo, descricao: 'EM_REPOSICAO + cancelarReposicao com qtd=min → STOCK_BAIXO' },
  { estado: new EmReposicao(), op: 'cancelar', qtd: 10, min: 5, esperado: Disponivel, descricao: 'EM_REPOSICAO + cancelarReposicao com qtd>min → DISPONIVEL' },
  { estado: new EmReposicao(), op: 'minimo', qtd: 10, min: 5, esperado: EmReposicao, descricao: 'EM_REPOSICAO + alterar mínimo → EM_REPOSICAO (fica)' },
];

describe('StatusStock (padrão State, tabela 6.4 completa)', () => {
  for (const linha of linhas) {
    it(linha.descricao, () => {
      if (linha.erro) {
        expect(() => executar(linha.estado, linha.op, linha.qtd, linha.min))
          .toThrow(TransicaoInvalidaError);
      } else {
        const resultado = executar(linha.estado, linha.op, linha.qtd, linha.min);
        expect(resultado).toBeInstanceOf(linha.esperado!);
      }
    });
  }

  it('inicial() calcula o estado pela quantidade (regra 6.2)', () => {
    expect(StatusStock.inicial(0, 5)).toBeInstanceOf(Esgotado);
    expect(StatusStock.inicial(3, 5)).toBeInstanceOf(StockBaixo);
    expect(StatusStock.inicial(5, 5)).toBeInstanceOf(StockBaixo);
    expect(StatusStock.inicial(10, 5)).toBeInstanceOf(Disponivel);
  });

  it('deEstado() reconstrói a instância a partir do ENUM da BD', () => {
    expect(StatusStock.deEstado('DISPONIVEL')).toBeInstanceOf(Disponivel);
    expect(StatusStock.deEstado('STOCK_BAIXO')).toBeInstanceOf(StockBaixo);
    expect(StatusStock.deEstado('ESGOTADO')).toBeInstanceOf(Esgotado);
    expect(StatusStock.deEstado('EM_REPOSICAO')).toBeInstanceOf(EmReposicao);
  });
});
import type { StockRepository } from './StockRepository.js';
import type { HistoricoRepository } from './HistoricoRepository.js';

// Contexto de transacção: repositórios que partilham a MESMA ligação/client.
export interface ContextoTransacao {
  stock: StockRepository;
  historico: HistoricoRepository;
}

// PADRÃO UNIT OF WORK (secção 7): executar(trabalho) abre uma transacção,
// dá acesso aos repositórios dessa transacção e faz commit/rollback.
export interface UnitOfWork {
  executar<T>(trabalho: (tx: ContextoTransacao) => Promise<T>): Promise<T>;
}
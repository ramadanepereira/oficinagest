import type { StockRepository } from './StockRepository.js';
import type { HistoricoRepository } from './HistoricoRepository.js';

// Interface estreita: só o que a Facade precisa do agregado Material
// dentro de uma transacção (remoção lógica, secção 6.5).
export interface MaterialRepositoryTransacional {
  desativar(id: number): Promise<boolean>;
  reativar(id: number): Promise<boolean>;
}

// Interface estreita: verificação de requisições pendentes (secção 6.5).
export interface RequisicaoRepositoryTransacional {
  existemPendentesPorMaterial(idMaterial: number): Promise<boolean>;
}

// Contexto de transacção: repositórios que partilham a MESMA ligação/client.
export interface ContextoTransacao {
  stock: StockRepository;
  historico: HistoricoRepository;
  materiais: MaterialRepositoryTransacional;
  requisicoes: RequisicaoRepositoryTransacional;
}

// PADRÃO UNIT OF WORK (secção 7): executar(trabalho) abre uma transacção,
// dá acesso aos repositórios dessa transacção e faz commit/rollback.
export interface UnitOfWork {
  executar<T>(trabalho: (tx: ContextoTransacao) => Promise<T>): Promise<T>;
}
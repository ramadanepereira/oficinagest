import type { StockMaterial } from '../../domain/stock/StockMaterial.js';

export interface StockRepository {
  // Lê a linha de stock COM BLOQUEIO (SELECT ... FOR UPDATE) para que duas
  // transacções concorrentes não leiam o mesmo valor (RNF04 / RN02 / RN08).
  obterParaAtualizacao(idMaterial: number): Promise<StockMaterial | null>;
  // Lê sem bloqueio (consultas).
  obter(idMaterial: number): Promise<StockMaterial | null>;
  // Persiste quantidade, mínimo, estado e datas.
  guardar(stock: StockMaterial): Promise<void>;
}
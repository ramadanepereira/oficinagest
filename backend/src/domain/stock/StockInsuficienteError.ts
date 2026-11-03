// Erro de domínio lançado quando se tenta retirar mais do que o stock disponível.
// Traduzido para HTTP 409 (STOCK_INSUFICIENTE) na camada de apresentação.
export class StockInsuficienteError extends Error {
  constructor(stockActual: number, tentativa: number) {
    super(`Stock insuficiente: tem ${stockActual}, tentou retirar ${tentativa}`);
    this.name = 'StockInsuficienteError';
  }
}
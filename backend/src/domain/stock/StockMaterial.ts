import { Quantidade } from './Quantidade.js';
import type { StatusStock } from './StatusStock.js';
import { StatusStock as StatusStockNs } from './StatusStock.js';
import type { EstadoStock } from './EstadoStock.js';

// AGREGADO do stock: guarda quantidade + mínimo + estado actual.
// Depois de cada operação, faz this.estado = this.estado.aposXxx(...) —
// a decisão da transição é SEMPRE da classe de estado (padrão State, secção 6.3).
export class StockMaterial {
  private constructor(
    private quantidade: Quantidade,
    private stockMinimo: number,
    private estado: StatusStock,
    private dataUltimaEntrada: Date | null,
    private dataUltimaSaida: Date | null,
  ) {}

  // Cria stock novo (material acabado de cadastrar): estado calculado por inicial().
  static criar(quantidade: Quantidade, stockMinimo: number): StockMaterial {
    return new StockMaterial(
      quantidade,
      stockMinimo,
      StatusStockNs.inicial(quantidade.valor, stockMinimo),
      null,
      null,
    );
  }

  // Reconstrói a partir de uma linha da BD (estado lido do ENUM persistido).
  static reconstruir(
    quantidade: Quantidade,
    stockMinimo: number,
    estado: EstadoStock,
    dataUltimaEntrada: Date | null,
    dataUltimaSaida: Date | null,
  ): StockMaterial {
    return new StockMaterial(
      quantidade,
      stockMinimo,
      StatusStockNs.deEstado(estado),
      dataUltimaEntrada,
      dataUltimaSaida,
    );
  }

  get quantidade(): Quantidade { return this.quantidade; }
  get stockMinimo(): number { return this.stockMinimo; }
  get estado(): StatusStock { return this.estado; }
  get dataUltimaEntrada(): Date | null { return this.dataUltimaEntrada; }
  get dataUltimaSaida(): Date | null { return this.dataUltimaSaida; }

  nomeEstado(): EstadoStock { return this.estado.nome(); }

  // Entrada: soma e reavalia o estado (State decide a transição).
  adicionarEntrada(qtd: Quantidade, agora: Date): void {
    this.quantidade = this.quantidade.adicionar(qtd);
    this.estado = this.estado.aposEntrada(this.quantidade.valor, this.stockMinimo);
    this.dataUltimaEntrada = agora;
  }

  // Saída: subtrai e reavalia. RN02 é validado ANTES (na Facade, via
  // ValidadorDeMovimentoStock); aqui Quantidade.subtrair garante RN08.
  retirarSaida(qtd: Quantidade, agora: Date): void {
    this.quantidade = this.quantidade.subtrair(qtd);
    this.estado = this.estado.aposSaida(this.quantidade.valor, this.stockMinimo);
    this.dataUltimaSaida = agora;
  }

  iniciarReposicao(): void {
    // Pode lançar TransicaoInvalidaError (State decide).
    this.estado = this.estado.iniciarReposicao(this.quantidade.valor, this.stockMinimo);
  }

  cancelarReposicao(): void {
    this.estado = this.estado.cancelarReposicao(this.quantidade.valor, this.stockMinimo);
  }

  // Alterar o mínimo recalcula o estado, excepto em EM_REPOSICAO (State decide).
  alterarMinimo(novoMinimo: number): void {
    if (!Number.isInteger(novoMinimo) || novoMinimo < 0) {
      throw new Error(`Stock mínimo inválido: ${novoMinimo}`);
    }
    this.stockMinimo = novoMinimo;
    this.estado = this.estado.aposAlterarMinimo(this.quantidade.valor, this.stockMinimo);
  }

  resumo() {
    return {
      quantidade: this.quantidade.valor,
      stockMinimo: this.stockMinimo,
      estado: this.nomeEstado(),
    };
  }
}
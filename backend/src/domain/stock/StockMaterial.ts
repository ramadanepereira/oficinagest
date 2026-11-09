import { Quantidade } from './Quantidade.js';
import type { StatusStock } from './StatusStock.js';
import { StatusStock as StatusStockNs } from './StatusStock.js';
import type { EstadoStock } from './EstadoStock.js';

// AGREGADO do stock: guarda quantidade + mínimo + estado actual.
// Campos internos com prefixo _ ; acesso público só pelos getters.
// Depois de cada operação, this._estado = this._estado.aposXxx(...) —
// a decisão da transição é SEMPRE da classe de estado (padrão State, secção 6.3).
export class StockMaterial {
  private _quantidade: Quantidade;
  private _stockMinimo: number;
  private _estado: StatusStock;
  private _dataUltimaEntrada: Date | null;
  private _dataUltimaSaida: Date | null;

  private constructor(
    qtd: Quantidade,
    min: number,
    estado: StatusStock,
    dataUltimaEntrada: Date | null,
    dataUltimaSaida: Date | null,
  ) {
    this._quantidade = qtd;
    this._stockMinimo = min;
    this._estado = estado;
    this._dataUltimaEntrada = dataUltimaEntrada;
    this._dataUltimaSaida = dataUltimaSaida;
  }

  static criar(quantidade: Quantidade, stockMinimo: number): StockMaterial {
    return new StockMaterial(
      quantidade,
      stockMinimo,
      StatusStockNs.inicial(quantidade.valor, stockMinimo),
      null,
      null,
    );
  }

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

  get quantidade(): Quantidade { return this._quantidade; }
  get stockMinimo(): number { return this._stockMinimo; }
  get estado(): StatusStock { return this._estado; }
  get dataUltimaEntrada(): Date | null { return this._dataUltimaEntrada; }
  get dataUltimaSaida(): Date | null { return this._dataUltimaSaida; }

  nomeEstado(): EstadoStock { return this._estado.nome(); }

  adicionarEntrada(qtd: Quantidade, agora: Date): void {
    this._quantidade = this._quantidade.adicionar(qtd);
    this._estado = this._estado.aposEntrada(this._quantidade.valor, this._stockMinimo);
    this._dataUltimaEntrada = agora;
  }

  retirarSaida(qtd: Quantidade, agora: Date): void {
    this._quantidade = this._quantidade.subtrair(qtd);
    this._estado = this._estado.aposSaida(this._quantidade.valor, this._stockMinimo);
    this._dataUltimaSaida = agora;
  }

  iniciarReposicao(): void {
    this._estado = this._estado.iniciarReposicao(this._quantidade.valor, this._stockMinimo);
  }

  cancelarReposicao(): void {
    this._estado = this._estado.cancelarReposicao(this._quantidade.valor, this._stockMinimo);
  }

  alterarMinimo(novoMinimo: number): void {
    if (!Number.isInteger(novoMinimo) || novoMinimo < 0) {
      throw new Error(`Stock mínimo inválido: ${novoMinimo}`);
    }
    this._stockMinimo = novoMinimo;
    this._estado = this._estado.aposAlterarMinimo(this._quantidade.valor, this._stockMinimo);
  }

  resumo() {
    return {
      quantidade: this._quantidade.valor,
      stockMinimo: this._stockMinimo,
      estado: this.nomeEstado(),
    };
  }
}
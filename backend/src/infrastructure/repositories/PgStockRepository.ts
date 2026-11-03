import type { PoolClient } from 'pg';
import { StockMaterial } from '../../domain/stock/StockMaterial.js';
import { Quantidade } from '../../domain/stock/Quantidade.js';
import type { EstadoStock } from '../../domain/stock/EstadoStock.js';
import type { StockRepository } from '../../application/ports/StockRepository.js';

// Implementação PostgreSQL. Recebe o CLIENT da transacção (não o pool),
// para que todas as queries corram na mesma transacção.
export class PgStockRepository implements StockRepository {
  constructor(private client: PoolClient) {}

  private paraDominio(row: any): StockMaterial {
    return StockMaterial.reconstruir(
      Quantidade.deStock(Number(row.quantidade)),
      Number(row.stock_minimo),
      row.estado as EstadoStock,
      row.data_ultima_entrada ? new Date(row.data_ultima_entrada) : null,
      row.data_ultima_saida ? new Date(row.data_ultima_saida) : null,
    );
  }

  async obterParaAtualizacao(idMaterial: number): Promise<StockMaterial | null> {
    // FOR UPDATE bloqueia a linha até ao fim da transacção. Sem isto, duas
    // saídas simultâneas poderiam deixar o stock negativo (RN02/RN08).
    const { rows } = await this.client.query(
      'SELECT * FROM stock_material WHERE id_material = $1 FOR UPDATE',
      [idMaterial],
    );
    return rows[0] ? this.paraDominio(rows[0]) : null;
  }

  async obter(idMaterial: number): Promise<StockMaterial | null> {
    const { rows } = await this.client.query(
      'SELECT * FROM stock_material WHERE id_material = $1',
      [idMaterial],
    );
    return rows[0] ? this.paraDominio(rows[0]) : null;
  }

  async guardar(stock: StockMaterial): Promise<void> {
    // O id_material não está exposto no StockMaterial; é passado pelo chamador
    // via closure. Aqui assumimos que o stock foi obtido por id e guardamos
    // pelo mesmo id. Para simplicidade, o PgUnitOfWork liga o id ao stock.
    throw new Error('Usar guardarComId no contexto de transacção');
  }

  async guardarComId(idMaterial: number, stock: StockMaterial): Promise<void> {
    await this.client.query(
      `UPDATE stock_material
       SET quantidade = $1, stock_minimo = $2, estado = $3,
           data_ultima_entrada = $4, data_ultima_saida = $5
       WHERE id_material = $6`,
      [
        stock.quantidade.valor,
        stock.stockMinimo,
        stock.nomeEstado(),
        stock.dataUltimaEntrada,
        stock.dataUltimaSaida,
        idMaterial,
      ],
    );
  }
}
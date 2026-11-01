import type { TipoMaterial } from './TipoMaterial.js';
import type { EstadoStock } from '../stock/EstadoStock.js';

export interface StockInfo { quantidade: number; stockMinimo: number; estado: EstadoStock; }

export interface MaterialProps {
  id: number;
  codigo: string;
  nome: string;
  tipo: TipoMaterial;
  idCategoria: number;
  unidade: string;
  activo: boolean;
  criadoEm: Date;
  stock?: StockInfo;
}

// Classe base do agregado Material. Os subtipos (Peca, Ferramenta, Equipamento)
// herdam daqui; NUNCA instanciar Material directamente (usar MaterialFactory).
export abstract class Material {
  constructor(protected props: MaterialProps) {}

  get id(): number { return this.props.id; }
  get codigo(): string { return this.props.codigo; }
  get nome(): string { return this.props.nome; }
  get tipo(): TipoMaterial { return this.props.tipo; }
  get idCategoria(): number { return this.props.idCategoria; }
  get unidade(): string { return this.props.unidade; }
  get activo(): boolean { return this.props.activo; }
  get criadoEm(): Date { return this.props.criadoEm; }
  get stock(): StockInfo | undefined { return this.props.stock; }

  abstract rotuloTipo(): string;

  resumoPublico() {
    return {
      id: this.id, codigo: this.codigo, nome: this.nome, tipo: this.tipo,
      idCategoria: this.idCategoria, unidade: this.unidade, activo: this.activo,
      stock: this.stock ?? null,
    };
  }
}
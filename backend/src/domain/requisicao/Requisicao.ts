import type { EstadoRequisicao } from './EstadoRequisicao.js';
import { TransicaoRequisicaoInvalidaError } from './TransicaoRequisicaoInvalidaError.js';

export interface RequisicaoProps {
  id: number;
  idMaterial: number;
  idMecanico: number;
  idAtendente: number | null;
  quantidade: number;
  estado: EstadoRequisicao;
  criadoEm: Date;
}

// Entidade Requisicao: pedido de material feito por um Mecânico.
// As transições de estado são validadas aqui (máquina de estados simples).
export class Requisicao {
  constructor(private props: RequisicaoProps) {}

  get id(): number { return this.props.id; }
  get idMaterial(): number { return this.props.idMaterial; }
  get idMecanico(): number { return this.props.idMecanico; }
  get idAtendente(): number | null { return this.props.idAtendente; }
  get quantidade(): number { return this.props.quantidade; }
  get estado(): EstadoRequisicao { return this.props.estado; }
  get criadoEm(): Date { return this.props.criadoEm; }

  // PENDENTE -> APROVADA; regista quem aprovou.
  aprovar(idAtendente: number): void {
    if (this.props.estado !== 'PENDENTE') {
      throw new TransicaoRequisicaoInvalidaError(this.props.estado, 'aprovar');
    }
    this.props.estado = 'APROVADA';
    this.props.idAtendente = idAtendente;
  }

  // PENDENTE -> REPROVADA; regista quem reprovou.
  reprovar(idAtendente: number): void {
    if (this.props.estado !== 'PENDENTE') {
      throw new TransicaoRequisicaoInvalidaError(this.props.estado, 'reprovar');
    }
    this.props.estado = 'REPROVADA';
    this.props.idAtendente = idAtendente;
  }

  // APROVADA -> DEVOLVIDA (o material foi devolvido ao stock).
  devolver(): void {
    if (this.props.estado !== 'APROVADA') {
      throw new TransicaoRequisicaoInvalidaError(this.props.estado, 'devolver');
    }
    this.props.estado = 'DEVOLVIDA';
  }

  resumoPublico() {
    return {
      id: this.id,
      idMaterial: this.idMaterial,
      idMecanico: this.idMecanico,
      idAtendente: this.idAtendente,
      quantidade: this.quantidade,
      estado: this.estado,
      criadoEm: this.criadoEm,
    };
  }
}
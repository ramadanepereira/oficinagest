export interface CategoriaMaterialProps { id: number; descricao: string; activo: boolean; }
export class CategoriaMaterial {
  constructor(private props: CategoriaMaterialProps) {}
  get id(): number { return this.props.id; }
  get descricao(): string { return this.props.descricao; }
  get activo(): boolean { return this.props.activo; }
  resumoPublico() { return { id: this.id, descricao: this.descricao, activo: this.activo }; }
}
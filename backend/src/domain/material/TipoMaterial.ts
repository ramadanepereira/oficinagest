export type TipoMaterial = 'PECA' | 'FERRAMENTA' | 'EQUIPAMENTO';
export const TIPOS_VALIDOS: TipoMaterial[] = ['PECA', 'FERRAMENTA', 'EQUIPAMENTO'];
export const ROTULOS_TIPO: Record<TipoMaterial, string> = {
  PECA: 'Peça',
  FERRAMENTA: 'Ferramenta',
  EQUIPAMENTO: 'Equipamento',
};
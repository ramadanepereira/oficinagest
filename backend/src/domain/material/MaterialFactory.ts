import type { MaterialProps } from './Material.js';
import type { TipoMaterial } from './TipoMaterial.js';
import { Peca } from './Peca.js';
import { Ferramenta } from './Ferramenta.js';
import { Equipamento } from './Equipamento.js';

// Tipo das props que os chamadores passam à fábrica: tudo menos o tipo,
// porque o tipo é decidido aqui e injectado nas props do agregado.
export type PropsMaterialSemTipo = Omit<MaterialProps, 'tipo'>;

// PADRÃO FACTORY METHOD: único ponto do código que decide qual subtipo criar.
// Adicionar um novo tipo = nova classe + novo caso aqui + enum + migração (OCP).
export class MaterialFactory {
  static criar(tipo: TipoMaterial, props: PropsMaterialSemTipo) {
    // Injecta o tipo nas props antes de construir o subtipo.
    const propsCompletas: MaterialProps = { ...props, tipo };
    switch (tipo) {
      case 'PECA': return new Peca(propsCompletas);
      case 'FERRAMENTA': return new Ferramenta(propsCompletas);
      case 'EQUIPAMENTO': return new Equipamento(propsCompletas);
      default:
        throw new TipoMaterialInvalidoError(String(tipo));
    }
  }
}

export class TipoMaterialInvalidoError extends Error {
  constructor(tipo: string) {
    super(`Tipo de material inválido: ${tipo}`);
    this.name = 'TipoMaterialInvalidoError';
  }
}
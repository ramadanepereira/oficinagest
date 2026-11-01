import type { MaterialProps } from './Material.js';
import type { TipoMaterial } from './TipoMaterial.js';
import { Peca } from './Peca.js';
import { Ferramenta } from './Ferramenta.js';
import { Equipamento } from './Equipamento.js';

// PADRÃO FACTORY METHOD: único ponto do código que decide qual subtipo criar.
// Adicionar um novo tipo = nova classe + novo caso aqui + enum + migração (OCP).
export class MaterialFactory {
  static criar(tipo: TipoMaterial, props: MaterialProps) {
    switch (tipo) {
      case 'PECA': return new Peca(props);
      case 'FERRAMENTA': return new Ferramenta(props);
      case 'EQUIPAMENTO': return new Equipamento(props);
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
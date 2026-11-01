import { Material } from './Material.js';
import { ROTULOS_TIPO } from './TipoMaterial.js';
export class Peca extends Material {
  rotuloTipo(): string { return ROTULOS_TIPO.PECA; }
}
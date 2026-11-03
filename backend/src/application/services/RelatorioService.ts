import type { RelatorioRepository, FiltroRelatorio } from '../ports/RelatorioRepository.js';

export class RelatorioService {
  constructor(private repositorio: RelatorioRepository) {}

  async movimentos(filtro: FiltroRelatorio) {
    return this.repositorio.gerarMovimentos(filtro);
  }
}
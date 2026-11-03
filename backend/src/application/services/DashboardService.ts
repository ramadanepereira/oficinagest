import type { DashboardRepository } from '../ports/DashboardRepository.js';

// Orquestração do dashboard: junta os 5 blocos de dados num único objeto.
// Não há regras de negócio complexas aqui — só composição.
export class DashboardService {
  constructor(private repositorio: DashboardRepository) {}

  async resumo() {
    const [totais, porTipo, movimentosUltimos7Dias, ultimasMovimentacoes, alertas] =
      await Promise.all([
        this.repositorio.totais(),
        this.repositorio.contagemPorTipo(),
        this.repositorio.movimentosUltimos7Dias(),
        this.repositorio.ultimasMovimentacoes(5),
        this.repositorio.alertas(),
      ]);
    return {
      totais,
      porTipo,
      movimentosUltimos7Dias,
      ultimasMovimentacoes,
      alertas,
    };
  }
}
// Erro de domínio lançado quando uma transição de estado de requisição é inválida.
// Traduzido para HTTP 409 TRANSICAO_INVALIDA na apresentação.
export class TransicaoRequisicaoInvalidaError extends Error {
  constructor(estadoActual: string, operacao: string) {
    super(`Transição inválida: não é possível '${operacao}' uma requisição em estado '${estadoActual}'`);
    this.name = 'TransicaoRequisicaoInvalidaError';
  }
}
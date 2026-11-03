// Erro de domínio lançado quando uma transição de estado é inválida
// (secção 6.4). Traduzido para HTTP 409 TRANSICAO_INVALIDA na apresentação.
// Exemplos:
//   - iniciarReposicao a partir de DISPONIVEL ou EM_REPOSICAO
//   - cancelarReposicao a partir de qualquer estado que não EM_REPOSICAO
export class TransicaoInvalidaError extends Error {
  constructor(estadoActual: string, operacao: string) {
    super(`Transição inválida: não é possível '${operacao}' a partir do estado '${estadoActual}'`);
    this.name = 'TransicaoInvalidaError';
  }
}
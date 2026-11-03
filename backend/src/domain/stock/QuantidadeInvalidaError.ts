// Erro lançado quando uma quantidade viola RN08 ou RN11.
export class QuantidadeInvalidaError extends Error {
  constructor(mensagem: string) {
    super(mensagem);
    this.name = 'QuantidadeInvalidaError';
  }
}
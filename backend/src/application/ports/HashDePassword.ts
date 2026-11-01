// Interface única: isola o bcrypt da camada de aplicação.
// Se mudarmos para bcryptjs, apenas a implementação muda.
export interface HashDePassword {
  hash(password: string): Promise<string>;
  verificar(password: string, hash: string): Promise<boolean>;
}
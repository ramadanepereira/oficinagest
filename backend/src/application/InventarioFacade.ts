import { Quantidade } from '../domain/stock/Quantidade.js';
import { ValidadorDeMovimentoStock } from '../domain/stock/ValidadorDeMovimentoStock.js';
import { StockInsuficienteError } from '../domain/stock/StockInsuficienteError.js';
import type { UnitOfWork } from './ports/UnitOfWork.js';
import { MaterialNaoEncontradoError } from './services/MaterialService.js';

// PADRÃO FACADE (secção 4): esconde dos controladores a coordenação de
// validar -> actualizar stock -> registar histórico -> reavaliar estado.
// Os controladores só conhecem esta classe.
export class InventarioFacade {
  constructor(private uow: UnitOfWork) {}

  // ENTRADA: soma quantidade e reavalia o estado.
  async registarEntrada(cmd: RegistarEntradaCmd) {
    return this.uow.executar(async (tx) => {
      const stock = await tx.stock.obterParaAtualizacao(cmd.idMaterial);
      if (!stock) throw new MaterialNaoEncontradoError();
      // RN11: quantidade inteira > 0.
      const qtd = ValidadorDeMovimentoStock.validarEntrada(cmd.quantidade);
      stock.adicionarEntrada(qtd, new Date());
      await tx.stock.guardar(cmd.idMaterial, stock);
      // RN05: regista o movimento (data + utilizador) na mesma transacção.
      await tx.historico.registarMovimento({
        idMaterial: cmd.idMaterial,
        tipo: 'ENTRADA',
        quantidade: qtd.valor,
        idUsuario: cmd.idUsuario,
        observacao: cmd.observacao,
      });
      return stock.resumo();
    });
  }

  // SAIDA: valida RN02/RN11, subtrai e reavalia o estado.
  async registarSaida(cmd: RegistarSaidaCmd) {
    return this.uow.executar(async (tx) => {
      // FOR UPDATE bloqueia a linha até ao fim da transacção. Sem isto, duas
      // saídas simultâneas poderiam deixar o stock negativo (RN02/RN08).
      const stock = await tx.stock.obterParaAtualizacao(cmd.idMaterial);
      if (!stock) throw new MaterialNaoEncontradoError();
      // RN02 (sem stock não sai) + RN11 (inteiro > 0).
      ValidadorDeMovimentoStock.validarSaida(stock.quantidade.valor, cmd.quantidade);
      stock.retirarSaida(Quantidade.deMovimento(cmd.quantidade), new Date());
      await tx.stock.guardar(cmd.idMaterial, stock);
      await tx.historico.registarMovimento({
        idMaterial: cmd.idMaterial,
        tipo: 'SAIDA',
        quantidade: cmd.quantidade,
        idUsuario: cmd.idUsuario,
        observacao: cmd.observacao,
      });
      return stock.resumo();
    });
  }

  // AJUSTE (ADMIN): positivo = entrada, negativo = saída; observação obrigatória.
  async registarAjuste(cmd: RegistarAjusteCmd) {
    return this.uow.executar(async (tx) => {
      const stock = await tx.stock.obterParaAtualizacao(cmd.idMaterial);
      if (!stock) throw new MaterialNaoEncontradoError();
      // Observação obrigatória + RN02/RN11 consoante o sinal.
      ValidadorDeMovimentoStock.validarAjuste(
        stock.quantidade.valor,
        cmd.quantidade,
        cmd.observacao,
      );
      if (cmd.quantidade > 0) {
        stock.adicionarEntrada(Quantidade.deMovimento(cmd.quantidade), new Date());
        await tx.stock.guardar(cmd.idMaterial, stock);
        await tx.historico.registarMovimento({
          idMaterial: cmd.idMaterial,
          tipo: 'AJUSTE_ENTRADA',
          quantidade: cmd.quantidade,
          idUsuario: cmd.idUsuario,
          observacao: cmd.observacao,
        });
      } else {
        const abs = Math.abs(cmd.quantidade);
        stock.retirarSaida(Quantidade.deMovimento(abs), new Date());
        await tx.stock.guardar(cmd.idMaterial, stock);
        await tx.historico.registarMovimento({
          idMaterial: cmd.idMaterial,
          tipo: 'AJUSTE_SAIDA',
          quantidade: abs,
          idUsuario: cmd.idUsuario,
          observacao: cmd.observacao,
        });
      }
      return stock.resumo();
    });
  }

  // CONSULTA de stock (sem bloqueio).
  async consultarStock(idMaterial: number) {
    return this.uow.executar(async (tx) => {
      const stock = await tx.stock.obter(idMaterial);
      if (!stock) throw new MaterialNaoEncontradoError();
      return stock.resumo();
    });
  }

  // INICIAR REPOSICAO (ADMIN): State decide se a transição é válida.
  async iniciarReposicao(cmd: CmdReposicao) {
    return this.uow.executar(async (tx) => {
      const stock = await tx.stock.obterParaAtualizacao(cmd.idMaterial);
      if (!stock) throw new MaterialNaoEncontradoError();
      const antes = stock.nomeEstado();
      // Pode lançar TransicaoInvalidaError (State decide).
      stock.iniciarReposicao();
      await tx.stock.guardar(cmd.idMaterial, stock);
      // RN07: mudança de estado manual fica registada como alteração.
      await tx.historico.registarAlteracao({
        idMaterial: cmd.idMaterial,
        idUsuario: cmd.idUsuario,
        campo: 'estado',
        valorAntigo: antes,
        valorNovo: stock.nomeEstado(),
      });
      return stock.resumo();
    });
  }

  // CANCELAR REPOSICAO (ADMIN): recalcula o estado pela quantidade.
  async cancelarReposicao(cmd: CmdReposicao) {
    return this.uow.executar(async (tx) => {
      const stock = await tx.stock.obterParaAtualizacao(cmd.idMaterial);
      if (!stock) throw new MaterialNaoEncontradoError();
      const antes = stock.nomeEstado();
      stock.cancelarReposicao();
      await tx.stock.guardar(cmd.idMaterial, stock);
      await tx.historico.registarAlteracao({
        idMaterial: cmd.idMaterial,
        idUsuario: cmd.idUsuario,
        campo: 'estado',
        valorAntigo: antes,
        valorNovo: stock.nomeEstado(),
      });
      return stock.resumo();
    });
  }

  // ALTERAR STOCK MINIMO: recalcula o estado (excepto EM_REPOSICAO).
  async alterarStockMinimo(cmd: CmdReposicao & { novoMinimo: number }) {
    return this.uow.executar(async (tx) => {
      const stock = await tx.stock.obterParaAtualizacao(cmd.idMaterial);
      if (!stock) throw new MaterialNaoEncontradoError();
      const antes = stock.stockMinimo;
      stock.alterarMinimo(cmd.novoMinimo);
      await tx.stock.guardar(cmd.idMaterial, stock);
      await tx.historico.registarAlteracao({
        idMaterial: cmd.idMaterial,
        idUsuario: cmd.idUsuario,
        campo: 'stock_minimo',
        valorAntigo: String(antes),
        valorNovo: String(cmd.novoMinimo),
      });
      return stock.resumo();
    });
  }

  // REMOCAO LOGICA (secção 6.5 / RN04): só com stock = 0 e sem requisições
  // PENDENTES; caso contrário 409. O código continua único (RN01/RN06).
  async desactivarMaterial(cmd: CmdReposicao) {
    return this.uow.executar(async (tx) => {
      const stock = await tx.stock.obterParaAtualizacao(cmd.idMaterial);
      if (!stock) throw new MaterialNaoEncontradoError();
      if (stock.quantidade.valor > 0) throw new MaterialComStockError();
      if (await tx.requisicoes.existemPendentesPorMaterial(cmd.idMaterial)) {
        throw new MaterialComRequisicoesError();
      }
      const ok = await tx.materiais.desativar(cmd.idMaterial);
      // RN07: a desactivação fica registada no histórico de alterações.
      await tx.historico.registarAlteracao({
        idMaterial: cmd.idMaterial,
        idUsuario: cmd.idUsuario,
        campo: 'activo',
        valorAntigo: 'true',
        valorNovo: 'false',
      });
      return ok;
    });
  }

  // REATIVAR material desactivado (ADMIN).
  async reativarMaterial(cmd: CmdReposicao) {
    return this.uow.executar(async (tx) => {
      const ok = await tx.materiais.reativar(cmd.idMaterial);
      if (!ok) throw new MaterialNaoEncontradoError();
      await tx.historico.registarAlteracao({
        idMaterial: cmd.idMaterial,
        idUsuario: cmd.idUsuario,
        campo: 'activo',
        valorAntigo: 'false',
        valorNovo: 'true',
      });
      return ok;
    });
  }
}

// Comandos (DTOs de aplicação): a Facade recebe objetos simples, não requests HTTP.
export interface RegistarEntradaCmd {
  idMaterial: number;
  quantidade: number;
  idUsuario: number;
  observacao?: string;
}
export interface RegistarSaidaCmd {
  idMaterial: number;
  quantidade: number;
  idUsuario: number;
  observacao?: string;
}
export interface RegistarAjusteCmd {
  idMaterial: number;
  quantidade: number; // com sinal: + entrada, - saída
  idUsuario: number;
  observacao: string; // obrigatória (secção 6.5)
}
export interface CmdReposicao {
  idMaterial: number;
  idUsuario: number;
}

// Erros de domínio específicos da remoção lógica (traduzidos para 409 na apresentação).
export class MaterialComStockError extends Error {
  constructor() {
    super('Material com stock; faça um ajuste de saída antes de remover');
    this.name = 'MaterialComStockError';
  }
}
export class MaterialComRequisicoesError extends Error {
  constructor() {
    super('Material com requisições pendentes; resolva-as antes de remover');
    this.name = 'MaterialComRequisicoesError';
  }
}
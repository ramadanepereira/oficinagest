export type Perfil = 'ADMINISTRADOR' | 'ATENDENTE' | 'MECANICO';
export type TipoMaterial = 'PECA' | 'FERRAMENTA' | 'EQUIPAMENTO';
export type EstadoStock = 'DISPONIVEL' | 'STOCK_BAIXO' | 'ESGOTADO' | 'EM_REPOSICAO';
export type TipoMovimento = 'ENTRADA' | 'SAIDA' | 'AJUSTE_ENTRADA' | 'AJUSTE_SAIDA';
export type EstadoRequisicao = 'PENDENTE' | 'APROVADA' | 'REPROVADA' | 'DEVOLVIDA';

export interface Utilizador {
  id: number;
  nome: string;
  username: string;
  email: string;
  telefone?: string | null;
  perfil: Perfil;
  activo: boolean;
}

export interface Categoria { id: number; descricao: string; activo: boolean; }

export interface Material {
  id: number;
  codigo: string;
  nome: string;
  tipo: TipoMaterial;
  idCategoria: number;
  unidade: string;
  activo: boolean;
  stock: { quantidade: number; stockMinimo: number; estado: EstadoStock } | null;
}

export interface Movimento {
  id: number;
  idMaterial: number;
  codigo: string;
  nome: string;
  categoria: string;
  tipo: TipoMovimento;
  quantidade: number;
  idUsuario: number;
  utilizador: string;
  observacao?: string;
  criadoEm: string;
}

export interface Pagina<T> { itens: T[]; total: number; }

export interface Alerta {
  tipo: 'STOCK_BAIXO' | 'ESGOTADO' | 'REQUISICOES_PENDENTES';
  titulo: string;
  detalhe: string;
  criadoEm: string;
}

export interface MovimentosPorDia { data: string; entradas: number; saidas: number; }
export interface ContagemPorTipo { tipo: TipoMaterial; total: number; }

export interface DashboardResumo {
  totais: { materiais: number; stockBaixo: number; esgotado: number; emReposicao: number };
  porTipo: ContagemPorTipo[];
  movimentosUltimos7Dias: MovimentosPorDia[];
  ultimasMovimentacoes: Movimento[];
  alertas: Alerta[];
}

export interface ErroApi { codigo: string; mensagem: string; }
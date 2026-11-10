import { Home, Package, ArrowLeftRight, ClipboardList, BarChart3, Users, Tags, Settings, type LucideIcon } from 'lucide-react';
import type { Perfil } from '../api/types.ts';

// Regras de permissão num ÚNICO ficheiro (secção 6). Usado pelo menu, rotas e botões.
export type Accao =
  | 'verDashboard' | 'verInventario' | 'gerirMateriais'
  | 'registarMovimentos' | 'verMovimentos'
  | 'verRequisicoes' | 'criarRequisicoes' | 'aprovarRequisicoes'
  | 'verRelatorios' | 'gerirUtilizadores' | 'gerirCategorias' | 'verConfiguracoes'
  | 'exportarDados';

const MATRIZ: Record<Perfil, readonly Accao[]> = {
  ADMINISTRADOR: [
    'verDashboard', 'verInventario', 'gerirMateriais',
    'registarMovimentos', 'verMovimentos',
    'verRequisicoes', 'criarRequisicoes', 'aprovarRequisicoes',
    'verRelatorios', 'gerirUtilizadores', 'gerirCategorias', 'verConfiguracoes',
    'exportarDados',
  ],
  ATENDENTE: [
    'verDashboard', 'verInventario',
    'registarMovimentos', 'verMovimentos',
    'verRequisicoes', 'aprovarRequisicoes',
    'verRelatorios', 'verConfiguracoes',
  ],
  MECANICO: [
    'verDashboard', 'verInventario',
    'verRequisicoes', 'criarRequisicoes', 'verConfiguracoes',
  ],
};

export function pode(perfil: Perfil, accao: Accao): boolean {
  return MATRIZ[perfil].includes(accao);
}

export interface ItemMenu {
  rotulo: string;
  path: string;
  icone: LucideIcon;
  accao: Accao;
  seccao: 'PRINCIPAL' | 'GESTAO' | 'SISTEMA';
}

export const ITENS_MENU: ItemMenu[] = [
  { rotulo: 'Dashboard',      path: '/dashboard',     icone: Home,            accao: 'verDashboard',     seccao: 'PRINCIPAL' },
  { rotulo: 'Inventário',     path: '/inventario',    icone: Package,         accao: 'verInventario',    seccao: 'PRINCIPAL' },
  { rotulo: 'Movimentações',  path: '/movimentos',    icone: ArrowLeftRight,  accao: 'verMovimentos',    seccao: 'PRINCIPAL' },
  { rotulo: 'Requisições',    path: '/requisicoes',   icone: ClipboardList,   accao: 'verRequisicoes',   seccao: 'PRINCIPAL' },
  { rotulo: 'Relatórios',     path: '/relatorios',    icone: BarChart3,       accao: 'verRelatorios',    seccao: 'PRINCIPAL' },
  { rotulo: 'Utilizadores',   path: '/utilizadores',  icone: Users,           accao: 'gerirUtilizadores',seccao: 'GESTAO' },
  { rotulo: 'Categorias',     path: '/categorias',    icone: Tags,            accao: 'gerirCategorias',  seccao: 'GESTAO' },
  { rotulo: 'Configurações',  path: '/configuracoes', icone: Settings,        accao: 'verConfiguracoes', seccao: 'SISTEMA' },
];
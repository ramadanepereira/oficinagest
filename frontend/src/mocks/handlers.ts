import { http, HttpResponse } from 'msw';
import type {
  Utilizador, DashboardResumo, Movimento, Categoria, Material, EstadoStock, Alerta,
} from '../api/types.ts';

// MSW STATEFUL: o estado muta com as acções, para que as notificações e os
// totais reflitam realmente o que acontece no sistema durante o desenvolvimento.
const admin: Utilizador = { id: 1, nome: 'Ramadane Pereira', username: 'admin', email: 'admin@oficinagest.local', perfil: 'ADMINISTRADOR', activo: true };
const atendente: Utilizador = { id: 2, nome: 'Atendente', username: 'atendente', email: 'atendente@oficinagest.local', perfil: 'ATENDENTE', activo: true };
const mecanico: Utilizador = { id: 3, nome: 'Mecânico', username: 'mecanico', email: 'mecanico@oficinagest.local', perfil: 'MECANICO', activo: true };
const usuarios = [admin, atendente, mecanico];

const categorias: Categoria[] = [
  { id: 1, descricao: 'Peças', activo: true },
  { id: 2, descricao: 'Ferramentas', activo: true },
  { id: 3, descricao: 'Consumíveis', activo: true },
  { id: 4, descricao: 'Equipamentos', activo: true },
];

const materiais: Material[] = [
  { id: 1, codigo: 'MAT-001', nome: 'Parafuso 6mm', tipo: 'PECA', idCategoria: 2, unidade: 'un', activo: true, stock: { quantidade: 250, stockMinimo: 50, estado: 'DISPONIVEL' } },
  { id: 2, codigo: 'MAT-002', nome: 'Óleo SW-30', tipo: 'PECA', idCategoria: 3, unidade: 'L', activo: true, stock: { quantidade: 12, stockMinimo: 20, estado: 'STOCK_BAIXO' } },
  { id: 3, codigo: 'MAT-003', nome: 'Filtro de Ar', tipo: 'PECA', idCategoria: 1, unidade: 'un', activo: true, stock: { quantidade: 45, stockMinimo: 10, estado: 'DISPONIVEL' } },
  { id: 4, codigo: 'MAT-004', nome: 'Pneu 205/55R16', tipo: 'PECA', idCategoria: 1, unidade: 'un', activo: true, stock: { quantidade: 8, stockMinimo: 8, estado: 'STOCK_BAIXO' } },
  { id: 5, codigo: 'MAT-005', nome: 'Bateria 12V', tipo: 'EQUIPAMENTO', idCategoria: 4, unidade: 'un', activo: true, stock: { quantidade: 0, stockMinimo: 5, estado: 'ESGOTADO' } },
];

let movimentos: Movimento[] = [
  { id: 1, idMaterial: 3, codigo: 'MAT-003', nome: 'Filtro de Ar', categoria: 'Peças', tipo: 'ENTRADA', quantidade: 50, idUsuario: 1, utilizador: 'Administrador', criadoEm: new Date(Date.now() - 2 * 3600e3).toISOString() },
  { id: 2, idMaterial: 2, codigo: 'MAT-002', nome: 'Chave de fenda', categoria: 'Ferramentas', tipo: 'SAIDA', quantidade: 2, idUsuario: 3, utilizador: 'Mecânico 1', criadoEm: new Date(Date.now() - 5 * 3600e3).toISOString() },
  { id: 3, idMaterial: 2, codigo: 'MAT-002', nome: 'Óleo de motor', categoria: 'Consumíveis', tipo: 'SAIDA', quantidade: 5, idUsuario: 2, utilizador: 'Atendente', criadoEm: new Date(Date.now() - 8 * 3600e3).toISOString() },
];

let requisicoes = [
  { id: 1, idMaterial: 5, idMecanico: 3, idAtendente: null, quantidade: 2, estado: 'PENDENTE' as const, criadoEm: new Date().toISOString() },
  { id: 2, idMaterial: 2, idMecanico: 3, idAtendente: null, quantidade: 4, estado: 'PENDENTE' as const, criadoEm: new Date().toISOString() },
];
let proximoId = 100;

function recalcEstado(qtd: number, min: number): EstadoStock {
  if (qtd === 0) return 'ESGOTADO';
  if (qtd <= min) return 'STOCK_BAIXO';
  return 'DISPONIVEL';
}

function calcularAlertas(): Alerta[] {
  const a: Alerta[] = [];
  for (const m of materiais) {
    if (!m.stock) continue;
    if (m.stock.estado === 'ESGOTADO') a.push({ tipo: 'ESGOTADO', titulo: 'Stock esgotado', detalhe: `${m.nome} — 0 un.`, criadoEm: new Date().toISOString() });
    else if (m.stock.estado === 'STOCK_BAIXO') a.push({ tipo: 'STOCK_BAIXO', titulo: 'Stock baixo', detalhe: `${m.nome} — ${m.stock.quantidade} un.`, criadoEm: new Date().toISOString() });
  }
  const pend = requisicoes.filter((r) => r.estado === 'PENDENTE').length;
  if (pend > 0) a.push({ tipo: 'REQUISICOES_PENDENTES', titulo: 'Requisições pendentes', detalhe: `${pend} requisições aguardam atendimento.`, criadoEm: new Date().toISOString() });
  return a;
}

function calcularTotais() {
  return {
    materiais: materiais.filter((m) => m.activo).length,
    stockBaixo: materiais.filter((m) => m.stock?.estado === 'STOCK_BAIXO').length,
    esgotado: materiais.filter((m) => m.stock?.estado === 'ESGOTADO').length,
    emReposicao: materiais.filter((m) => m.stock?.estado === 'EM_REPOSICAO').length,
  };
}

const dias: { data: string; entradas: number; saidas: number }[] = [];
const serie = [[9,3],[15,9],[10,6],[16,11],[13,8],[21,12],[15,9]];
for (let i = 6; i >= 0; i--) {
  const d = new Date(); d.setDate(d.getDate() - i);
  const [e, s] = serie[6 - i];
  dias.push({ data: d.toISOString().slice(0, 10), entradas: e, saidas: s });
}

let usuarioActual: Utilizador | null = null;

export const handlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { username: string };
    const u = usuarios.find((x) => x.username === body.username);
    if (!u) return HttpResponse.json({ codigo: 'CREDENCIAIS_INVALIDAS', mensagem: 'Credenciais inválidas' }, { status: 401 });
    usuarioActual = u;
    return HttpResponse.json({ utilizador: u });
  }),
  http.post('/api/auth/logout', () => { usuarioActual = null; return HttpResponse.json({ mensagem: 'Sessão terminada' }); }),
  http.get('/api/auth/me', () => usuarioActual
    ? HttpResponse.json({ utilizador: usuarioActual })
    : HttpResponse.json({ codigo: 'NAO_AUTENTICADO', mensagem: 'Sem sessão' }, { status: 401 })),

  http.get('/api/utilizadores', () => HttpResponse.json({ utilizadores: usuarios })),
  http.get('/api/categorias', () => HttpResponse.json({ categorias })),
  http.get('/api/materiais', () => HttpResponse.json({ itens: materiais, total: materiais.length })),
  http.get('/api/materiais/:id', ({ params }) => {
    const m = materiais.find((x) => x.id === Number(params.id));
    return m ? HttpResponse.json({ material: m }) : HttpResponse.json({ codigo: 'NAO_ENCONTRADO', mensagem: 'Não encontrado' }, { status: 404 });
  }),

  // Movimentos STATEFUL: mutam o stock e geram notificações coerentes.
  http.post('/api/movimentos/entradas', async ({ request }) => {
    const b = (await request.json()) as { idMaterial: number; quantidade: number };
    const m = materiais.find((x) => x.id === b.idMaterial);
    if (!m || !m.stock) return HttpResponse.json({ codigo: 'NAO_ENCONTRADO', mensagem: 'Material não encontrado' }, { status: 404 });
    m.stock.quantidade += b.quantidade;
    m.stock.estado = recalcEstado(m.stock.quantidade, m.stock.stockMinimo);
    movimentos.unshift({ id: proximoId++, idMaterial: m.id, codigo: m.codigo, nome: m.nome, categoria: categorias.find((c) => c.id === m.idCategoria)?.descricao ?? '', tipo: 'ENTRADA', quantidade: b.quantidade, idUsuario: usuarioActual?.id ?? 1, utilizador: usuarioActual?.nome ?? '', criadoEm: new Date().toISOString() });
    return HttpResponse.json({ stock: m.stock }, { status: 201 });
  }),
  http.post('/api/movimentos/saidas', async ({ request }) => {
    const b = (await request.json()) as { idMaterial: number; quantidade: number };
    const m = materiais.find((x) => x.id === b.idMaterial);
    if (!m || !m.stock) return HttpResponse.json({ codigo: 'NAO_ENCONTRADO', mensagem: 'Material não encontrado' }, { status: 404 });
    if (b.quantidade > m.stock.quantidade) return HttpResponse.json({ codigo: 'STOCK_INSUFICIENTE', mensagem: `Stock insuficiente: tem ${m.stock.quantidade}, tentou retirar ${b.quantidade}` }, { status: 409 });
    m.stock.quantidade -= b.quantidade;
    m.stock.estado = recalcEstado(m.stock.quantidade, m.stock.stockMinimo);
    movimentos.unshift({ id: proximoId++, idMaterial: m.id, codigo: m.codigo, nome: m.nome, categoria: categorias.find((c) => c.id === m.idCategoria)?.descricao ?? '', tipo: 'SAIDA', quantidade: b.quantidade, idUsuario: usuarioActual?.id ?? 1, utilizador: usuarioActual?.nome ?? '', criadoEm: new Date().toISOString() });
    return HttpResponse.json({ stock: m.stock }, { status: 201 });
  }),
  http.get('/api/movimentos', () => HttpResponse.json({ itens: movimentos, total: movimentos.length })),

  // Requisições STATEFUL.
  http.get('/api/requisicoes', () => HttpResponse.json({ itens: requisicoes, total: requisicoes.length })),
  http.post('/api/requisicoes', async ({ request }) => {
    const b = (await request.json()) as { idMaterial: number; quantidade: number };
    const r = { id: proximoId++, idMaterial: b.idMaterial, idMecanico: usuarioActual?.id ?? 3, idAtendente: null, quantidade: b.quantidade, estado: 'PENDENTE' as const, criadoEm: new Date().toISOString() };
    requisicoes.push(r);
    return HttpResponse.json({ requisicao: r }, { status: 201 });
  }),
  http.patch('/api/requisicoes/:id/aprovar', ({ params }) => {
    const r = requisicoes.find((x) => x.id === Number(params.id));
    if (!r) return HttpResponse.json({ codigo: 'NAO_ENCONTRADO', mensagem: 'Não encontrada' }, { status: 404 });
    if (r.estado !== 'PENDENTE') return HttpResponse.json({ codigo: 'TRANSICAO_INVALIDA', mensagem: 'Transição inválida' }, { status: 409 });
    r.estado = 'APROVADA'; r.idAtendente = usuarioActual?.id ?? 2;
    return HttpResponse.json({ requisicao: r });
  }),
  http.patch('/api/requisicoes/:id/reprovar', ({ params }) => {
    const r = requisicoes.find((x) => x.id === Number(params.id));
    if (!r) return HttpResponse.json({ codigo: 'NAO_ENCONTRADO', mensagem: 'Não encontrada' }, { status: 404 });
    if (r.estado !== 'PENDENTE') return HttpResponse.json({ codigo: 'TRANSICAO_INVALIDA', mensagem: 'Transição inválida' }, { status: 409 });
    r.estado = 'REPROVADA'; r.idAtendente = usuarioActual?.id ?? 2;
    return HttpResponse.json({ requisicao: r });
  }),

  http.get('/api/dashboard/resumo', () => {
    const r: DashboardResumo = {
      totais: calcularTotais(),
      porTipo: [
        { tipo: 'PECA', total: materiais.filter((m) => m.tipo === 'PECA').length },
        { tipo: 'FERRAMENTA', total: materiais.filter((m) => m.tipo === 'FERRAMENTA').length },
        { tipo: 'EQUIPAMENTO', total: materiais.filter((m) => m.tipo === 'EQUIPAMENTO').length },
      ],
      movimentosUltimos7Dias: dias,
      ultimasMovimentacoes: movimentos.slice(0, 5),
      alertas: calcularAlertas(),
    };
    return HttpResponse.json(r);
  }),

  http.get('/api/health', () => HttpResponse.json({ status: 'ok', timestamp: new Date().toISOString() })),
];
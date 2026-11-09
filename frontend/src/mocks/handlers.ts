import { http, HttpResponse } from 'msw';
import type {
  Utilizador, DashboardResumo, Movimento, Categoria, Material, EstadoStock, Alerta,
} from '../api/types.ts';

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
];

let requisicoes = [
  { id: 1, idMaterial: 5, idMecanico: 3, idAtendente: null, quantidade: 2, estado: 'PENDENTE' as const, criadoEm: new Date().toISOString() },
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
    if (!m.activo || !m.stock) continue;
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
    stockBaixo: materiais.filter((m) => m.activo && m.stock?.estado === 'STOCK_BAIXO').length,
    esgotado: materiais.filter((m) => m.activo && m.stock?.estado === 'ESGOTADO').length,
    emReposicao: materiais.filter((m) => m.activo && m.stock?.estado === 'EM_REPOSICAO').length,
  };
}
function registarMovimento(m: Material, tipo: Movimento['tipo'], qtd: number) {
  movimentos.unshift({
    id: proximoId++, idMaterial: m.id, codigo: m.codigo, nome: m.nome,
    categoria: categorias.find((c) => c.id === m.idCategoria)?.descricao ?? '',
    tipo, quantidade: qtd, idUsuario: usuarioActual?.id ?? 1, utilizador: usuarioActual?.nome ?? '',
    criadoEm: new Date().toISOString(),
  });
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

  http.get('/api/materiais', ({ request: req }) => {
    const url = new URL(req.url);
    const q = (url.searchParams.get('query') ?? '').toLowerCase();
    const tipo = url.searchParams.get('tipo');
    const categoria = url.searchParams.get('categoria');
    const estado = url.searchParams.get('estado');
    const incluirInactivos = url.searchParams.get('incluirInactivos') === 'true';
    const pagina = Number(url.searchParams.get('pagina') ?? 1);
    const tamanho = Number(url.searchParams.get('tamanho') ?? 8);
    let itens = materiais.filter((m) => incluirInactivos || m.activo);
    if (q) itens = itens.filter((m) => m.nome.toLowerCase().includes(q) || m.codigo.toLowerCase().includes(q));
    if (tipo) itens = itens.filter((m) => m.tipo === tipo);
    if (categoria) itens = itens.filter((m) => m.idCategoria === Number(categoria));
    if (estado) itens = itens.filter((m) => m.stock?.estado === estado);
    const total = itens.length;
    const inicio = (pagina - 1) * tamanho;
    return HttpResponse.json({ itens: itens.slice(inicio, inicio + tamanho), total });
  }),
  http.get('/api/materiais/:id', ({ params }) => {
    const m = materiais.find((x) => x.id === Number(params.id));
    return m ? HttpResponse.json({ material: m }) : HttpResponse.json({ codigo: 'NAO_ENCONTRADO', mensagem: 'Não encontrado' }, { status: 404 });
  }),
  http.post('/api/materiais', async ({ request }) => {
    const b = (await request.json()) as any;
    if (materiais.some((m) => m.codigo === b.codigo)) return HttpResponse.json({ codigo: 'CODIGO_DUPLICADO', mensagem: 'Código já existe' }, { status: 409 });
    const qtd = Number(b.quantidadeInicial ?? 0); const min = Number(b.stockMinimo ?? 0);
    const m: Material = { id: proximoId++, codigo: b.codigo, nome: b.nome, tipo: b.tipo, idCategoria: Number(b.idCategoria), unidade: b.unidade ?? 'un', activo: true, stock: { quantidade: qtd, stockMinimo: min, estado: recalcEstado(qtd, min) } };
    materiais.push(m);
    return HttpResponse.json({ material: m }, { status: 201 });
  }),
  http.put('/api/materiais/:id', async ({ params, request }) => {
    const m = materiais.find((x) => x.id === Number(params.id));
    if (!m) return HttpResponse.json({ codigo: 'NAO_ENCONTRADO', mensagem: 'Não encontrado' }, { status: 404 });
    const b = (await request.json()) as any;
    if (b.nome !== undefined) m.nome = b.nome;
    if (b.unidade !== undefined) m.unidade = b.unidade;
    if (b.stockMinimo !== undefined && m.stock) { m.stock.stockMinimo = Number(b.stockMinimo); m.stock.estado = recalcEstado(m.stock.quantidade, m.stock.stockMinimo); }
    return HttpResponse.json({ material: m });
  }),
  http.delete('/api/materiais/:id', ({ params }) => {
    const m = materiais.find((x) => x.id === Number(params.id));
    if (!m) return HttpResponse.json({ codigo: 'NAO_ENCONTRADO', mensagem: 'Não encontrado' }, { status: 404 });
    if ((m.stock?.quantidade ?? 0) > 0) return HttpResponse.json({ codigo: 'MATERIAL_COM_STOCK', mensagem: 'Material com stock; faça um ajuste de saída antes de remover' }, { status: 409 });
    m.activo = false;
    return HttpResponse.json({ mensagem: 'Material removido' });
  }),
  http.post('/api/materiais/:id/reativar', ({ params }) => {
    const m = materiais.find((x) => x.id === Number(params.id));
    if (!m) return HttpResponse.json({ codigo: 'NAO_ENCONTRADO', mensagem: 'Não encontrado' }, { status: 404 });
    m.activo = true;
    return HttpResponse.json({ mensagem: 'Material reativado' });
  }),

  // Reposição (única mudança manual de estado).
  http.post('/api/materiais/:id/iniciar-reposicao', ({ params }) => {
    const m = materiais.find((x) => x.id === Number(params.id));
    if (!m || !m.stock) return HttpResponse.json({ codigo: 'NAO_ENCONTRADO', mensagem: 'Não encontrado' }, { status: 404 });
    if (m.stock.estado !== 'STOCK_BAIXO' && m.stock.estado !== 'ESGOTADO')
      return HttpResponse.json({ codigo: 'TRANSICAO_INVALIDA', mensagem: `Não é possível iniciar reposição em ${m.stock.estado}` }, { status: 409 });
    m.stock.estado = 'EM_REPOSICAO';
    return HttpResponse.json({ stock: m.stock });
  }),
  http.post('/api/materiais/:id/cancelar-reposicao', ({ params }) => {
    const m = materiais.find((x) => x.id === Number(params.id));
    if (!m || !m.stock) return HttpResponse.json({ codigo: 'NAO_ENCONTRADO', mensagem: 'Não encontrado' }, { status: 404 });
    if (m.stock.estado !== 'EM_REPOSICAO')
      return HttpResponse.json({ codigo: 'TRANSICAO_INVALIDA', mensagem: 'Não é possível cancelar reposição neste estado' }, { status: 409 });
    m.stock.estado = recalcEstado(m.stock.quantidade, m.stock.stockMinimo);
    return HttpResponse.json({ stock: m.stock });
  }),

  http.post('/api/movimentos/entradas', async ({ request }) => {
    const b = (await request.json()) as { idMaterial: number; quantidade: number };
    const m = materiais.find((x) => x.id === b.idMaterial);
    if (!m || !m.stock) return HttpResponse.json({ codigo: 'NAO_ENCONTRADO', mensagem: 'Não encontrado' }, { status: 404 });
    m.stock.quantidade += b.quantidade;
    m.stock.estado = m.stock.estado === 'EM_REPOSICAO' && m.stock.quantidade > m.stock.stockMinimo ? 'DISPONIVEL' : recalcEstado(m.stock.quantidade, m.stock.stockMinimo);
    registarMovimento(m, 'ENTRADA', b.quantidade);
    return HttpResponse.json({ stock: m.stock }, { status: 201 });
  }),
  http.post('/api/movimentos/saidas', async ({ request }) => {
    const b = (await request.json()) as { idMaterial: number; quantidade: number };
    const m = materiais.find((x) => x.id === b.idMaterial);
    if (!m || !m.stock) return HttpResponse.json({ codigo: 'NAO_ENCONTRADO', mensagem: 'Não encontrado' }, { status: 404 });
    if (b.quantidade > m.stock.quantidade) return HttpResponse.json({ codigo: 'STOCK_INSUFICIENTE', mensagem: `Stock insuficiente: tem ${m.stock.quantidade}, tentou retirar ${b.quantidade}` }, { status: 409 });
    m.stock.quantidade -= b.quantidade;
    m.stock.estado = recalcEstado(m.stock.quantidade, m.stock.stockMinimo);
    registarMovimento(m, 'SAIDA', b.quantidade);
    return HttpResponse.json({ stock: m.stock }, { status: 201 });
  }),
  http.post('/api/movimentos/ajustes', async ({ request }) => {
    const b = (await request.json()) as { idMaterial: number; quantidade: number; observacao?: string };
    if (!b.observacao || b.observacao.trim() === '') return HttpResponse.json({ codigo: 'VALIDACAO', mensagem: 'Observação obrigatória em ajustes' }, { status: 400 });
    const m = materiais.find((x) => x.id === b.idMaterial);
    if (!m || !m.stock) return HttpResponse.json({ codigo: 'NAO_ENCONTRADO', mensagem: 'Não encontrado' }, { status: 404 });
    if (b.quantidade < 0 && Math.abs(b.quantidade) > m.stock.quantidade)
      return HttpResponse.json({ codigo: 'STOCK_INSUFICIENTE', mensagem: `Stock insuficiente: tem ${m.stock.quantidade}` }, { status: 409 });
    m.stock.quantidade += b.quantidade;
    m.stock.estado = recalcEstado(m.stock.quantidade, m.stock.stockMinimo);
    registarMovimento(m, b.quantidade > 0 ? 'AJUSTE_ENTRADA' : 'AJUSTE_SAIDA', Math.abs(b.quantidade));
    return HttpResponse.json({ stock: m.stock }, { status: 201 });
  }),
  http.get('/api/movimentos', () => HttpResponse.json({ itens: movimentos, total: movimentos.length })),

  http.get('/api/requisicoes', () => HttpResponse.json({ itens: requisicoes, total: requisicoes.length })),
  http.post('/api/requisicoes', async ({ request }) => {
    const b = (await request.json()) as { idMaterial: number; quantidade: number };
    const r = { id: proximoId++, idMaterial: b.idMaterial, idMecanico: usuarioActual?.id ?? 3, idAtendente: null, quantidade: b.quantidade, estado: 'PENDENTE' as const, criadoEm: new Date().toISOString() };
    requisicoes.push(r);
    return HttpResponse.json({ requisicao: r }, { status: 201 });
  }),

  http.get('/api/dashboard/resumo', () => {
    const r: DashboardResumo = {
      totais: calcularTotais(),
      porTipo: [
        { tipo: 'PECA', total: materiais.filter((m) => m.tipo === 'PECA' && m.activo).length },
        { tipo: 'FERRAMENTA', total: materiais.filter((m) => m.tipo === 'FERRAMENTA' && m.activo).length },
        { tipo: 'EQUIPAMENTO', total: materiais.filter((m) => m.tipo === 'EQUIPAMENTO' && m.activo).length },
      ],
      movimentosUltimos7Dias: dias,
      ultimasMovimentacoes: movimentos.slice(0, 5),
      alertas: calcularAlertas(),
    };
    return HttpResponse.json(r);
  }),

  http.get('/api/health', () => HttpResponse.json({ status: 'ok', timestamp: new Date().toISOString() })),
];
import { http, HttpResponse } from 'msw';
import type {
  Utilizador, DashboardResumo, Movimento, Categoria, Material,
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

const movimentos: Movimento[] = [
  { id: 1, idMaterial: 3, codigo: 'MAT-003', nome: 'Filtro de Ar', categoria: 'Peças', tipo: 'ENTRADA', quantidade: 50, idUsuario: 1, utilizador: 'Administrador', criadoEm: new Date(Date.now() - 2 * 3600e3).toISOString() },
  { id: 2, idMaterial: 2, codigo: 'MAT-002', nome: 'Chave de fenda', categoria: 'Ferramentas', tipo: 'SAIDA', quantidade: 2, idUsuario: 3, utilizador: 'Mecânico 1', criadoEm: new Date(Date.now() - 5 * 3600e3).toISOString() },
  { id: 3, idMaterial: 2, codigo: 'MAT-002', nome: 'Óleo de motor', categoria: 'Consumíveis', tipo: 'SAIDA', quantidade: 5, idUsuario: 2, utilizador: 'Atendente', criadoEm: new Date(Date.now() - 8 * 3600e3).toISOString() },
  { id: 4, idMaterial: 5, codigo: 'MAT-005', nome: 'Bateria 12V', categoria: 'Equipamentos', tipo: 'ENTRADA', quantidade: 10, idUsuario: 1, utilizador: 'Administrador', criadoEm: new Date(Date.now() - 26 * 3600e3).toISOString() },
  { id: 5, idMaterial: 1, codigo: 'MAT-001', nome: 'Parafuso M8', categoria: 'Peças', tipo: 'SAIDA', quantidade: 20, idUsuario: 3, utilizador: 'Mecânico 2', criadoEm: new Date(Date.now() - 30 * 3600e3).toISOString() },
];

const dias: { data: string; entradas: number; saidas: number }[] = [];
const serie = [ [9,3],[15,9],[10,6],[16,11],[13,8],[21,12],[15,9] ];
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
  http.get('/api/auth/me', () => {
    if (!usuarioActual) return HttpResponse.json({ codigo: 'NAO_AUTENTICADO', mensagem: 'Sem sessão' }, { status: 401 });
    return HttpResponse.json({ utilizador: usuarioActual });
  }),

  http.get('/api/utilizadores', () => HttpResponse.json({ utilizadores: usuarios })),
  http.get('/api/categorias', () => HttpResponse.json({ categorias })),
  http.get('/api/materiais', ({ request: req }) => {
    const url = new URL(req.url);
    const q = (url.searchParams.get('query') ?? '').toLowerCase();
    const itens = materiais.filter((m) => !q || m.nome.toLowerCase().includes(q) || m.codigo.toLowerCase().includes(q));
    return HttpResponse.json({ itens, total: itens.length });
  }),
  http.get('/api/materiais/:id', ({ params }) => {
    const m = materiais.find((x) => x.id === Number(params.id));
    return m ? HttpResponse.json({ material: m }) : HttpResponse.json({ codigo: 'NAO_ENCONTRADO', mensagem: 'Não encontrado' }, { status: 404 });
  }),
  http.get('/api/movimentos', () => HttpResponse.json({ itens: movimentos, total: movimentos.length })),

  http.get('/api/dashboard/resumo', () => {
    const r: DashboardResumo = {
      totais: { materiais: 142, stockBaixo: 8, esgotado: 2, emReposicao: 1 },
      porTipo: [ { tipo: 'PECA', total: 96 }, { tipo: 'FERRAMENTA', total: 30 }, { tipo: 'EQUIPAMENTO', total: 16 } ],
      movimentosUltimos7Dias: dias,
      ultimasMovimentacoes: movimentos,
      alertas: [
        { tipo: 'STOCK_BAIXO', titulo: 'Stock baixo', detalhe: 'Filtro de óleo — 3 un.', criadoEm: new Date().toISOString() },
        { tipo: 'ESGOTADO', titulo: 'Stock esgotado', detalhe: 'Bateria 12V — 0 un.', criadoEm: new Date().toISOString() },
        { tipo: 'REQUISICOES_PENDENTES', titulo: 'Requisições pendentes', detalhe: '2 requisições aguardam atendimento.', criadoEm: new Date().toISOString() },
      ],
    };
    return HttpResponse.json(r);
  }),

  http.get('/api/health', () => HttpResponse.json({ status: 'ok', timestamp: new Date().toISOString() })),
];
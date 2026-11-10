// Seed IDEMPOTENTE: cada registo é criado apenas se ainda não existir.
// Pode ser corrido várias vezes em segurança (não duplica).
import { pool } from '../src/config/database.js';
import bcrypt from 'bcrypt';

async function garantirUsuario(
  nome: string, username: string, email: string, password: string, perfil: string,
) {
  const existe = await pool.query('SELECT 1 FROM usuario WHERE username = $1', [username]);
  if ((existe.rowCount ?? 0) > 0) {
    console.log(`  = utilizador '${username}' já existe`);
    return;
  }
  const hash = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO usuario (nome, username, email, password_hash, perfil)
     VALUES ($1, $2, $3, $4, $5)`,
    [nome, username, email, hash, perfil],
  );
  console.log(`  + utilizador '${username}' criado (${perfil})`);
}

async function garantirCategoria(descricao: string): Promise<number> {
  const existe = await pool.query('SELECT id FROM categoria_material WHERE descricao = $1', [descricao]);
  if ((existe.rowCount ?? 0) > 0) return Number(existe.rows[0].id);
  const r = await pool.query('INSERT INTO categoria_material (descricao) VALUES ($1) RETURNING id', [descricao]);
  console.log(`  + categoria '${descricao}' criada`);
  return Number(r.rows[0].id);
}

async function garantirMaterial(
  codigo: string, nome: string, tipo: string, idCategoria: number,
  quantidade: number, stockMinimo: number,
) {
  const existe = await pool.query('SELECT 1 FROM material WHERE codigo = $1', [codigo]);
  if ((existe.rowCount ?? 0) > 0) {
    console.log(`  = material '${codigo}' já existe`);
    return;
  }
  const estado = quantidade === 0 ? 'ESGOTADO' : quantidade <= stockMinimo ? 'STOCK_BAIXO' : 'DISPONIVEL';
  const r = await pool.query(
    `INSERT INTO material (codigo, nome, tipo, id_categoria, unidade, activo)
     VALUES ($1, $2, $3, $4, 'un', TRUE) RETURNING id`,
    [codigo, nome, tipo, idCategoria],
  );
  await pool.query(
    `INSERT INTO stock_material (id_material, quantidade, stock_minimo, estado)
     VALUES ($1, $2, $3, $4)`,
    [r.rows[0].id, quantidade, stockMinimo, estado],
  );
  console.log(`  + material '${codigo}' criado`);
}

async function main() {
  console.log('A semear dados iniciais...');

  // Utilizadores (um por perfil) — criados individualmente se faltarem.
  await garantirUsuario('Administrador', 'admin', 'admin@oficinagest.local', 'admin123', 'ADMINISTRADOR');
  await garantirUsuario('Atendente', 'atendente', 'atendente@oficinagest.local', 'atend123', 'ATENDENTE');
  await garantirUsuario('Mecânico', 'mecanico', 'mecanico@oficinagest.local', 'mec123', 'MECANICO');

  // Categorias de exemplo.
  const catPecas = await garantirCategoria('Peças');
  const catFiltros = await garantirCategoria('Filtros');
  const catConsumiveis = await garantirCategoria('Consumíveis');
  const catEletrica = await garantirCategoria('Elétrica');
  await garantirCategoria('Ferramentas');

  // Materiais de exemplo (distribuídos por categorias sensatas).
  await garantirMaterial('PEC-001', 'Parafuso M6', 'PECA', catPecas, 10, 2);
  await garantirMaterial('PEC-100', 'Filtro de Óleo', 'PECA', catFiltros, 3, 3);
  await garantirMaterial('FER-001', 'Chave de Fenda', 'FERRAMENTA', catConsumiveis, 10, 1);
  await garantirMaterial('EQU-001', 'Macaco Hidráulico', 'EQUIPAMENTO', catConsumiveis, 10, 1);
  await garantirMaterial('EQU-002', 'Bateria 12V', 'EQUIPAMENTO', catEletrica, 5, 2);

  console.log('✅ Seed concluído.');
  await pool.end();
}

main().catch((e) => { console.error('❌ Seed falhou:', e); process.exit(1); });
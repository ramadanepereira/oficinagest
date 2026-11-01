// Seed de desenvolvimento: idempotente e seguro.
// Recusa correr em produção (NODE_ENV=production).
// Cria 3 utilizadores (1 por perfil) + categorias + materiais de exemplo.

import pg from 'pg';
import { BcryptHasher } from '../src/infrastructure/security/BcryptHasher.js';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Refusando executar seed em produção.');
    process.exit(1);
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  console.log('🌱 Iniciando seed em:', process.env.DATABASE_URL);

  const hasher = new BcryptHasher();

  // Utilizadores: passwords de teste, NUNCA em produção.
  const usuarios = [
    { nome: 'Administrador', username: 'admin', email: 'admin@oficinagest.local', perfil: 'ADMINISTRADOR', password: 'admin123' },
    { nome: 'Atendente', username: 'atendente', email: 'atendente@oficinagest.local', perfil: 'ATENDENTE', password: 'atend123' },
    { nome: 'Mecânico', username: 'mecanico', email: 'mecanico@oficinagest.local', perfil: 'MECANICO', password: 'mec123' },
  ];

  for (const u of usuarios) {
    const existe = await pool.query('SELECT 1 FROM usuario WHERE username = $1', [u.username]);
    if (existe.rowCount === 0) {
      const hash = await hasher.hash(u.password);
      await pool.query(
        `INSERT INTO usuario (nome, username, email, password_hash, perfil)
         VALUES ($1, $2, $3, $4, $5)`,
        [u.nome, u.username, u.email, hash, u.perfil]
      );
      console.log(`✅ Utilizador criado: ${u.username} (password: ${u.password})`);
    } else {
      console.log(`ℹ️  Utilizador já existe: ${u.username}`);
    }
  }

  // Categorias
  const categorias = ['Consumíveis', 'Filtros', 'Motor', 'Elétrica'];
  for (const descricao of categorias) {
    const existe = await pool.query('SELECT 1 FROM categoria_material WHERE descricao = $1', [descricao]);
    if (existe.rowCount === 0) {
      await pool.query('INSERT INTO categoria_material (descricao) VALUES ($1)', [descricao]);
      console.log(`✅ Categoria criada: ${descricao}`);
    } else {
      console.log(`ℹ️  Categoria já existe: ${descricao}`);
    }
  }

  // Materiais de exemplo (1 de cada tipo), ligados à categoria "Consumíveis"
  const result = await pool.query("SELECT id FROM categoria_material WHERE descricao = 'Consumíveis' LIMIT 1");
  if (result.rowCount && result.rowCount > 0) {
    const idCategoria = result.rows[0].id;
    const materiais = [
      { codigo: 'PEC-001', nome: 'Parafuso M6', tipo: 'PECA' },
      { codigo: 'FER-001', nome: 'Chave de Fenda', tipo: 'FERRAMENTA' },
      { codigo: 'EQU-001', nome: 'Macaco Hidráulico', tipo: 'EQUIPAMENTO' },
    ];
    for (const m of materiais) {
      const existe = await pool.query('SELECT 1 FROM material WHERE codigo = $1', [m.codigo]);
      if (existe.rowCount === 0) {
        const res = await pool.query(
          `INSERT INTO material (codigo, nome, tipo, id_categoria)
           VALUES ($1, $2, $3, $4) RETURNING id`,
          [m.codigo, m.nome, m.tipo, idCategoria]
        );
        const idMaterial = res.rows[0].id;
        // Stock inicial: 10 unidades, mínimo 2, estado DISPONIVEL
        await pool.query(
          `INSERT INTO stock_material (id_material, quantidade, stock_minimo, estado)
           VALUES ($1, 10, 2, 'DISPONIVEL')`,
          [idMaterial]
        );
        console.log(`✅ Material criado: ${m.codigo} - ${m.nome}`);
      } else {
        console.log(`ℹ️  Material já existe: ${m.codigo}`);
      }
    }
  }

  await pool.end();
  console.log('🌱 Seed concluído.');
}

main().catch((err) => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
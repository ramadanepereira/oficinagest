import pg from 'pg';

export function poolTeste(): pg.Pool {
  return new pg.Pool({ connectionString: process.env.DATABASE_URL_TESTE });
}

// Limpa todas as tabelas entre testes (ordem irrelevante com CASCADE).
export async function limparTabelas(pool: pg.Pool): Promise<void> {
  await pool.query(
    `TRUNCATE TABLE movimento_stock, historico_alteracao_material, requisicao,
            stock_material, material, categoria_material, usuario
     RESTART IDENTITY CASCADE`
  );
}

export async function criarUsuario(
  pool: pg.Pool,
  opts: { username: string; perfil: string; passwordHash: string },
): Promise<number> {
  const { rows } = await pool.query(
    `INSERT INTO usuario (nome, username, email, password_hash, perfil)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [opts.username, opts.username, `${opts.username}@teste.local`, opts.passwordHash, opts.perfil],
  );
  return Number(rows[0].id);
}

export async function criarCategoria(pool: pg.Pool, descricao: string): Promise<number> {
  const { rows } = await pool.query(
    'INSERT INTO categoria_material (descricao) VALUES ($1) RETURNING id',
    [descricao],
  );
  return Number(rows[0].id);
}

// Cria material + linha de stock directamente (setup de teste).
export async function criarMaterialComStock(
  pool: pg.Pool,
  opts: { codigo: string; idCategoria: number; quantidade: number; stockMinimo: number },
): Promise<number> {
  const { rows } = await pool.query(
    `INSERT INTO material (codigo, nome, tipo, id_categoria)
     VALUES ($1, $2, 'PECA', $3) RETURNING id`,
    [opts.codigo, opts.codigo, opts.idCategoria],
  );
  const id = Number(rows[0].id);
  const estado = opts.quantidade === 0 ? 'ESGOTADO' : opts.quantidade <= opts.stockMinimo ? 'STOCK_BAIXO' : 'DISPONIVEL';
  await pool.query(
    `INSERT INTO stock_material (id_material, quantidade, stock_minimo, estado)
     VALUES ($1, $2, $3, $4)`,
    [id, opts.quantidade, opts.stockMinimo, estado],
  );
  return id;
}

export async function lerStock(pool: pg.Pool, idMaterial: number) {
  const { rows } = await pool.query(
    'SELECT quantidade, stock_minimo, estado FROM stock_material WHERE id_material = $1',
    [idMaterial],
  );
  return {
    quantidade: Number(rows[0].quantidade),
    stockMinimo: Number(rows[0].stock_minimo),
    estado: rows[0].estado as string,
  };
}

export async function contarMovimentos(pool: pg.Pool, idMaterial: number, tipo: string) {
  const { rows } = await pool.query(
    'SELECT COUNT(*) AS n FROM movimento_stock WHERE id_material = $1 AND tipo = $2',
    [idMaterial, tipo],
  );
  return Number(rows[0].n);
}
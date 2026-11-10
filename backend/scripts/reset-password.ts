// RECUPERACAO DE EMERGENCIA (break-glass): repoe a palavra-passe de um
// utilizador directamente na base de dados. Exige acesso ao servidor.
//
// Uso:   npm run reset-password -- <username> <novaPassword>
// Ex.:   npm run reset-password -- admin NovaSenha123
//
// Nao ha fluxo automatico por email (sistema self-hosted sem SMTP).
// Via alternativa na UI: outro ADMIN repoe em Utilizadores -> Editar.
import { pool } from '../src/config/database.js';
import bcrypt from 'bcrypt';

async function main() {
  const [username, novaPassword] = process.argv.slice(2);
  if (!username || !novaPassword) {
    console.error('Uso: npm run reset-password -- <username> <novaPassword>');
    process.exit(1);
  }
  if (novaPassword.length < 6) {
    console.error('A palavra-passe deve ter pelo menos 6 caracteres.');
    process.exit(1);
  }
  const hash = await bcrypt.hash(novaPassword, 10);
  const r = await pool.query(
    'UPDATE usuario SET password_hash = $1 WHERE username = $2 RETURNING id, nome',
    [hash, username],
  );
  if ((r.rowCount ?? 0) === 0) {
    console.error(`Utilizador '${username}' nao encontrado.`);
    process.exit(1);
  }
  console.log(`Palavra-passe de '${username}' (${r.rows[0].nome}) reposta com sucesso.`);
  await pool.end();
}

main().catch((e) => { console.error('Falhou:', e.message); process.exit(1); });
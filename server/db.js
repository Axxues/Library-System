const sql = require('mssql');
let pool;
async function getPool() {
  if (pool) return pool;
  pool = await sql.connect({
    server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
    database: process.env.DB_NAME || 'LibraryDB',
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    ...(process.env.DB_PORT ? { port: +process.env.DB_PORT } : {}), // ponytail: Browser-off hosts reach SQLEXPRESS via explicit TCP port
    options: { encrypt: false, trustServerCertificate: true },
  });
  return pool;
}
module.exports = { getPool, sql };

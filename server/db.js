require('dotenv').config();
const sql = require('mssql');
let pool;
async function getPool() {
  if (pool) return pool;
  const isLocal = !process.env.DB_SERVER || process.env.DB_SERVER.toLowerCase().includes('localhost');
  const encrypt = process.env.DB_ENCRYPT !== undefined 
    ? process.env.DB_ENCRYPT === 'true' 
    : !isLocal;
  const trustServerCertificate = process.env.DB_TRUST_SERVER_CERT !== undefined
    ? process.env.DB_TRUST_SERVER_CERT === 'true'
    : true;

  pool = await sql.connect({
    server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
    database: process.env.DB_NAME || 'LibraryDB',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ...(process.env.DB_PORT ? { port: +process.env.DB_PORT } : {}),
    options: {
      encrypt,
      trustServerCertificate,
      enableArithAbort: true,
    },
  });
  return pool;
}
module.exports = { getPool, sql };

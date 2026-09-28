const test = require('node:test');
const assert = require('node:assert');
const { getPool } = require('../server/db');
test('pool connects and seeds exist', async () => {
  const pool = await getPool();
  const r = await pool.request().query('SELECT COUNT(*) AS n FROM Patrons');
  assert.ok(r.recordset[0].n >= 3, 'expected >=3 seeded patrons');
});

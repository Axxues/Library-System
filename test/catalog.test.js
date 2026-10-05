// test/catalog.test.js — live-DB test, needs seeded SQL Server (same setup as test/db.test.js)
const test = require('node:test');
const assert = require('node:assert');
const { getPool } = require('../server/db');
test('BookCopies has condition column defaulting to Good', async () => {
  const pool = await getPool();
  const cols = await pool.request().query("SELECT COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='BookCopies' AND COLUMN_NAME='condition'");
  assert.ok(cols.recordset.length === 1, 'condition column exists');
  assert.match(cols.recordset[0].COLUMN_DEFAULT, /Good/);
  const seeded = await pool.request().query('SELECT DISTINCT condition FROM BookCopies');
  assert.deepStrictEqual(seeded.recordset.map((r) => r.condition), ['Good']);
});

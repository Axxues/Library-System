// test/patrons.test.js — live-DB test, needs seeded SQL Server (same setup as test/db.test.js)
const test = require('node:test');
const assert = require('node:assert');
const { getPool } = require('../server/db');
test('Patrons has intake columns', async () => {
  const pool = await getPool();
  const r = await pool.request().query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Patrons'"
  );
  const cols = r.recordset.map((x) => x.COLUMN_NAME);
  for (const c of ['firstName', 'middleName', 'lastName', 'email', 'contact2', 'addrStreet', 'addrBarangay', 'addrCity', 'addrProvince', 'addrPostal', 'avatar']) {
    assert.ok(cols.includes(c), 'missing column ' + c);
  }
});

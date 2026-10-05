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
const BASE = 'http://localhost:4000';
async function login() {
  const r = await (await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'staff1', password: 'staff123' }) })).json();
  return r.token;
}
test('POST composes name from parts', async () => {
  const H = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await login() };
  const code = 'Plan Patron ' + Date.now();
  const r = await fetch(BASE + '/api/patrons', { method: 'POST', headers: H, body: JSON.stringify({ firstName: 'Plan', middleName: 'T', lastName: code, email: 'p@t.st', contact: '111', contact2: '222', addrCity: 'Sto. Tomas', avatar: 'data:image/jpeg;base64,AAA' }) });
  assert.strictEqual(r.status, 200);
  const d = await r.json();
  assert.strictEqual(d.name, 'Plan T ' + code);
  assert.strictEqual(d.email, 'p@t.st');
  assert.strictEqual(d.addrCity, 'Sto. Tomas');
  assert.strictEqual(d.avatar, 'data:image/jpeg;base64,AAA');
});
test('POST rejects part-without-last and oversized avatar', async () => {
  const H = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await login() };
  const bad1 = await fetch(BASE + '/api/patrons', { method: 'POST', headers: H, body: JSON.stringify({ firstName: 'Solo' }) });
  assert.strictEqual(bad1.status, 400);
  const bad2 = await fetch(BASE + '/api/patrons', { method: 'POST', headers: H, body: JSON.stringify({ firstName: 'A', lastName: 'B', avatar: 'x'.repeat(50001) }) });
  assert.strictEqual(bad2.status, 400);
});
test('PUT round-trips and 404s unknown code', async () => {
  const H = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await login() };
  const created = await (await fetch(BASE + '/api/patrons', { method: 'POST', headers: H, body: JSON.stringify({ firstName: 'Put', lastName: 'Me' + Date.now() }) })).json();
  const up = await fetch(BASE + '/api/patrons/' + created.code, { method: 'PUT', headers: H, body: JSON.stringify({ firstName: 'Put', lastName: created.lastName, email: 'new@t.st', addrBarangay: 'Poblacion' }) });
  assert.strictEqual(up.status, 200);
  const d = await up.json();
  assert.strictEqual(d.email, 'new@t.st');
  assert.strictEqual(d.addrBarangay, 'Poblacion');
  const missing = await fetch(BASE + '/api/patrons/NOPE-000', { method: 'PUT', headers: H, body: JSON.stringify({ firstName: 'A', lastName: 'B' }) });
  assert.strictEqual(missing.status, 404);
});

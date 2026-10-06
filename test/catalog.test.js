// test/catalog.test.js — live-DB test, needs seeded SQL Server (same setup as test/db.test.js)
const test = require('node:test');
const assert = require('node:assert');
const { getPool } = require('../server/db');
const BASE = 'http://localhost:4000';
async function login() {
  const r = await (await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'staff1', password: 'staff123' }) })).json();
  return r.token;
}
test('BookCopies has condition column defaulting to Good', async () => {
  const pool = await getPool();
  const cols = await pool.request().query("SELECT COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='BookCopies' AND COLUMN_NAME='condition'");
  assert.ok(cols.recordset.length === 1, 'condition column exists');
  assert.match(cols.recordset[0].COLUMN_DEFAULT, /Good/);
  const chk = await pool.request().query("SELECT definition FROM sys.check_constraints WHERE parent_object_id = OBJECT_ID('BookCopies')");
  assert.ok(chk.recordset.length >= 1, 'condition CHECK exists');
  assert.ok(chk.recordset.some((r) => /Good/.test(r.definition) && /Worn/.test(r.definition) && /Damaged/.test(r.definition)), 'condition CHECK covers Good/Worn/Damaged');
});
test('POST /api/catalog creates book with N coded copies', async () => {
  const H = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await login() };
  const title = 'Plan Test Book ' + Date.now();
  const r = await fetch(BASE + '/api/catalog', { method: 'POST', headers: H, body: JSON.stringify({ title, author: 'QA', genre: 'Test', copies: 2 }) });
  assert.strictEqual(r.status, 200);
  const d = await r.json();
  assert.strictEqual(d.copies.length, 2);
  assert.ok(/^B-COPY-\d{3,}$/.test(d.copies[0].copyCode));
  assert.strictEqual(d.copies[0].qrUrl, '/api/qr/' + d.copies[0].copyCode);
  assert.ok(d.copies[1].copyCode > d.copies[0].copyCode, 'codes ascend');
});
test('POST /api/catalog rejects missing title and bad copies', async () => {
  const H = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await login() };
  const bad1 = await fetch(BASE + '/api/catalog', { method: 'POST', headers: H, body: JSON.stringify({ author: 'QA', genre: 'Test', copies: 1 }) });
  assert.strictEqual(bad1.status, 400);
  const bad2 = await fetch(BASE + '/api/catalog', { method: 'POST', headers: H, body: JSON.stringify({ title: 'X', author: 'QA', genre: 'Test', copies: 51 }) });
  assert.strictEqual(bad2.status, 400);
});
test('PATCH condition round-trips and GET exposes it', async () => {
  const H = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await login() };
  const created = await (await fetch(BASE + '/api/catalog', { method: 'POST', headers: H, body: JSON.stringify({ title: 'Cond Book ' + Date.now(), author: 'QA', genre: 'Test', copies: 1 }) })).json();
  const code = created.copies[0].copyCode;
  try {
  const set = await fetch(BASE + '/api/copies/' + code + '/condition', { method: 'PATCH', headers: H, body: JSON.stringify({ condition: 'Damaged' }) });
  assert.strictEqual(set.status, 200);
  assert.deepStrictEqual(await set.json(), { copyCode: code, condition: 'Damaged', note: null });
  const cat = await (await fetch(BASE + '/api/catalog', { headers: { Authorization: 'Bearer ' + await login() } })).json();
  assert.strictEqual(cat.find((r) => r.copyCode === code).condition, 'Damaged');
  const bad = await fetch(BASE + '/api/copies/' + code + '/condition', { method: 'PATCH', headers: H, body: JSON.stringify({ condition: 'Broken' }) });
  assert.strictEqual(bad.status, 400);
  const missing = await fetch(BASE + '/api/copies/NOPE-000/condition', { method: 'PATCH', headers: H, body: JSON.stringify({ condition: 'Good' }) });
  assert.strictEqual(missing.status, 404);
  } finally {
    try { await fetch(BASE + '/api/copies/' + code + '/condition', { method: 'PATCH', headers: H, body: JSON.stringify({ condition: 'Good' }) }); } catch {}
  }
});
test('PATCH condition note round-trips, trims, and rejects overlong', async () => {
  const H = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await login() };
  const created = await (await fetch(BASE + '/api/catalog', { method: 'POST', headers: H, body: JSON.stringify({ title: 'Note Book ' + Date.now(), author: 'QA', genre: 'Test', copies: 1 }) })).json();
  const code = created.copies[0].copyCode;
  try {
    const set = await fetch(BASE + '/api/copies/' + code + '/condition', { method: 'PATCH', headers: H, body: JSON.stringify({ condition: 'Worn', note: '  torn page 42  ' }) });
    assert.strictEqual(set.status, 200);
    assert.deepStrictEqual(await set.json(), { copyCode: code, condition: 'Worn', note: 'torn page 42' });
    const cat = await (await fetch(BASE + '/api/catalog', { headers: { Authorization: 'Bearer ' + await login() } })).json();
    assert.strictEqual(cat.find((r) => r.copyCode === code).conditionNote, 'torn page 42');
    const long = await fetch(BASE + '/api/copies/' + code + '/condition', { method: 'PATCH', headers: H, body: JSON.stringify({ condition: 'Worn', note: 'x'.repeat(501) }) });
    assert.strictEqual(long.status, 400);
    const clear = await fetch(BASE + '/api/copies/' + code + '/condition', { method: 'PATCH', headers: H, body: JSON.stringify({ condition: 'Good', note: '   ' }) });
    assert.deepStrictEqual(await clear.json(), { copyCode: code, condition: 'Good', note: null });
  } finally {
    try { await fetch(BASE + '/api/copies/' + code + '/condition', { method: 'PATCH', headers: H, body: JSON.stringify({ condition: 'Good' }) }); } catch {}
  }
});

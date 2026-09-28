// test/profile.test.js — live-API test, needs server on :4000 (started in Step 4)
const test = require('node:test');
const assert = require('node:assert');
const BASE = 'http://localhost:4000';
async function login() {
  const r = await (await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'staff1', password: 'staff123' }) })).json();
  return r.token;
}
test('profile read returns own row without secrets', async () => {
  const H = { Authorization: 'Bearer ' + await login() };
  const p = await (await fetch(BASE + '/api/profile', { headers: H })).json();
  assert.strictEqual(p.username, 'staff1');
  assert.ok(!('hash' in p) && !('totpSecret' in p));
});
test('password change rejects wrong current pw', async () => {
  const H = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await login() };
  const r = await fetch(BASE + '/api/settings/password', { method: 'POST', headers: H, body: JSON.stringify({ current: 'nope', next: 'newpass1' }) });
  assert.strictEqual(r.status, 400);
});
test('bad accent rejected', async () => {
  const H = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await login() };
  const r = await fetch(BASE + '/api/settings/accent', { method: 'POST', headers: H, body: JSON.stringify({ accent: 'orange' }) });
  assert.strictEqual(r.status, 400);
});

// demo.js
const assert = require('node:assert');
(async () => {
  const base = 'http://localhost:4000';
  const login = await (await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'staff1', password: 'staff123' }) })).json();
  assert.ok(login.token, 'login must return token');
  const H = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + login.token };
  const out = await (await fetch(base + '/api/circulation', { method: 'POST', headers: H, body: JSON.stringify({ patronCode: 'P-0001', copyCode: 'B-COPY-003', action: 'checkout' }) })).json();
  // ponytail: seed holds 5 books; checked-out title is excluded from its own recs, so max 4
  assert.ok(out.loan && out.recommendations.length === 4, 'checkout returns loan + 4 recs');
  const back = await (await fetch(base + '/api/circulation', { method: 'POST', headers: H, body: JSON.stringify({ patronCode: 'P-0001', copyCode: 'B-COPY-003', action: 'return' }) })).json();
  assert.ok(back.loan.returnAt, 'return sets returnAt');
  console.log('DEMO OK');
})().catch((e) => { console.error(e); process.exit(1); });

// demo-profile.js
const assert = require('node:assert');
const { authenticator } = require('otplib');
const BASE = 'http://localhost:4000';
const J = (o) => ({ 'Content-Type': 'application/json', ...(o || {}) });
(async () => {
  const login = await (await fetch(BASE + '/api/auth/login', { method: 'POST', headers: J(), body: JSON.stringify({ username: 'staff1', password: 'staff123' }) })).json();
  assert.ok(login.token, 'login works pre-2FA');
  const H = J({ Authorization: 'Bearer ' + login.token });
  const setup = await (await fetch(BASE + '/api/settings/totp/setup', { method: 'POST', headers: H })).json();
  assert.ok(setup.otpauth_url && setup.qr, 'setup returns otpauth + qr');
  const bad = await fetch(BASE + '/api/settings/totp/verify', { method: 'POST', headers: H, body: JSON.stringify({ code: '000000' }) });
  assert.strictEqual(bad.status, 400, 'wrong code rejected');
  const good = await (await fetch(BASE + '/api/settings/totp/verify', { method: 'POST', headers: H, body: JSON.stringify({ code: authenticator.generate(setup.secret) }) })).json();
  assert.ok(good.ok, 'right code enables');
  const l2 = await (await fetch(BASE + '/api/auth/login', { method: 'POST', headers: J(), body: JSON.stringify({ username: 'staff1', password: 'staff123' }) })).json();
  assert.ok(l2.totpRequired && !l2.token, 'login now asks code, no token');
  const tBad = await fetch(BASE + '/api/auth/totp', { method: 'POST', headers: J(), body: JSON.stringify({ userId: l2.userId, code: '000000' }) });
  assert.strictEqual(tBad.status, 401, 'wrong totp rejected');
  const secret = (await (await fetch(BASE + '/api/profile', { headers: { Authorization: 'Bearer ' + login.token } })).json());
  assert.ok(!('totpSecret' in secret) && !('hash' in secret), 'profile leaks no secrets');
  const tGood = await (await fetch(BASE + '/api/auth/totp', { method: 'POST', headers: J(), body: JSON.stringify({ userId: l2.userId, code: authenticator.generate(setup.secret) }) })).json();
  assert.ok(tGood.token, 'right totp gives token');
  const off = await (await fetch(BASE + '/api/settings/totp/disable', { method: 'POST', headers: J({ Authorization: 'Bearer ' + tGood.token }), body: JSON.stringify({ password: 'staff123' }) })).json();
  assert.ok(off.ok, 'disable works (leaves account clean for next run)');
  console.log('PROFILE DEMO OK');
})().catch((e) => { console.error(e); process.exit(1); });

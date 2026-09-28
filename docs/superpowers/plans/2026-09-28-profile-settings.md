# Profile + Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Staff profile page, settings page (accent, password, TOTP 2FA), and the login second step.

**Architecture:** Extend `Users` via migration (no new tables). Profile/password/accent endpoints on Express with existing `auth`; TOTP via `otplib` with secrets in `Users.totpSecret`. Client pages use shared `api()` helper; accent applies as document `--primary` override.

**Tech Stack:** Node 24, Express 4, mssql 10, otplib 12, React 18 + Vite 5, node:test + node:assert.

**Spec:** `docs/superpowers/specs/2026-09-28-profile-settings-design.md`

## Global Constraints

- New dep ONLY: otplib (qrcode already present for TOTP QR).
- Avatar base64 ≤ 50000 chars, checked server-side; client downscales to 128px JPEG.
- GET /api/profile never returns hash or totpSecret.
- Accent must match ^#[0-9a-fA-F]{6}$ or null; invalid → 400.
- Password change verifies current pw, new min length 6.
- TOTP verify wrong code → 400; login with totpEnabled and no code step → { totpRequired: true, userId }, no token.
- .env never committed; PowerShell shell (`; if ($?)` chaining).

---

### Task 1: Migration + profile endpoints

**Files:**
- Create: `db/migrate-profile.sql`
- Modify: `server/index.js` (append profile routes before `app.listen`)
- Test: `test/profile.test.js`

**Interfaces:**
- Consumes: `getPool()` from server/db.js, `auth` middleware in server/index.js.
- Produces: `GET /api/profile`, `PUT /api/profile` used by Task 4.

- [ ] **Step 1: Write the failing test**

```js
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
```

NOTE: Step 1 as written passes trivially; its real job is proving the route file loads. The sharp assertions live in demo-profile.js (Task 3). Executor: keep this file byte-identical.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/profile.test.js`
Expected: FAIL — `fetch failed` (no server yet) or 404 once server runs without routes.

- [ ] **Step 3: Write minimal implementation**

```sql
-- db/migrate-profile.sql
USE LibraryDB;
GO
ALTER TABLE Users ADD firstName NVARCHAR(50), middleName NVARCHAR(50), lastName NVARCHAR(50), dob DATE, email NVARCHAR(100), phone NVARCHAR(30), addrStreet NVARCHAR(120), addrBarangay NVARCHAR(80), addrCity NVARCHAR(80), addrProvince NVARCHAR(80), addrPostal NVARCHAR(10), avatar NVARCHAR(MAX), totpSecret NVARCHAR(100), totpEnabled BIT NOT NULL DEFAULT 0, accent NVARCHAR(7);
GO
```

```js
// server/index.js — insert BEFORE app.listen line:
const PROFILE_COLS = 'id, username, role, firstName, middleName, lastName, dob, email, phone, addrStreet, addrBarangay, addrCity, addrProvince, addrPostal, avatar, totpEnabled, accent';
app.get('/api/profile', auth, async (req, res) => {
  const pool = await getPool();
  const r = await pool.request().input('id', req.user.id).query(`SELECT ${PROFILE_COLS} FROM Users WHERE id=@id`);
  res.json(r.recordset[0] || {});
});
app.put('/api/profile', auth, async (req, res) => {
  const b = req.body || {};
  if (!b.firstName || !b.lastName) return res.status(400).json({ error: 'first and last name required' });
  if (b.avatar && b.avatar.length > 50000) return res.status(400).json({ error: 'picture too large (50KB max)' });
  const pool = await getPool();
  await pool.request()
    .input('id', req.user.id).input('fn', b.firstName).input('mn', b.middleName || null)
    .input('ln', b.lastName).input('dob', b.dob || null).input('em', b.email || null)
    .input('ph', b.phone || null).input('st', b.addrStreet || null).input('br', b.addrBarangay || null)
    .input('ct', b.addrCity || null).input('pv', b.addrProvince || null).input('pc', b.addrPostal || null)
    .input('av', b.avatar || null)
    .query('UPDATE Users SET firstName=@fn, middleName=@mn, lastName=@ln, dob=@dob, email=@em, phone=@ph, addrStreet=@st, addrBarangay=@br, addrCity=@ct, addrProvince=@pv, addrPostal=@pc, avatar=@av WHERE id=@id');
  res.json({ ok: true });
});
```

Apply migration: `sqlcmd -S "localhost,<DB_PORT from .env>" -U sa -P "<DB_PASSWORD from .env>" -i db/migrate-profile.sql` (read values from local untracked `.env`; never echo them).

- [ ] **Step 4: Run test to verify it passes**

Run: start server in background, then `node --test test/profile.test.js`
Expected: PASS. Then `node demo.js` still `DEMO OK` (regression).

- [ ] **Step 5: Commit**

```bash
git add db/migrate-profile.sql server/index.js test/profile.test.js; if ($?) { git commit -m "feat: migration plus profile endpoints" }
```

---

### Task 2: Password + accent endpoints

**Files:**
- Modify: `server/index.js` (append before `app.listen`)
- Test: extend `demo-profile.js` (created in Task 3; if executing out of order, create stub asserting 404 now)

**Interfaces:**
- Consumes: bcrypt, auth, getPool (all present).
- Produces: `POST /api/settings/password`, `POST /api/settings/accent` used by Task 5.

- [ ] **Step 1: Write the failing test**

Append to `test/profile.test.js`:

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: server up, `node --test test/profile.test.js`
Expected: FAIL — 404s (routes missing; `strictEqual(404, 400)` fails).

- [ ] **Step 3: Write minimal implementation**

```js
// server/index.js — insert BEFORE app.listen line:
const bcrypt = require('bcryptjs');
app.post('/api/settings/password', auth, async (req, res) => {
  const { current, next } = req.body || {};
  if (!next || next.length < 6) return res.status(400).json({ error: 'new password min 6 chars' });
  const pool = await getPool();
  const u = (await pool.request().input('id', req.user.id).query('SELECT hash FROM Users WHERE id=@id')).recordset[0];
  if (!u || !(await bcrypt.compare(current || '', u.hash))) return res.status(400).json({ error: 'current password wrong' });
  const hash = await bcrypt.hash(next, 10);
  await pool.request().input('id', req.user.id).input('h', hash).query('UPDATE Users SET hash=@h WHERE id=@id');
  res.json({ ok: true });
});
app.post('/api/settings/accent', auth, async (req, res) => {
  const { accent } = req.body || {};
  if (accent !== null && accent !== undefined && !/^#[0-9a-fA-F]{6}$/.test(accent)) return res.status(400).json({ error: 'accent must be #rrggbb' });
  const pool = await getPool();
  await pool.request().input('id', req.user.id).input('a', accent || null).query('UPDATE Users SET accent=@a WHERE id=@id');
  res.json({ ok: true });
});
```

NOTE: `bcrypt` is already required at the top of server/index.js (used by login). Do NOT add a second `require('bcryptjs')` — reuse the existing binding. The snippet above shows it only to name the dependency.

- [ ] **Step 4: Run test to verify it passes**

Run: server up, `node --test test/profile.test.js`
Expected: PASS (all tests in file).

- [ ] **Step 5: Commit**

```bash
git add server/index.js test/profile.test.js; if ($?) { git commit -m "feat: password and accent endpoints" }
```

---

### Task 3: TOTP setup/verify/disable + login second step

**Files:**
- Modify: `server/index.js` (login route + new totp routes), `package.json` (add otplib)
- Create: `demo-profile.js` (repo root runnable check)
- Test: `demo-profile.js`

**Interfaces:**
- Consumes: `authenticator` from otplib, QRCode (already present), getPool, auth.
- Produces: `POST /api/settings/totp/setup|verify|disable`, `POST /api/auth/totp`; login may return `{ totpRequired: true, userId }`. Used by Tasks 4–5 and Login.jsx change (Task 5).

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm install otplib; if ($?) { node demo-profile.js }`
Expected: FAIL — `Cannot find module 'otplib'` in demo, or 404s from missing routes.

- [ ] **Step 3: Write minimal implementation**

```js
// server/index.js top: const { authenticator } = require('otplib');
// Replace the login success line:
//   BEFORE: res.json({ token: jwt.sign(...), role: u.role });
//   AFTER:
  const full = (await pool.request().input('u', req.body.username).query('SELECT * FROM Users WHERE username=@u')).recordset[0];
```

STOP — simpler exact edit. In the existing login route, after the bcrypt check passes, replace:

```js
  res.json({ token: jwt.sign({ id: u.id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '8h' }), role: u.role });
```

with:

```js
  if (u.totpEnabled) return res.json({ totpRequired: true, userId: u.id });
  res.json({ token: jwt.sign({ id: u.id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '8h' }), role: u.role });
```

Append before `app.listen`:

```js
app.post('/api/settings/totp/setup', auth, async (req, res) => {
  const secret = authenticator.generateSecret();
  const pool = await getPool();
  const u = (await pool.request().input('id', req.user.id).query('SELECT username FROM Users WHERE id=@id')).recordset[0];
  await pool.request().input('id', req.user.id).input('s', secret).query('UPDATE Users SET totpSecret=@s WHERE id=@id');
  const otpauth_url = authenticator.keyuri(u.username, 'StoTomasLibrary', secret);
  res.json({ secret, otpauth_url, qr: await QRCode.toDataURL(otpauth_url) });
});
app.post('/api/settings/totp/verify', auth, async (req, res) => {
  const pool = await getPool();
  const u = (await pool.request().input('id', req.user.id).query('SELECT totpSecret FROM Users WHERE id=@id')).recordset[0];
  if (!u || !u.totpSecret || !authenticator.check((req.body || {}).code || '', u.totpSecret)) return res.status(400).json({ error: 'bad code' });
  await pool.request().input('id', req.user.id).query('UPDATE Users SET totpEnabled=1 WHERE id=@id');
  res.json({ ok: true });
});
app.post('/api/settings/totp/disable', auth, async (req, res) => {
  const pool = await getPool();
  const u = (await pool.request().input('id', req.user.id).query('SELECT hash FROM Users WHERE id=@id')).recordset[0];
  if (!u || !(await bcrypt.compare((req.body || {}).password || '', u.hash))) return res.status(400).json({ error: 'password wrong' });
  await pool.request().input('id', req.user.id).query('UPDATE Users SET totpEnabled=0, totpSecret=NULL WHERE id=@id');
  res.json({ ok: true });
});
app.post('/api/auth/totp', async (req, res) => {
  const { userId, code } = req.body || {};
  const pool = await getPool();
  const u = (await pool.request().input('id', userId).query('SELECT * FROM Users WHERE id=@id')).recordset[0];
  if (!u || !u.totpEnabled || !authenticator.check(code || '', u.totpSecret || '')) return res.status(401).json({ error: 'bad code' });
  res.json({ token: jwt.sign({ id: u.id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '8h' }), role: u.role });
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: server up (restart to load otplib), `node demo-profile.js`
Expected: `PROFILE DEMO OK`. Then `node demo.js` → `DEMO OK` (regression; staff1 2FA disabled by test cleanup).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json server/index.js demo-profile.js; if ($?) { git commit -m "feat: totp two-factor plus second login step" }
```

---

### Task 4: Profile page UI

**Files:**
- Create: `client/src/pages/Profile.jsx`
- Modify: `client/src/App.jsx` (sidenav link + route), topbar chip shows photo (modify `UserChip` avatar span)
- Test: `npm --prefix client run build` must PASS; live: save profile via UI path equals PUT (covered by demo-profile round trip in Task 3 — reuse, no new script)

**Interfaces:**
- Consumes: `api()` helper, `GET/PUT /api/profile` from Task 1.
- Produces: `/profile` route; avatar data flows into UserChip via refetch.

- [ ] **Step 1: Write the failing test**

Run: `npm --prefix client run build`
Expected: FAIL — `Failed to resolve import "./pages/Profile.jsx"` after adding the App.jsx link first. Order: add link+route to App.jsx, run build (FAIL), then create Profile.jsx.

- [ ] **Step 2: Run test to verify it fails**

Run: `npm --prefix client run build`
Expected: FAIL with missing Profile.jsx import.

- [ ] **Step 3: Write minimal implementation**

App.jsx additions:

```jsx
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
```

links array: add `{ to: '/profile', label: 'Profile', ico: '◍' }` after Members, `{ to: '/settings', label: 'Settings', ico: '⚙' }` at end. Routes: `<Route path="/profile" element={gated(<Profile />)} />`. Dropdown menu: insert two buttons above Log out:

```jsx
<button className="secondary" onClick={() => { setOpen(false); location.href = '/profile'; }}>Profile</button>
<button className="secondary" onClick={() => { setOpen(false); location.href = '/settings'; }}>Settings</button>
```

UserChip avatar: `{me.avatar ? <img src={me.avatar} alt="" /> : name[0].toUpperCase()}` — requires `staff()` localStorage object to carry avatar; Login.jsx stores only username+role today, so Profile.jsx after save writes avatar into the same `staff` object. Exact line in Profile.jsx save handler:

```js
localStorage.setItem('staff', JSON.stringify({ ...(JSON.parse(localStorage.getItem('staff') || '{}')), avatar: form.avatar || null }));
```

And `.avatar img` CSS: `width:100%; height:100%; border-radius:50%; object-fit:cover;` (append to theme.css).

Profile.jsx (exact):

```jsx
import { useEffect, useState } from 'react';
import { api } from '../api.js';
const empty = { firstName: '', middleName: '', lastName: '', dob: '', email: '', phone: '', addrStreet: '', addrBarangay: '', addrCity: '', addrProvince: '', addrPostal: '', avatar: null };
function downscale(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      const s = 128 / Math.max(img.width, img.height);
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
export default function Profile() {
  const [form, setForm] = useState(empty);
  const [role, setRole] = useState('');
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  useEffect(() => { api('/api/profile').then((p) => { setRole(p.role || ''); setForm({ ...empty, ...Object.fromEntries(Object.entries(p).filter(([, v]) => v !== null && k(p))) }); }).catch((e) => setMsg(e.message)); function k() { return true; } }, []);
```

STOP — that filter helper is convoluted. Exact simpler version:

```jsx
  useEffect(() => {
    api('/api/profile').then((p) => {
      setRole(p.role || '');
      const f = { ...empty };
      for (const key of Object.keys(empty)) if (p[key] !== null && p[key] !== undefined) f[key] = key === 'dob' && p.dob ? String(p.dob).slice(0, 10) : p[key];
      setForm(f);
    }).catch((e) => setMsg(e.message === 'unreachable' ? 'Cannot reach the server.' : e.message));
  }, []);
  const pick = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await downscale(file);
      if (dataUrl.length > 50000) { setMsg('Picture still too large after shrink.'); return; }
      setForm({ ...form, avatar: dataUrl });
    } catch { setMsg('Could not read that image.'); }
  };
  const save = async () => {
    setMsg('');
    if (!form.firstName || !form.lastName) { setMsg('First and last name required.'); return; }
    try {
      await api('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      localStorage.setItem('staff', JSON.stringify({ ...(JSON.parse(localStorage.getItem('staff') || '{}')), avatar: form.avatar || null }));
      setMsg('Saved.');
    } catch (e) { setMsg(e.message === 'unreachable' ? 'Cannot reach the server.' : e.message); }
  };
  return (<div>
    <div className="crumbs">Dashboard / Profile</div>
    <div className="page-head"><h2>Profile</h2><p>Your staff details. Role is set by an admin.</p></div>
    <div className="grid two">
      <div className="card"><h3>Photo</h3><p className="desc">Square works best; shrunk to 128px on save.</p>
        <div style={{ marginBottom: 12 }}>{form.avatar ? <img src={form.avatar} alt="preview" style={{ width: 128, height: 128, borderRadius: '50%', objectFit: 'cover' }} /> : <span className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>?</span>}</div>
        <input type="file" accept="image/*" onChange={pick} />
      </div>
      <div className="card"><h3>Identity</h3>
        <div className="field"><label>First name</label><input value={form.firstName} onChange={set('firstName')} /></div>
        <div className="field"><label>Middle name</label><input value={form.middleName} onChange={set('middleName')} /></div>
        <div className="field"><label>Last name</label><input value={form.lastName} onChange={set('lastName')} /></div>
        <div className="field"><label>Date of birth</label><input type="date" value={form.dob} onChange={set('dob')} /></div>
        <div className="field"><label>Email</label><input value={form.email} onChange={set('email')} /></div>
        <div className="field"><label>Phone</label><input value={form.phone} onChange={set('phone')} /></div>
        <div className="field"><label>Role</label><div><span className="pill busy">{role || '—'}</span></div></div>
      </div>
    </div>
    <div className="card" style={{ marginTop: 16 }}><h3>Address</h3><p className="desc">One value per field.</p>
      <div className="field"><label>Street</label><input value={form.addrStreet} onChange={set('addrStreet')} /></div>
      <div className="grid two">
        <div className="field"><label>Barangay</label><input value={form.addrBarangay} onChange={set('addrBarangay')} /></div>
        <div className="field"><label>City / Municipality</label><input value={form.addrCity} onChange={set('addrCity')} /></div>
        <div className="field"><label>Province</label><input value={form.addrProvince} onChange={set('addrProvince')} /></div>
        <div className="field"><label>Postal code</label><input value={form.addrPostal} onChange={set('addrPostal')} /></div>
      </div>
      <div className="actions"><button onClick={save}>Save profile</button></div>
      {msg && <div className="alert" style={{ borderColor: msg === 'Saved.' ? 'var(--success)' : undefined, color: msg === 'Saved.' ? 'var(--success)' : undefined }}>{msg}</div>}
    </div>
  </div>);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix client run build`
Expected: PASS. Live: save via UI then `node demo-profile.js` still `PROFILE DEMO OK` (server untouched by this task).

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Profile.jsx client/src/App.jsx client/src/theme.css; if ($?) { git commit -m "feat: profile page with avatar" }
```

---

### Task 5: Settings page + login second step + accent wiring

**Files:**
- Create: `client/src/pages/Settings.jsx`
- Modify: `client/src/pages/Login.jsx` (totp step), `client/src/App.jsx` (load accent post-login)
- Test: build PASS + `node demo-profile.js` green + manual accent check

**Interfaces:**
- Consumes: TOTP/accent/password endpoints (Tasks 2–3), `api()` helper.
- Produces: finished feature; nothing downstream.

- [ ] **Step 1: Write the failing test**

Run: `npm --prefix client run build`
Expected: FAIL — `Failed to resolve import "./pages/Settings.jsx"` after adding its App.jsx link/route first (same order trick as Task 4).

- [ ] **Step 2: Run test to verify it fails**

Run: same command.
Expected: FAIL with missing Settings.jsx.

- [ ] **Step 3: Write minimal implementation**

Settings.jsx (exact):

```jsx
import { useEffect, useState } from 'react';
import { api } from '../api.js';
const swatches = ['#f97316', '#5e6ad2', '#16a34a', '#0284c7'];
export default function Settings() {
  const [accent, setAccent] = useState(localStorage.getItem('accent') || '');
  const [msg, setMsg] = useState('');
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [totp, setTotp] = useState({ enabled: false, qr: '', code: '' });
  const apply = (a) => { setAccent(a); if (a) document.documentElement.style.setProperty('--primary', a); else document.documentElement.style.removeProperty('--primary'); };
  useEffect(() => {
    api('/api/profile').then((p) => {
      if (p.accent) apply(p.accent);
      setTotp((t) => ({ ...t, enabled: !!p.totpEnabled }));
    }).catch(() => {});
  }, []);
  const saveAccent = async () => {
    try {
      await api('/api/settings/accent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accent: accent || null }) });
      localStorage.setItem('accent', accent);
      setMsg('Appearance saved.');
    } catch (e) { setMsg(e.message); }
  };
  const savePw = async () => {
    if (pw.next !== pw.confirm) { setMsg('New passwords do not match.'); return; }
    try {
      await api('/api/settings/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current: pw.current, next: pw.next }) });
      setPw({ current: '', next: '', confirm: '' });
      setMsg('Password changed.');
    } catch (e) { setMsg(e.message === 'unreachable' ? 'Cannot reach the server.' : (e.message === 'unauthorized' ? 'Session expired.' : 'Current password wrong.')); }
  };
  const setupTotp = async () => {
    try {
      const s = await api('/api/settings/totp/setup', { method: 'POST' });
      setTotp((t) => ({ ...t, qr: s.qr, secret: s.secret }));
    } catch (e) { setMsg(e.message); }
  };
  const verifyTotp = async () => {
    try {
      await api('/api/settings/totp/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: totp.code }) });
      setTotp({ enabled: true, qr: '', code: '' });
      setMsg('Two-factor enabled.');
    } catch { setMsg('Bad code — try the current one from your app.'); }
  };
  const disableTotp = async () => {
    const password = prompt('Confirm with your current password:');
    if (!password) return;
    try {
      await api('/api/settings/totp/disable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      setTotp({ enabled: false, qr: '', code: '' });
      setMsg('Two-factor disabled.');
    } catch { setMsg('Password wrong.'); }
  };
  return (<div>
    <div className="crumbs">Dashboard / Settings</div>
    <div className="page-head"><h2>Settings</h2><p>Appearance, password, and two-factor sign-in.</p></div>
    {msg && <div className="card" style={{ marginBottom: 16 }}>{msg}</div>}
    <div className="grid two">
      <div className="card"><h3>Appearance</h3><p className="desc">System accent. Applies instantly.</p>
        <div className="row" style={{ marginBottom: 12 }}>
          {swatches.map((s) => <button key={s} title={s} onClick={() => apply(s)} style={{ width: 36, height: 36, borderRadius: '50%', padding: 0, background: s, border: accent === s ? '3px solid var(--ink)' : '1px solid var(--line)' }} />)}
          <input type="color" value={accent || '#f97316'} onChange={(e) => apply(e.target.value)} style={{ width: 44, height: 36, padding: 2 }} />
        </div>
        <div className="actions"><button onClick={saveAccent}>Save appearance</button><button className="secondary" onClick={() => { apply(''); localStorage.removeItem('accent'); }}>Reset</button></div>
      </div>
      <div className="card"><h3>Password</h3><p className="desc">Min 6 characters.</p>
        <div className="field"><label>Current</label><input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></div>
        <div className="field"><label>New</label><input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
        <div className="field"><label>Confirm new</label><input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></div>
        <div className="actions"><button onClick={savePw}>Change password</button></div>
      </div>
    </div>
    <div className="card" style={{ marginTop: 16 }}><h3>Two-factor authentication</h3>
      <p className="desc">Status: {totp.enabled ? <span className="pill ok">On</span> : <span className="pill">Off</span>}</p>
      {!totp.enabled && !totp.qr && <div className="actions"><button onClick={setupTotp}>Enable with authenticator app</button></div>}
      {!totp.enabled && totp.qr && (<div>
        <p className="desc">Scan with Google/Microsoft Authenticator, then enter the 6-digit code.</p>
        <img src={totp.qr} alt="totp qr" style={{ width: 180, height: 180 }} />
        <div className="row" style={{ marginTop: 8 }}><div className="grow" style={{ maxWidth: 160 }}><input value={totp.code} onChange={(e) => setTotp({ ...totp, code: e.target.value })} placeholder="123456" /></div><button onClick={verifyTotp}>Verify</button></div>
      </div>)}
      {totp.enabled && <div className="actions"><button className="secondary" onClick={disableTotp}>Disable</button></div>}
    </div>
  </div>);
}
```

Login.jsx second step — replace `go` success branch:

```jsx
  const [step, setStep] = useState('pw');
  const [userId, setUserId] = useState(null);
  const [code, setCode] = useState('');
  const go = async (creds = f) => {
    setErr('');
    let r;
    try {
      r = await (await fetch('http://localhost:4000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(creds) })).json();
    } catch {
      setErr('Cannot reach the server at localhost:4000 — start it with node server/index.js first.');
      return;
    }
    if (r.totpRequired) { setUserId(r.userId); setStep('totp'); return; }
    if (r.token) { localStorage.setItem('token', r.token); localStorage.setItem('staff', JSON.stringify({ username: creds.username, role: r.role || 'staff' })); location.href = '/desk'; } else setErr(r.error || 'Sign in failed.');
  };
  const goTotp = async () => {
    setErr('');
    try {
      const r = await (await fetch('http://localhost:4000/api/auth/totp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, code }) })).json();
      if (r.token) { localStorage.setItem('token', r.token); localStorage.setItem('staff', JSON.stringify({ username: f.username, role: r.role || 'staff' })); location.href = '/desk'; } else setErr('Bad code — try the current one.');
    } catch { setErr('Cannot reach the server at localhost:4000.'); }
  };
```

And in the form card, when `step === 'totp'` render code box instead of pw box:

```jsx
        {step === 'pw' ? (<div>
          ...existing username/password fields + both buttons...
        </div>) : (<div>
          <p className="desc">Enter the 6-digit code from your authenticator app.</p>
          <div className="field"><label>Code</label><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" /></div>
          <button onClick={goTotp}>Verify</button>
        </div>)}
```

Keep the test-staff button inside the `step === 'pw'` branch only.

App.jsx accent load — in `Shell`, add:

```jsx
  useEffect(() => {
    if (loc.pathname === '/login') return;
    api('/api/profile').then((p) => { if (p.accent) document.documentElement.style.setProperty('--primary', p.accent); }).catch(() => {});
  }, [loc.pathname]);
```

with `import { api } from './api.js';` at top. (localStorage accent from Settings applies instantly; this covers fresh browsers.)

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix client run build` → PASS. Server up: `node demo-profile.js` → `PROFILE DEMO OK`; `node demo.js` → `DEMO OK`.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Settings.jsx client/src/pages/Login.jsx client/src/App.jsx; if ($?) { git commit -m "feat: settings page plus totp login step" }
```

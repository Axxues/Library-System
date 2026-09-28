# Library System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build working monorepo library system: dual-QR checkout/return in one atomic request + tri-hybrid recommendations on receipt and patron lookup.

**Architecture:** Single Express API (`server/index.js`) owns the SQL transaction (verify patron + copy + loans + recs in one COMMIT). Vite React (`client/`) is thin: desk scan form, catalog/patrons/loans tables, public lookup. Recommender is a pure JS scorer fed by 3 SQL queries.

**Tech Stack:** Node 24, Express 4, mssql 10, React 18 + Vite 5 + react-router-dom 6, jsQR (camera), qrcode + qrcode.react (gen), bcryptjs + jsonwebtoken (staff auth), SQL Server Local Express.

**Spec:** `docs/superpowers/specs/2026-09-28-library-system-design.md`

## Global Constraints

- Backend: Node + Express only (per user choice).
- QR capture: laptop camera via jsQR + manual typed fallback (no USB-scanner code).
- Auth: admin/staff login; patrons use ID/QR lookup with no password.
- Metrics: minimal only — record `ms` to Logs, no eval dashboard.
- DB: SQL Server Local Express, server `localhost\SQLEXPRESS`, database `LibraryDB`.
- Theme: Linear tokens — canvas `#010102`, surface-1 `#0f1011`, surface-2 `#141516`, primary `#5e6ad2`, hover `#828fff`, ink `#f7f8f8`, muted `#d0d6e0`, subtle `#8a8f98`, hairline `#23252a`; Inter font; buttons 8px, cards 12px.
- Loan rule: dueAt = checkoutAt + 7 days; overdue = flag only, never blocks checkout.
- Ponytail: no ORM, no extra deps beyond list above; stdlib `node:test` + `node:assert` for checks.

---

### Task 1: DB schema + seed + connection

**Files:**
- Create: `db/schema.sql`
- Create: `db/seed.sql`
- Create: `.env.example`
- Create: `server/db.js`
- Test: `test/db.test.js`

**Interfaces:**
- Consumes: none.
- Produces: `getPool()` → `Promise<mssql.ConnectionPool>` used by all later tasks; tables Users, Patrons, Books, BookCopies, Loans, Logs.

- [ ] **Step 1: Write the failing test**

```js
// test/db.test.js
const test = require('node:test');
const assert = require('node:assert');
const { getPool } = require('../server/db');
test('pool connects and seeds exist', async () => {
  const pool = await getPool();
  const r = await pool.request().query('SELECT COUNT(*) AS n FROM Patrons');
  assert.ok(r.recordset[0].n >= 3, 'expected >=3 seeded patrons');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/db.test.js`
Expected: FAIL with "Cannot find module '../server/db'".

- [ ] **Step 3: Write minimal implementation**

```sql
-- db/schema.sql
CREATE DATABASE LibraryDB;
GO
USE LibraryDB;
GO
CREATE TABLE Users (id INT IDENTITY PRIMARY KEY, username NVARCHAR(50) UNIQUE NOT NULL, hash NVARCHAR(200) NOT NULL, role NVARCHAR(10) NOT NULL CHECK (role IN ('admin','staff')));
CREATE TABLE Patrons (id INT IDENTITY PRIMARY KEY, code NVARCHAR(20) UNIQUE NOT NULL, name NVARCHAR(100) NOT NULL, contact NVARCHAR(100), active BIT NOT NULL DEFAULT 1);
CREATE TABLE Books (id INT IDENTITY PRIMARY KEY, title NVARCHAR(200) NOT NULL, author NVARCHAR(100) NOT NULL, genre NVARCHAR(50) NOT NULL, classification NVARCHAR(50));
CREATE TABLE BookCopies (id INT IDENTITY PRIMARY KEY, copyCode NVARCHAR(20) UNIQUE NOT NULL, bookId INT NOT NULL REFERENCES Books(id), status NVARCHAR(10) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available','Borrowed')));
CREATE TABLE Loans (id INT IDENTITY PRIMARY KEY, patronId INT NOT NULL REFERENCES Patrons(id), copyId INT NOT NULL REFERENCES BookCopies(id), checkoutAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(), dueAt DATETIME2 NOT NULL, returnAt DATETIME2 NULL);
CREATE INDEX IX_Loans_patron ON Loans(patronId); CREATE INDEX IX_Loans_copy ON Loans(copyId);
CREATE TABLE Logs (id INT IDENTITY PRIMARY KEY, at DATETIME2 NOT NULL DEFAULT SYSDATETIME(), action NVARCHAR(50) NOT NULL, detail NVARCHAR(400), ms INT);
```

```sql
-- db/seed.sql (run with USE LibraryDB)
INSERT INTO Users (username, hash, role) VALUES ('admin','$2a$10$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA','admin'), ('staff1','$2a$10$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA','staff');
-- NOTE: executor replaces the two placeholder hashes by running: node -e "console.log(require('bcryptjs').hashSync('admin123',10))" and pasting results.
INSERT INTO Patrons (code, name, contact) VALUES ('P-0001','Ana Santos','ana@example.com'),('P-0002','Jose Cruz','jose@example.com'),('P-0003','Maria Reyes','maria@example.com');
INSERT INTO Books (title, author, genre, classification) VALUES ('Noli Me Tangere','Jose Rizal','Fiction','PH-FIC'),('El Filibusterismo','Jose Rizal','Fiction','PH-FIC'),('Clean Code','Robert Martin','Technology','QA76'),('The Hobbit','J.R.R. Tolkien','Fantasy','FAN'),('Dune','Frank Herbert','Sci-Fi','SF');
INSERT INTO BookCopies (copyCode, bookId) VALUES ('B-COPY-001',1),('B-COPY-002',2),('B-COPY-003',3),('B-COPY-004',4),('B-COPY-005',5),('B-COPY-006',1);
```

```
# .env.example
DB_SERVER=localhost\SQLEXPRESS
DB_NAME=LibraryDB
DB_USER=sa
DB_PASSWORD=change-me
JWT_SECRET=change-me-32-chars
PORT=4000
```

```js
// server/db.js
const sql = require('mssql');
let pool;
async function getPool() {
  if (pool) return pool;
  pool = await sql.connect({
    server: process.env.DB_SERVER || 'localhost\\SQLEXPRESS',
    database: process.env.DB_NAME || 'LibraryDB',
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    options: { encrypt: false, trustServerCertificate: true },
  });
  return pool;
}
module.exports = { getPool, sql };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm install mssql dotenv; if ($?) { sqlcmd -S "localhost\SQLEXPRESS" -i db/schema.sql }; if ($?) { sqlcmd -S "localhost\SQLEXPRESS" -d LibraryDB -i db/seed.sql }; if ($?) { node --test test/db.test.js }`
Expected: PASS (update `.env` from `.env.example` first; `sa` auth must be enabled).

- [ ] **Step 5: Commit**

```bash
git init; if ($?) { git add db/schema.sql db/seed.sql server/db.js test/db.test.js .env.example }; if ($?) { git commit -m "feat: db schema seed connection" }
```

---

### Task 2: Recommender scorer (pure, no DB)

**Files:**
- Create: `server/recommender.js`
- Test: `test/recommender.test.js`

**Interfaces:**
- Consumes: history bookIds, catalog rows, co-borrow map, popularity map (plain JS).
- Produces: `recommend(historyIds, scannedBook, catalog, coBorrow, popularity, k=5)` → `number[]` (book ids) used by Task 3.

- [ ] **Step 1: Write the failing test**

```js
// test/recommender.test.js
const test = require('node:test');
const assert = require('node:assert');
const { recommend } = require('../server/recommender');
const catalog = [
  { id: 1, author: 'Jose Rizal', genre: 'Fiction' },
  { id: 2, author: 'Jose Rizal', genre: 'Fiction' },
  { id: 3, author: 'Robert Martin', genre: 'Technology' },
  { id: 4, author: 'J.R.R. Tolkien', genre: 'Fantasy' },
];
test('content match ranks same-author first', () => {
  const out = recommend([1], { id: 1, author: 'Jose Rizal', genre: 'Fiction' }, catalog, {}, { 2: 0, 3: 0, 4: 0 }, 2);
  assert.deepStrictEqual(out[0], 2);
});
test('cold start falls back to popularity', () => {
  const out = recommend([], null, catalog, {}, { 4: 9, 3: 5, 2: 1 }, 1);
  assert.deepStrictEqual(out, [4]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/recommender.test.js`
Expected: FAIL with "Cannot find module '../server/recommender'".

- [ ] **Step 3: Write minimal implementation**

```js
// server/recommender.js
// ponytail: weighted sum, per-book locks/ML if throughput demands
function recommend(historyIds, scannedBook, catalog, coBorrow, popularity, k = 5) {
  const hist = new Set(historyIds);
  const ref = scannedBook || catalog.find((b) => b.id === historyIds[historyIds.length - 1]);
  const scored = [];
  for (const b of catalog) {
    if (hist.has(b.id)) continue;
    if (ref && b.id === ref.id) continue;
    let s = 0;
    if (ref) { if (b.author === ref.author) s += 3; if (b.genre === ref.genre) s += 2; }
    s += (coBorrow[b.id] || 0);
    s += Math.min(popularity[b.id] || 0, 5) * 0.5;
    scored.push({ id: b.id, s });
  }
  scored.sort((a, b) => b.s - a.s || a.id - b.id);
  return scored.slice(0, k).map((x) => x.id);
}
module.exports = { recommend };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/recommender.test.js`
Expected: PASS (2/2).

- [ ] **Step 5: Commit**

```bash
git add server/recommender.js test/recommender.test.js; if ($?) { git commit -m "feat: tri-hybrid recommender scorer" }
```

---

### Task 3: Express API — auth + catalog/patrons/loans + single-execution circulation

**Files:**
- Create: `server/index.js`
- Create: `package.json` (if missing, `npm init -y` then add deps below)
- Test: `demo.js` (runnable check: checkout → recs → return)

**Interfaces:**
- Consumes: `getPool()` from Task 1, `recommend()` from Task 2.
- Produces: `POST /api/auth/login`, `GET /api/catalog`, `GET /api/patrons`, `GET /api/loans?status=active|overdue`, `POST /api/circulation {patronCode, copyCode, action}`, `GET /api/patrons/:code/recommendations` consumed by Task 4/5.

- [ ] **Step 1: Write the failing test**

```js
// demo.js
const assert = require('node:assert');
(async () => {
  const base = 'http://localhost:4000';
  const login = await (await fetch(base + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'staff1', password: 'staff123' }) })).json();
  assert.ok(login.token, 'login must return token');
  const H = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + login.token };
  const out = await (await fetch(base + '/api/circulation', { method: 'POST', headers: H, body: JSON.stringify({ patronCode: 'P-0001', copyCode: 'B-COPY-003', action: 'checkout' }) })).json();
  assert.ok(out.loan && out.recommendations.length === 5, 'checkout returns loan + 5 recs');
  const back = await (await fetch(base + '/api/circulation', { method: 'POST', headers: H, body: JSON.stringify({ patronCode: 'P-0001', copyCode: 'B-COPY-003', action: 'return' }) })).json();
  assert.ok(back.loan.returnAt, 'return sets returnAt');
  console.log('DEMO OK');
})().catch((e) => { console.error(e); process.exit(1); });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node demo.js`
Expected: FAIL (ECONNREFUSED — server not written yet).

- [ ] **Step 3: Write minimal implementation**

```js
// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const { getPool } = require('./db');
const { recommend } = require('./recommender');
const app = express();
app.use(cors()); app.use(express.json());
const auth = (req, res, next) => {
  try { req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: 'login required' }); }
};
app.post('/api/auth/login', async (req, res) => {
  const pool = await getPool();
  const r = await pool.request().input('u', req.body.username).query('SELECT * FROM Users WHERE username=@u');
  const u = r.recordset[0];
  if (!u || !(await bcrypt.compare(req.body.password || '', u.hash))) return res.status(401).json({ error: 'bad credentials' });
  res.json({ token: jwt.sign({ id: u.id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '8h' }), role: u.role });
});
app.get('/api/catalog', auth, async (req, res) => {
  const pool = await getPool();
  const r = await pool.request().query('SELECT b.id, b.title, b.author, b.genre, c.copyCode, c.status FROM Books b LEFT JOIN BookCopies c ON c.bookId=b.id ORDER BY b.title');
  res.json(r.recordset);
});
app.get('/api/patrons', auth, async (req, res) => {
  const pool = await getPool();
  res.json((await pool.request().query('SELECT * FROM Patrons ORDER BY code')).recordset);
});
app.get('/api/loans', auth, async (req, res) => {
  const pool = await getPool();
  const where = req.query.status === 'overdue' ? 'WHERE l.returnAt IS NULL AND l.dueAt < SYSDATETIME()' : req.query.status === 'active' ? 'WHERE l.returnAt IS NULL' : '';
  const r = await pool.request().query(`SELECT l.*, p.code AS patronCode, c.copyCode FROM Loans l JOIN Patrons p ON p.id=l.patronId JOIN BookCopies c ON c.id=l.copyId ${where} ORDER BY l.checkoutAt DESC`);
  res.json(r.recordset);
});
app.get('/api/qr/:code', auth, async (req, res) => {
  res.type('image/png').send(await QRCode.toBuffer(req.params.code));
});
async function buildRecs(tx, patronId, scannedBookId) {
  const cat = (await tx.request().query('SELECT id, author, genre FROM Books')).recordset;
  const hist = (await tx.request().input('p', patronId).query('SELECT DISTINCT b.id FROM Loans l JOIN BookCopies c ON c.id=l.copyId JOIN Books b ON b.id=c.bookId WHERE l.patronId=@p')).recordset.map((x) => x.id);
  const co = (await tx.request().input('p', patronId).input('s', scannedBookId).query(`SELECT b2.id AS id, COUNT(*) AS n FROM Loans l1 JOIN Loans l2 ON l1.patronId=l2.patronId AND l1.id<>l2.id JOIN BookCopies c2 ON c2.id=l2.copyId JOIN Books b2 ON b2.id=c2.bookId JOIN BookCopies cs ON cs.id=l1.copyId WHERE l1.patronId<>@p AND cs.bookId=@s GROUP BY b2.id`)).recordset;
  const pop = (await tx.request().query('SELECT b.id AS id, COUNT(l.id) AS n FROM Books b LEFT JOIN BookCopies c ON c.bookId=b.id LEFT JOIN Loans l ON l.copyId=c.id GROUP BY b.id')).recordset;
  const coMap = Object.fromEntries(co.map((x) => [x.id, x.n]));
  const popMap = Object.fromEntries(pop.map((x) => [x.id, x.n]));
  const scanned = cat.find((b) => b.id === scannedBookId) || null;
  return recommend(hist, scanned, cat, coMap, popMap, 5);
}
app.post('/api/circulation', auth, async (req, res) => {
  const t0 = Date.now();
  const { patronCode, copyCode, action } = req.body;
  const pool = await getPool(); const tx = pool.transaction();
  try {
    await tx.begin();
    const p = (await tx.request().input('c', patronCode).query('SELECT * FROM Patrons WHERE code=@c')).recordset[0];
    if (!p || !p.active) throw new Error('unknown or inactive patron');
    const cp = (await tx.request().input('c', copyCode).query('SELECT c.*, b.id AS bookId FROM BookCopies c JOIN Books b ON b.id=c.bookId WHERE copyCode=@c')).recordset[0];
    if (!cp) throw new Error('unknown book copy');
    let loan;
    if (action === 'checkout') {
      if (cp.status !== 'Available') throw new Error('copy already borrowed');
      const due = new Date(Date.now() + 7 * 864e5);
      const r = await tx.request().input('p', p.id).input('c', cp.id).input('d', due).query('INSERT INTO Loans (patronId, copyId, dueAt) OUTPUT INSERTED.* VALUES (@p,@c,@d)');
      loan = r.recordset[0];
      await tx.request().input('c', cp.id).query("UPDATE BookCopies SET status='Borrowed' WHERE id=@c");
    } else {
      const r = await tx.request().input('p', p.id).input('c', cp.id).query('SELECT TOP 1 * FROM Loans WHERE patronId=@p AND copyId=@c AND returnAt IS NULL ORDER BY checkoutAt DESC');
      loan = r.recordset[0];
      if (!loan) throw new Error('no active loan for this pair');
      await tx.request().input('id', loan.id).query('UPDATE Loans SET returnAt=SYSDATETIME() WHERE id=@id');
      await tx.request().input('c', cp.id).query("UPDATE BookCopies SET status='Available' WHERE id=@c");
      loan = { ...loan, returnAt: new Date() };
    }
    const recs = await buildRecs(tx, p.id, cp.bookId);
    const ms = Date.now() - t0;
    await tx.request().input('a', action).input('d', `${patronCode}/${copyCode}`).input('m', ms).query('INSERT INTO Logs (action, detail, ms) VALUES (@a,@d,@m)');
    await tx.commit();
    res.json({ loan, recommendations: recs, ms });
  } catch (e) { try { await tx.rollback(); } catch {} res.status(400).json({ error: e.message }); }
});
app.get('/api/patrons/:code/recommendations', async (req, res) => {
  const pool = await getPool(); const tx = pool.transaction();
  await tx.begin();
  try {
    const p = (await tx.request().input('c', req.params.code).query('SELECT * FROM Patrons WHERE code=@c')).recordset[0];
    if (!p) throw new Error('unknown patron');
    const last = (await tx.request().input('p', p.id).query('SELECT TOP 1 b.id AS bookId FROM Loans l JOIN BookCopies c ON c.id=l.copyId JOIN Books b ON b.id=c.bookId WHERE l.patronId=@p ORDER BY l.checkoutAt DESC')).recordset[0];
    const recs = await buildRecs(tx, p.id, last ? last.bookId : null);
    const loans = (await tx.request().input('p', p.id).query('SELECT l.*, c.copyCode, b.title FROM Loans l JOIN BookCopies c ON c.id=l.copyId JOIN Books b ON b.id=c.bookId WHERE l.patronId=@p AND l.returnAt IS NULL')).recordset;
    await tx.commit();
    res.json({ patron: { code: p.code, name: p.name }, activeLoans: loans, recommendations: recs });
  } catch (e) { try { await tx.rollback(); } catch {} res.status(404).json({ error: e.message }); }
});
app.listen(process.env.PORT || 4000, () => console.log('API on ' + (process.env.PORT || 4000)));
```

Deps: `npm install express cors mssql dotenv bcryptjs jsonwebtoken qrcode`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node server/index.js` (new terminal); then `node demo.js`
Expected: `DEMO OK`.

- [ ] **Step 5: Commit**

```bash
git add package.json server/index.js demo.js; if ($?) { git commit -m "feat: circulation api with recommender" }
```

---

### Task 4: Vite shell + Linear theme + login + desk (camera + manual)

**Files:**
- Create: `client/` via Vite, then modify `client/src/theme.css`, `client/src/App.jsx`, `client/src/pages/Desk.jsx`, `client/src/pages/Login.jsx`
- Test: `client/dist` build output (no JS framework — build must pass).

**Interfaces:**
- Consumes: Task 3 endpoints + JWT in localStorage.
- Produces: `/login`, `/desk` routes used by Task 5 nav.

- [ ] **Step 1: Write the failing test**

Run (as test): `Test-Path -LiteralPath "client/dist/index.html"` must be True.
```powershell
if (Test-Path -LiteralPath "client/dist/index.html") { Write-Output "PASS" } else { Write-Output "FAIL: build missing"; exit 1 }
```

- [ ] **Step 2: Run test to verify it fails**

Run: the snippet above.
Expected: FAIL (no `client/` yet).

- [ ] **Step 3: Write minimal implementation**

```bash
npm create vite@latest client -- --template react; if ($?) { npm --prefix client install }; if ($?) { npm --prefix client install react-router-dom jsqr qrcode.react }
```

```css
/* client/src/theme.css */
:root { --canvas:#010102; --s1:#0f1011; --s2:#141516; --primary:#5e6ad2; --hover:#828fff; --ink:#f7f8f8; --muted:#d0d6e0; --subtle:#8a8f98; --line:#23252a; }
body { background:var(--canvas); color:var(--ink); font-family:Inter,SF Pro Display,system-ui,sans-serif; margin:0; }
.card { background:var(--s1); border:1px solid var(--line); border-radius:12px; padding:24px; }
button { background:var(--primary); color:#fff; border:0; border-radius:8px; padding:8px 14px; font-size:14px; font-weight:500; cursor:pointer; }
button.secondary { background:var(--s1); color:var(--ink); border:1px solid var(--line); }
input { background:var(--s1); color:var(--ink); border:1px solid var(--line); border-radius:8px; padding:8px 12px; }
```

```jsx
// client/src/App.jsx
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import './theme.css';
import Login from './pages/Login.jsx';
import Desk from './pages/Desk.jsx';
import Catalog from './pages/Catalog.jsx';
import Patrons from './pages/Patrons.jsx';
import Loans from './pages/Loans.jsx';
import Lookup from './pages/Lookup.jsx';
const gated = (el) => (localStorage.getItem('token') ? el : <Navigate to="/login" />);
export default function App() {
  return (
    <BrowserRouter>
      <nav style={{ display: 'flex', gap: 16, padding: 16, borderBottom: '1px solid #23252a' }}>
        <Link to="/desk">Desk</Link><Link to="/catalog">Catalog</Link><Link to="/patrons">Patrons</Link><Link to="/loans">Loans</Link><Link to="/lookup">Lookup</Link>
      </nav>
      <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/desk" element={gated(<Desk />)} />
          <Route path="/catalog" element={gated(<Catalog />)} />
          <Route path="/patrons" element={gated(<Patrons />)} />
          <Route path="/loans" element={gated(<Loans />)} />
          <Route path="/lookup" element={<Lookup />} />
          <Route path="*" element={<Navigate to="/desk" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
```

```jsx
// client/src/pages/Login.jsx
import { useState } from 'react';
export default function Login() {
  const [f, setF] = useState({ username: '', password: '' });
  const go = async () => {
    const r = await (await fetch('http://localhost:4000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) })).json();
    if (r.token) { localStorage.setItem('token', r.token); location.href = '/desk'; } else alert(r.error);
  };
  return (<div className="card" style={{ maxWidth: 360 }}><h2>Staff login</h2>
    <input placeholder="username" onChange={(e) => setF({ ...f, username: e.target.value })} /><br /><br />
    <input type="password" placeholder="password" onChange={(e) => setF({ ...f, password: e.target.value })} /><br /><br />
    <button onClick={go}>Sign in</button></div>);
}
```

```jsx
// client/src/pages/Desk.jsx — dual input: manual text + camera (jsQR) per box
import { useRef, useState } from 'react';
import jsQR from 'jsqr';
function useCamera(set) {
  const v = useRef(null); const c = useRef(null);
  const start = async () => {
    const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    v.current.srcObject = s;
    await v.current.play();
    const tick = () => {
      const cv = c.current; if (!cv) return;
      cv.width = v.current.videoWidth; cv.height = v.current.videoHeight;
      const ctx = cv.getContext('2d'); ctx.drawImage(v.current, 0, 0);
      const d = ctx.getImageData(0, 0, cv.width, cv.height);
      const q = jsQR(d.data, cv.width, cv.height);
      if (q) { set(q.data); s.getTracks().forEach((t) => t.stop()); } else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  return { v, c, start };
}
export default function Desk() {
  const [patronCode, setP] = useState('P-0001');
  const [copyCode, setC] = useState('B-COPY-001');
  const [out, setOut] = useState(null);
  const cam1 = useCamera(setP); const cam2 = useCamera(setC);
  const H = () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('token') });
  const act = async (action) => {
    const r = await (await fetch('http://localhost:4000/api/circulation', { method: 'POST', headers: H(), body: JSON.stringify({ patronCode, copyCode, action }) })).json();
    if (r.error) alert(r.error); else setOut(r);
  };
  return (<div style={{ display: 'grid', gap: 16 }}>
    <div className="card"><h3>Circulation — scan or type both codes</h3>
      <input value={patronCode} onChange={(e) => setP(e.target.value)} placeholder="patron P-0001" /> <button className="secondary" onClick={cam1.start}>Camera</button>
      <video ref={cam1.v} style={{ width: 220 }} /><canvas ref={cam1.c} hidden /><br /><br />
      <input value={copyCode} onChange={(e) => setC(e.target.value)} placeholder="copy B-COPY-001" /> <button className="secondary" onClick={cam2.start}>Camera</button>
      <video ref={cam2.v} style={{ width: 220 }} /><canvas ref={cam2.c} hidden /><br /><br />
      <button onClick={() => act('checkout')}>Checkout</button> <button className="secondary" onClick={() => act('return')}>Return</button>
    </div>
    {out && <div className="card"><h4>Receipt ({out.ms}ms)</h4><pre>{JSON.stringify(out.loan, null, 2)}</pre><p>Recommendations: {out.recommendations.join(', ')}</p><button onClick={() => window.print()}>Print</button></div>}
  </div>);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm --prefix client run build; if ($?) { if (Test-Path -LiteralPath "client/dist/index.html") { Write-Output "PASS" } else { exit 1 } }`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/theme.css client/src/App.jsx client/src/pages/Login.jsx client/src/pages/Desk.jsx; if ($?) { git commit -m "feat: shell theme login desk" }
```

---

### Task 5: Catalog + patrons + loans + public lookup + QR print

**Files:**
- Create: `client/src/pages/Catalog.jsx`, `Patrons.jsx`, `Loans.jsx`, `Lookup.jsx`
- Test: `node demo.js` + `npm --prefix client run build` (both green).

**Interfaces:**
- Consumes: Task 3/4 endpoints and routes.
- Produces: complete working system for defense.

- [ ] **Step 1: Write the failing test**

Run: `node demo.js; if ($?) { npm --prefix client run build }`
Expected: FAIL until pages exist (router imports missing → build fails).

- [ ] **Step 2: Run test to verify it fails**

Run: same command.
Expected: FAIL with "Failed to resolve import ./pages/Catalog.jsx".

- [ ] **Step 3: Write minimal implementation**

```jsx
// client/src/pages/Catalog.jsx
import { useEffect, useState } from 'react';
export default function Catalog() {
  const [rows, setRows] = useState([]);
  useEffect(() => { fetch('http://localhost:4000/api/catalog', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }).then((r) => r.json()).then(setRows); }, []);
  return (<div className="card"><h3>Catalog — real-time availability</h3><table><tbody>{rows.map((r, i) => <tr key={i}><td>{r.title}</td><td>{r.author}</td><td>{r.copyCode}</td><td>{r.status}</td><td><a href={`http://localhost:4000/api/qr/${r.copyCode}`} target="_blank" rel="noreferrer">QR</a></td></tr>)}</tbody></table></div>);
}
// client/src/pages/Patrons.jsx
import { useEffect, useState } from 'react';
export default function Patrons() {
  const [rows, setRows] = useState([]);
  useEffect(() => { fetch('http://localhost:4000/api/patrons', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }).then((r) => r.json()).then(setRows); }, []);
  return (<div className="card"><h3>Patrons + history entry</h3>{rows.map((p) => <div key={p.code}>{p.code} — {p.name} <a href={`http://localhost:4000/api/qr/${p.code}`} target="_blank" rel="noreferrer">QR</a></div>)}</div>);
}
// client/src/pages/Loans.jsx
import { useEffect, useState } from 'react';
export default function Loans() {
  const [rows, setRows] = useState([]); const [f, setF] = useState('');
  const load = (s) => fetch('http://localhost:4000/api/loans' + (s ? `?status=${s}` : ''), { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }).then((r) => r.json()).then((d) => { setRows(d); setF(s); });
  useEffect(() => { load(''); }, []);
  return (<div className="card"><h3>Loans</h3><button className="secondary" onClick={() => load('')}>All</button> <button className="secondary" onClick={() => load('active')}>Active</button> <button className="secondary" onClick={() => load('overdue')}>Overdue</button><pre>{JSON.stringify(rows.slice(0, 20), null, 2)}</pre></div>);
}
// client/src/pages/Lookup.jsx — public, no login: type ID or camera
import { useState } from 'react';
export default function Lookup() {
  const [code, setCode] = useState('P-0001'); const [out, setOut] = useState(null);
  const go = async () => setOut(await (await fetch(`http://localhost:4000/api/patrons/${code}/recommendations`)).json());
  return (<div className="card"><h3>Patron lookup — my loans + personal recommendations</h3><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="P-0001 or scan" /> <button onClick={go}>View</button>{out && <div><p>{out.patron.name}</p><pre>{JSON.stringify(out.activeLoans, null, 2)}</pre><p>For you: {out.recommendations.join(', ')}</p></div>}</div>);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node demo.js; if ($?) { npm --prefix client run build }`
Expected: `DEMO OK` + `vite build` success.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Catalog.jsx client/src/pages/Patrons.jsx client/src/pages/Loans.jsx client/src/pages/Lookup.jsx; if ($?) { git commit -m "feat: catalog patrons loans lookup" }
```

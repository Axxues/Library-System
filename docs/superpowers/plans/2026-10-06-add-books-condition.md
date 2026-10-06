# Add Books + Per-Copy Condition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Staff can add titles with auto-coded copies and track per-copy condition end to end.

**Architecture:** MSSQL migration first, then two endpoints plus two response-shape changes in `server/index.js`, then one new client page, one table column, and one receipt badge — backend tasks land before the frontend tasks that consume them.

**Tech Stack:** Node express + mssql (JWT `auth`), React 19 JSX + react-router-dom 7, Tailwind v3 tokens, `node --test` live-API tests.

**Spec:** `docs/superpowers/specs/2026-10-06-add-books-condition-design.md`

## Global Constraints

- Condition values are exactly Good, Worn, Damaged — never other strings, everywhere.
- Condition is informational only and never blocks checkout or return.
- New copy codes are global `B-COPY-%03d` sequence (1 + max numeric suffix, widens past 999).
- All new endpoints reuse the existing `auth` middleware (any logged-in staff).
- Client errors surface via `role="alert"` and failed row edits revert.
- Tests are live: SQL Server seeded + `node server/index.js` on :4000 (same pattern as `test/profile.test.js`, staff1/staff123), then `node --test test/`.

---

### Task 1: Condition column migration

**Files:**
- Create: `db/migrate-condition.sql`
- Create: `test/catalog.test.js` (grows in Tasks 2-3; this task adds the column test only)

**Interfaces:**
- Consumes: `db/schema.sql:8` BookCopies definition, `server/db.js` getPool, `test/db.test.js` style.
- Produces: `condition` column (NOT NULL DEFAULT 'Good', CHECK in Good/Worn/Damaged); later tasks read/write it.

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/catalog.test.js`
Expected: FAIL with "condition column exists" (column missing).

- [ ] **Step 3: Write migration and apply it**

```sql
-- db/migrate-condition.sql
ALTER TABLE BookCopies ADD condition NVARCHAR(10) NOT NULL DEFAULT 'Good' CHECK (condition IN ('Good','Worn','Damaged'));
```

Apply: run this file against LibraryDB in SSMS/`sqlcmd` (same way `db/migrate-profile.sql` was applied), then re-run the test.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/catalog.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add db/migrate-condition.sql test/catalog.test.js
git commit -m "feat: add BookCopies condition column"
```

### Task 2: POST /api/catalog

**Files:**
- Modify: `server/index.js` (insert after the `GET /api/catalog` block at lines 25-29)
- Modify: `test/catalog.test.js` (append POST tests)

**Interfaces:**
- Consumes: Task 1 `condition` column; `auth` middleware; `QRCode` not needed server-side (client builds `/api/qr/<code>` URLs).
- Produces: `POST /api/catalog {title, author, genre, classification?, copies}` → `{book, copies: [{copyCode, qrUrl}]}`; Task 4 posts to it.

- [ ] **Step 1: Write the failing tests**

```js
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
```

Helpers to prepend once in `test/catalog.test.js` (same shape as `test/profile.test.js:5-8`):

```js
const BASE = 'http://localhost:4000';
async function login() {
  const r = await (await fetch(BASE + '/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'staff1', password: 'staff123' }) })).json();
  return r.token;
}
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/catalog.test.js` (server on :4000 first: `node server/index.js`)
Expected: FAIL with 404 (no POST route; express default HTML, `r.status` 404).

- [ ] **Step 3: Write minimal implementation**

```js
app.post('/api/catalog', auth, async (req, res) => {
  const { title, author, genre, classification, copies } = req.body || {};
  if (!title || !author || !genre) return res.status(400).json({ error: 'title, author, genre required' });
  const n = Number(copies);
  if (!Number.isInteger(n) || n < 1 || n > 50) return res.status(400).json({ error: 'copies must be 1-50' });
  const pool = await getPool(); const tx = pool.transaction();
  try {
    await tx.begin();
    const b = await tx.request().input('t', title).input('a', author).input('g', genre).input('c', classification || null)
      .query('INSERT INTO Books (title, author, genre, classification) OUTPUT INSERTED.id VALUES (@t,@a,@g,@c)');
    const bookId = b.recordset[0].id;
    const maxR = await tx.request().query("SELECT MAX(CAST(SUBSTRING(copyCode, 8, 10) AS INT)) AS m FROM BookCopies WHERE copyCode LIKE 'B-COPY-%'");
    let next = (maxR.recordset[0].m || 0) + 1;
    const out = [];
    for (let i = 0; i < n; i++) {
      const code = 'B-COPY-' + String(next).padStart(3, '0');
      try {
        await tx.request().input('c', code).input('b', bookId).query('INSERT INTO BookCopies (copyCode, bookId) VALUES (@c,@b)');
      } catch (e) {
        if (e.number === 2627 || e.number === 2601) {
          const retry = await tx.request().query("SELECT MAX(CAST(SUBSTRING(copyCode, 8, 10) AS INT)) AS m FROM BookCopies WHERE copyCode LIKE 'B-COPY-%'");
          next = (retry.recordset[0].m || 0) + 1;
          const code2 = 'B-COPY-' + String(next).padStart(3, '0');
          await tx.request().input('c', code2).input('b', bookId).query('INSERT INTO BookCopies (copyCode, bookId) VALUES (@c,@b)');
          out.push({ copyCode: code2, qrUrl: '/api/qr/' + code2 });
          next++;
          continue;
        }
        throw e;
      }
      out.push({ copyCode: code, qrUrl: '/api/qr/' + code });
      next++;
    }
    await tx.commit();
    res.json({ book: { id: bookId, title, author, genre, classification: classification || null }, copies: out });
  } catch (e) { try { await tx.rollback(); } catch {} res.status(500).json({ error: 'could not allocate copy codes' }); }
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/catalog.test.js`
Expected: PASS (all tests in file, including Task 1).

- [ ] **Step 5: Commit**

```bash
git add server/index.js test/catalog.test.js
git commit -m "feat: add POST /api/catalog with auto-coded copies"
```

### Task 3: Condition read/write API

**Files:**
- Modify: `server/index.js` (GET /api/catalog select; circulation select + response; new PATCH route)
- Modify: `test/catalog.test.js` (append PATCH/GET/circulation tests)

**Interfaces:**
- Consumes: Task 1 column, Task 2 test file/helpers.
- Produces: `c.condition` in GET rows; `PATCH /api/copies/:code/condition`; `condition` in POST /api/circulation responses; Tasks 5-6 consume all three.

- [ ] **Step 1: Write the failing tests**

```js
test('PATCH condition round-trips and GET exposes it', async () => {
  const H = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + await login() };
  const created = await (await fetch(BASE + '/api/catalog', { method: 'POST', headers: H, body: JSON.stringify({ title: 'Cond Book ' + Date.now(), author: 'QA', genre: 'Test', copies: 1 }) })).json();
  const code = created.copies[0].copyCode;
  const set = await fetch(BASE + '/api/copies/' + code + '/condition', { method: 'PATCH', headers: H, body: JSON.stringify({ condition: 'Damaged' }) });
  assert.strictEqual(set.status, 200);
  assert.deepStrictEqual(await set.json(), { copyCode: code, condition: 'Damaged' });
  const cat = await (await fetch(BASE + '/api/catalog', { headers: { Authorization: 'Bearer ' + await login() } })).json();
  assert.strictEqual(cat.find((r) => r.copyCode === code).condition, 'Damaged');
  const bad = await fetch(BASE + '/api/copies/' + code + '/condition', { method: 'PATCH', headers: H, body: JSON.stringify({ condition: 'Broken' }) });
  assert.strictEqual(bad.status, 400);
  const missing = await fetch(BASE + '/api/copies/NOPE-000/condition', { method: 'PATCH', headers: H, body: JSON.stringify({ condition: 'Good' }) });
  assert.strictEqual(missing.status, 404);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test test/catalog.test.js`
Expected: FAIL with 404 on the PATCH call.

- [ ] **Step 3: Write minimal implementation**

Change `GET /api/catalog` select to:

```js
const r = await pool.request().query('SELECT b.id, b.title, b.author, b.genre, c.copyCode, c.status, c.condition FROM Books b LEFT JOIN BookCopies c ON c.bookId=b.id ORDER BY b.title');
```

Add after the POST /api/catalog block:

```js
app.patch('/api/copies/:code/condition', auth, async (req, res) => {
  const { condition } = req.body || {};
  if (condition !== 'Good' && condition !== 'Worn' && condition !== 'Damaged') return res.status(400).json({ error: 'condition must be Good, Worn, or Damaged' });
  const pool = await getPool();
  const r = await pool.request().input('c', req.params.code).input('v', condition).query('UPDATE BookCopies SET condition=@v WHERE copyCode=@c');
  if (r.rowsAffected[0] === 0) return res.status(404).json({ error: 'unknown copy code' });
  res.json({ copyCode: req.params.code, condition });
});
```

Circulation change (around current lines 62 and 83): add `c.condition` to the copy select and include it in the response:

```js
const cp = (await tx.request().input('c', copyCode).query('SELECT c.id, c.copyCode, c.status, c.condition, b.id AS bookId FROM BookCopies c JOIN Books b ON b.id=c.bookId WHERE copyCode=@c')).recordset[0];
```

```js
res.json({ loan, recommendations: recs, ms, condition: cp.condition });
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/`
Expected: PASS (whole suite: db, profile, recommender, catalog).

- [ ] **Step 5: Commit**

```bash
git add server/index.js test/catalog.test.js
git commit -m "feat: expose and update copy condition in API"
```

### Task 4: Add Books page

**Files:**
- Create: `client/src/pages/AddBook.jsx`
- Modify: `client/src/App.jsx` (import + `/catalog/new` route, gated like the rest)
- Modify: `client/src/pages/Catalog.jsx` (Add books Button in the header navigating to `/catalog/new`)

**Interfaces:**
- Consumes: Task 2 `POST /api/catalog` contract; `api()` helper (throws `Error('unreachable')` offline, `Error(message)` on 400); `Button`, `Input`, `Card` primitives; existing `role="alert"` error pattern.
- Produces: `/catalog/new` route; Task 5/6 untouched by this task.

- [ ] **Step 1: Create AddBook.jsx**

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Button } from '../components/ui/button.jsx';
import { Card } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';
export default function AddBook() {
  const nav = useNavigate();
  const [f, setF] = useState({ title: '', author: '', genre: '', classification: '', copies: '1' });
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const go = async () => {
    setErr('');
    const n = Number(f.copies);
    if (!f.title.trim() || !f.author.trim() || !f.genre.trim()) { setErr('Title, author, and genre are required.'); return; }
    if (!Number.isInteger(n) || n < 1 || n > 50) { setErr('Copies must be 1-50.'); return; }
    try {
      const d = await api('/api/catalog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: f.title.trim(), author: f.author.trim(), genre: f.genre.trim(), classification: f.classification.trim() || undefined, copies: n }) });
      setDone(d);
    } catch (e) { setErr(e.message === 'unreachable' ? 'Cannot reach the server at localhost:4000.' : e.message); }
  };
  if (done) return (<div>
    <div className="mb-5"><h2 className="heading-2">Added “{done.book.title}”</h2><p className="text-sm text-muted-foreground">{done.copies.length} copies ready — print a QR label for each spine.</p></div>
    <div className="grid gap-4 md:grid-cols-2">{done.copies.map((c) => <Card key={c.copyCode} className="flex-row items-center gap-4"><img src={'http://localhost:4000' + c.qrUrl} alt={'QR for ' + c.copyCode} className="h-24 w-24 rounded-lg border border-border" /><div><p className="font-mono text-sm font-bold">{c.copyCode}</p><p className="text-xs text-muted-foreground">{done.book.title}</p></div></Card>)}</div>
    <div className="mt-3.5 flex gap-2"><Button variant="secondary" onClick={() => window.print()} type="button">Print labels</Button><span className="min-w-0 flex-1" /><Button onClick={() => nav('/catalog')} type="button">Back to Books</Button></div>
  </div>);
  return (<div>
    <div className="mb-5"><h2 className="heading-2">Add books</h2><p className="text-sm text-muted-foreground">New title in, labelled copies out — one QR per copy.</p></div>
    <Card className="max-w-xl">
      <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Title</label><Input value={f.title} onChange={set('title')} placeholder="Noli Me Tangere" /></div>
      <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Author</label><Input value={f.author} onChange={set('author')} placeholder="Jose Rizal" /></div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Genre</label><Input value={f.genre} onChange={set('genre')} placeholder="Fiction" /></div>
        <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Classification (optional)</label><Input value={f.classification} onChange={set('classification')} placeholder="PH-FIC" /></div>
      </div>
      <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Copies (1–50)</label><Input type="number" min="1" max="50" value={f.copies} onChange={set('copies')} /></div>
      <div className="mt-3.5 flex gap-2"><Button onClick={go} type="button">Add books</Button><span className="min-w-0 flex-1" /><Button variant="secondary" onClick={() => nav('/catalog')} type="button">Cancel</Button></div>
      {err && <div className="mt-3 rounded-lg border border-destructive bg-destructive/10 p-2 px-3 text-sm text-destructive" role="alert">{err}</div>}
    </Card>
  </div>);
}
```

`client/src/App.jsx`: add `import AddBook from './pages/AddBook.jsx';` and `<Route path="/catalog/new" element={page(<AddBook />)} />` before the `/catalog` route.

`client/src/pages/Catalog.jsx` header: add an actions row under the description:

```jsx
<div className="mt-3.5 flex gap-2"><span className="min-w-0 flex-1" /><Button variant="secondary" onClick={() => nav('/catalog/new')} type="button">Add books</Button></div>
```

with `import { useNavigate } from 'react-router-dom';` and `const nav = useNavigate();` at the top of the component (Catalog currently has neither — add both).

- [ ] **Step 2: Build the client**

Run: `npm run build` in `client/`
Expected: PASS.

- [ ] **Step 3: Manual check**

`npm run dev`, visit `/catalog/new` (gated: redirects to login when logged out), submit empty form → inline required message, submit valid → QR sheet with one image per copy.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/AddBook.jsx client/src/App.jsx client/src/pages/Catalog.jsx
git commit -m "feat: add Add Books page with QR label sheet"
```

### Task 5: Books Condition column

**Files:**
- Modify: `client/src/pages/Catalog.jsx` (Condition column + inline editor)

**Interfaces:**
- Consumes: Task 3 GET `condition` field + PATCH contract; Task 4 file (edits a different hunk: header vs table).
- Produces: per-row condition editing; Task 6 reads the same field on Scan.

- [ ] **Step 1: Add Condition column with optimistic select**

Table header: `<TableHead>Book</TableHead><TableHead>Copy code</TableHead><TableHead>Status</TableHead>` becomes `<TableHead>Book</TableHead><TableHead>Copy code</TableHead><TableHead>Status</TableHead><TableHead>Condition</TableHead>` (QR cell stays last — move the QR `<TableCell>` after the new cell).

Row cell (new state `const [condErr, setCondErr] = useState('')` + per-row pending via `const [saving, setSaving] = useState({})`):

```jsx
<TableCell>
  <span className="flex items-center gap-2">
    <Badge variant={r.condition === 'Good' ? 'success' : r.condition === 'Worn' ? 'warning' : 'destructive'}>{r.condition || 'Good'}</Badge>
    <select aria-label={'Condition for ' + r.copyCode} disabled={!!saving[r.copyCode]} value={r.condition || 'Good'} onChange={(e) => changeCond(r.copyCode, e.target.value)}
      className="h-8 rounded-lg border border-input bg-background px-2 text-xs font-semibold focus-visible:ring-2 focus-visible:ring-ring/40">
      <option>Good</option><option>Worn</option><option>Damaged</option>
    </select>
  </span>
</TableCell>
```

Handler (placed next to the `list` filter; calls the existing `setRows`):

```jsx
const changeCond = async (copyCode, condition) => {
  const prev = rows;
  setRows(rows.map((x) => x.copyCode === copyCode ? { ...x, condition } : x));
  setSaving((s) => ({ ...s, [copyCode]: true }));
  setCondErr('');
  try {
    await api('/api/copies/' + copyCode + '/condition', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ condition }) });
  } catch (e) {
    setRows(prev);
    setCondErr(e.message === 'unreachable' ? 'Cannot reach the server at localhost:4000.' : e.message);
  } finally {
    setSaving((s) => ({ ...s, [copyCode]: false }));
  }
};
```

Error line under the toolbar (same alert style as the rest of the app):

```jsx
{condErr && <div className="mb-3 rounded-lg border border-destructive bg-destructive/10 p-2 px-3 text-sm text-destructive" role="alert">{condErr}</div>}
```

- [ ] **Step 2: Build the client**

Run: `npm run build` in `client/`
Expected: PASS.

- [ ] **Step 3: Manual check**

Books table shows a Condition column; change a row to Damaged → badge flips immediately; reload page → Damaged persists; stop the server and change again → select reverts with the unreachable message.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Catalog.jsx
git commit -m "feat: add inline condition editing to Books table"
```

### Task 6: Scan receipt badge + full verification

**Files:**
- Modify: `client/src/pages/Scan.jsx` (read-only condition Badge on the receipt card)
- No other files (verification only after that edit)

**Interfaces:**
- Consumes: Task 3 circulation `condition` field; existing receipt layout (`out.action`, `out.ms` badge row).

- [ ] **Step 1: Add the receipt badge**

In the `step === 2 && out` receipt card, next to the existing `<Badge variant="default">{out.ms}ms</Badge>` row, add:

```jsx
{out.condition && <Badge variant={out.condition === 'Good' ? 'success' : out.condition === 'Worn' ? 'warning' : 'destructive'}>{out.condition}</Badge>}
```

No other Scan logic changes; editing stays in Books only.

- [ ] **Step 2: Run the full backend suite**

Run: `node --test test/` (server on :4000, seeded DB)
Expected: PASS, all files.

- [ ] **Step 3: Build + lint the client**

Run: `npm run build` and `npm run lint` in `client/`
Expected: build PASS; lint 0 errors (warnings stay at the pre-existing baseline).

- [ ] **Step 4: Manual end-to-end loop**

Add a 2-copy book → QR sheet prints; Books shows both copies Good; set one to Worn → persists on reload; scan that copy → receipt shows the Worn badge; checkout still succeeds (informational only).

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Scan.jsx
git commit -m "feat: show copy condition on scan receipt"
```

## Self-Review

- Spec coverage: migration → Task 1; POST → Task 2; PATCH + GET change + circulation condition → Task 3; Add Books page + entry → Task 4; table column → Task 5; Scan badge → Task 6. Error handling (400/404/UNIQUE retry/revert) lives in Tasks 2, 3, 5. Testing section maps to Task step 4s/2s plus Task 6 verification.
- Placeholder scan: no TBD/TODO; no "similar to Task N" (Table import repeated in Task 5 context via existing file, AddBook code inline, handler code inline).
- Type consistency: `condition` is always the exact strings Good/Worn/Damaged; `copies: [{copyCode, qrUrl}]` produced by Task 2, consumed by Task 4 sheet; `changeCond(copyCode, condition)` signature used once where defined.

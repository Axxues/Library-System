# Member Intake Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Member registration and editing capture structured names, email, two contacts, structured address, and photo.

**Architecture:** Migration first, then POST extension plus new PUT with live-API tests, then the AddPatron form, then directory display plus edit dialog — backend tasks land before the frontend tasks that consume them.

**Tech Stack:** Node express + mssql (JWT `auth`), React 19 JSX, Tailwind v3, `node --test` live-API tests.

**Spec:** `docs/superpowers/specs/2026-10-06-patron-intake-design.md`

## Global Constraints

- `name` stays the display value; every screen reading `p.name` keeps working, old rows untouched.
- Photo reuses the staff Profile downscale pattern (128px JPEG dataURL, 50KB cap, same `picture too large (50KB max)` message).
- When any name part is present, first and last name are required and `name` is their space-joined non-empty parts.
- Client errors surface via `role="alert"`.
- Tests are live: SQL Server seeded + `node --env-file=.env server/index.js` on :4000, then `node --env-file=.env --test test/` (bare node lacks DB env).

---

### Task 1: Patron columns migration

**Files:**
- Create: `db/migrate-patron-intake.sql`
- Create: `test/patrons.test.js` (grows in Task 2; this task adds the column test only)

**Interfaces:**
- Consumes: `db/schema.sql:6` Patrons definition, `server/db.js` getPool, `test/db.test.js` style.
- Produces: nullable `firstName/middleName/lastName/email/contact2/addrStreet/addrBarangay/addrCity/addrProvince/addrPostal/avatar` columns; later tasks read/write them.

- [ ] **Step 1: Write the failing test**

```js
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --env-file=.env --test test/patrons.test.js`
Expected: FAIL with "missing column firstName".

- [ ] **Step 3: Write migration and apply it**

```sql
-- db/migrate-patron-intake.sql
ALTER TABLE Patrons ADD firstName NVARCHAR(100) NULL, middleName NVARCHAR(100) NULL, lastName NVARCHAR(100) NULL, email NVARCHAR(100) NULL, contact2 NVARCHAR(100) NULL, addrStreet NVARCHAR(100) NULL, addrBarangay NVARCHAR(100) NULL, addrCity NVARCHAR(100) NULL, addrProvince NVARCHAR(100) NULL, addrPostal NVARCHAR(20) NULL, avatar NVARCHAR(MAX) NULL;
```

Apply: run this file against LibraryDB (same way `db/migrate-condition.sql` was applied), then re-run the test.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --env-file=.env --test test/patrons.test.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add db/migrate-patron-intake.sql test/patrons.test.js
git commit -m "feat: add patron intake columns"
```

### Task 2: POST extension + PUT endpoint

**Files:**
- Modify: `server/index.js` (POST /api/patrons block ~lines 82-100; new PUT route after it)
- Modify: `test/patrons.test.js` (append API tests)

**Interfaces:**
- Consumes: Task 1 columns; existing `auth`, P-code allocator (`pad`, MAX+retry).
- Produces: POST accepts full field set and composes `name`; `PUT /api/patrons/:code` validates and returns the updated row; Tasks 3-4 consume both.

- [ ] **Step 1: Write the failing tests**

```js
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
```

- [ ] **Step 2: Run tests to verify they fail**

Run: server on :4000 first (`node --env-file=.env server/index.js` in background), then `node --env-file=.env --test test/patrons.test.js`
Expected: FAIL — `d.email` undefined (columns ignored), PUT 404s as unknown route.

- [ ] **Step 3: Write minimal implementation**

Replace the POST body handling (keep the `pad`/MAX+retry allocator byte-identical, only widen the column lists). New POST core:

```js
app.post('/api/patrons', auth, async (req, res) => {
  const b = req.body || {};
  const trim = (v) => String(v || '').trim() || null;
  const hasParts = !!(b.firstName || b.middleName || b.lastName);
  let name = String(b.name || '').trim();
  if (hasParts) {
    if (!String(b.firstName || '').trim() || !String(b.lastName || '').trim()) return res.status(400).json({ error: 'first and last name required' });
    name = [b.firstName, b.middleName, b.lastName].map((x) => String(x || '').trim()).filter(Boolean).join(' ');
  }
  if (!name) return res.status(400).json({ error: 'name required' });
  if (b.avatar && String(b.avatar).length > 50000) return res.status(400).json({ error: 'picture too large (50KB max)' });
  const pool = await getPool();
  const cols = { fn: trim(b.firstName), mn: trim(b.middleName), ln: trim(b.lastName), em: trim(b.email), t: trim(b.contact), t2: trim(b.contact2), st: trim(b.addrStreet), br: trim(b.addrBarangay), ct: trim(b.addrCity), pv: trim(b.addrProvince), pc: trim(b.addrPostal), av: b.avatar || null };
  const insert = (code) => pool.request().input('c', code).input('n', name)
    .input('fn', cols.fn).input('mn', cols.mn).input('ln', cols.ln).input('em', cols.em)
    .input('t', cols.t).input('t2', cols.t2).input('st', cols.st).input('br', cols.br)
    .input('ct', cols.ct).input('pv', cols.pv).input('pc', cols.pc).input('av', cols.av)
    .query('INSERT INTO Patrons (code, name, firstName, middleName, lastName, email, contact, contact2, addrStreet, addrBarangay, addrCity, addrProvince, addrPostal, avatar) OUTPUT INSERTED.* VALUES (@c,@n,@fn,@mn,@ln,@em,@t,@t2,@st,@br,@ct,@pv,@pc,@av)');
  try {
    const maxR = await pool.request().query("SELECT MAX(CAST(SUBSTRING(code, 3, 10) AS INT)) AS m FROM Patrons WHERE code LIKE 'P-%'");
    try {
      return res.json((await insert(pad((maxR.recordset[0].m || 0) + 1))).recordset[0]);
    } catch (e) {
      if (e.number !== 2627 && e.number !== 2601) throw e;
      const retry = await pool.request().query("SELECT MAX(CAST(SUBSTRING(code, 3, 10) AS INT)) AS m FROM Patrons WHERE code LIKE 'P-%'");
      return res.json((await insert(pad((retry.recordset[0].m || 0) + 1))).recordset[0]);
    }
  } catch (e) { res.status(500).json({ error: 'could not register patron' }); }
});
```

New PUT route directly after POST (same validation, code immutable):

```js
app.put('/api/patrons/:code', auth, async (req, res) => {
  const b = req.body || {};
  const trim = (v) => String(v || '').trim() || null;
  const hasParts = !!(b.firstName || b.middleName || b.lastName);
  let name = String(b.name || '').trim();
  if (hasParts) {
    if (!String(b.firstName || '').trim() || !String(b.lastName || '').trim()) return res.status(400).json({ error: 'first and last name required' });
    name = [b.firstName, b.middleName, b.lastName].map((x) => String(x || '').trim()).filter(Boolean).join(' ');
  }
  if (!name) return res.status(400).json({ error: 'name required' });
  if (b.avatar && String(b.avatar).length > 50000) return res.status(400).json({ error: 'picture too large (50KB max)' });
  const pool = await getPool();
  const r = await pool.request().input('c', req.params.code).input('n', name)
    .input('fn', trim(b.firstName)).input('mn', trim(b.middleName)).input('ln', trim(b.lastName)).input('em', trim(b.email))
    .input('t', trim(b.contact)).input('t2', trim(b.contact2)).input('st', trim(b.addrStreet)).input('br', trim(b.addrBarangay))
    .input('ct', trim(b.addrCity)).input('pv', trim(b.addrProvince)).input('pc', trim(b.addrPostal)).input('av', b.avatar || null)
    .query('UPDATE Patrons SET name=@n, firstName=@fn, middleName=@mn, lastName=@ln, email=@em, contact=@t, contact2=@t2, addrStreet=@st, addrBarangay=@br, addrCity=@ct, addrProvince=@pv, addrPostal=@pc, avatar=@av OUTPUT INSERTED.* WHERE code=@c');
  if (!r.recordset[0]) return res.status(404).json({ error: 'unknown patron' });
  res.json(r.recordset[0]);
});
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --env-file=.env --test test/`
Expected: PASS (whole suite: db, profile, recommender, catalog, patrons).

- [ ] **Step 5: Commit**

```bash
git add server/index.js test/patrons.test.js
git commit -m "feat: patron intake fields on POST plus PUT endpoint"
```

### Task 3: Add Member form extension

**Files:**
- Modify: `client/src/pages/AddPatron.jsx` (form fields + photo; success view shows composed name + photo)

**Interfaces:**
- Consumes: Task 2 POST contract; `api()` helper (`unreachable` convention); `Button`, `Card`, `Input` primitives; existing `role="alert"` pattern.
- Produces: full-field registration; Task 4 only reads via GET, unaffected by this task's markup.

- [ ] **Step 1: Extend the form state and fields**

Replace `const [name, setName] = useState('')` + `const [contact, setContact] = useState('')` with one object (mirror `Profile.jsx:20-33` field names):

```jsx
const [f, setF] = useState({ firstName: '', middleName: '', lastName: '', email: '', contact: '', contact2: '', addrStreet: '', addrBarangay: '', addrCity: '', addrProvince: '', addrPostal: '', avatar: null });
const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
```

Copy the `downscale(file)` helper verbatim from `client/src/pages/Profile.jsx:35-50` (128px JPEG dataURL) into AddPatron.jsx — duplication is deliberate (spec): do not import across pages. Photo picker (same pattern as Profile):

```jsx
const pick = async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const dataUrl = await downscale(file);
    if (dataUrl.length > 50000) { setError('Picture still too large after shrink.'); return; }
    setF({ ...f, avatar: dataUrl });
  } catch { setError('Could not read that image.'); }
};
```

`handleSubmit`: require `f.firstName.trim()` and `f.lastName.trim()` (message `First and last name are required.`), POST the whole `f` object (trimmed strings, `avatar` as-is). `resetForm` restores the object above.

Form markup (inside the existing `<Card>`, same label + `role="alert"` patterns): First/Middle/Last row (Middle optional), Email, Contact + Secondary contact row, five address fields (Street full-width, Barangay/City row, Province/Postal row — same labels as Profile), photo block (preview circle 96px or `?` placeholder + the styled file input from the Profile photo pattern):

```jsx
<input type="file" accept="image/*" onChange={pick} className="text-sm file:mr-3 file:rounded-lg file:border file:border-input file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-foreground hover:file:bg-accent focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-ring/40" />
```

Success view: `{result.name} is a member` stays (server-composed), photo shows `result.avatar` when present (same 128px circle style as the preview).

- [ ] **Step 2: Build the client**

Run: `npm run build` in `client/`
Expected: PASS.

- [ ] **Step 3: Manual check**

`npm run dev`, visit Add Member, submit empty → required message, fill parts + photo → success view shows composed name and photo.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/AddPatron.jsx
git commit -m "feat: extend Add Member form with intake fields"
```

### Task 4: Directory display + edit dialog

**Files:**
- Modify: `client/src/pages/Patrons.jsx` (avatar/contact display, Edit action + dialog, search widening)

**Interfaces:**
- Consumes: Task 2 PUT contract + GET rows (new columns ride along `SELECT *`); existing QR + profile dialogs untouched.
- Produces: per-row editing; nothing downstream.

- [ ] **Step 1: Show new data and add the edit dialog**

Display (table row, same hunk as the name/contact cells at `Patrons.jsx:316-340`): avatar image when `p.avatar` exists (96px circle style from Task 3, scaled to the row: `h-10 w-10` to match the existing initials tile), else the existing initials tile unchanged; contact cell appends `p.contact2` and `p.email` lines when present:

```jsx
<span className="block text-xs text-muted-foreground">{p.contact || 'No contact on file'}</span>
{p.contact2 && <span className="block text-xs text-muted-foreground">{p.contact2}</span>}
{p.email && <span className="block text-xs text-muted-foreground">{p.email}</span>}
```

Edit action (next to the existing Library Card / Details buttons): `<Button size="sm" variant="outline" onClick={() => openEdit(p)}>Edit</Button>` with `const [editing, setEditing] = useState(null)` holding a field object prefilled from the row (same keys as Task 3's `f`, plus `avatar`), and `setEdit` updater mirroring Task 3. The dialog reuses the Task 3 field markup (copy it, not import it) with Save calling:

```jsx
await api('/api/patrons/' + editing.code, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) });
```

then closes, clears, and refetches the rows; failure keeps the dialog open with the message in `role="alert"`. Photo picker: copy Task 3's `pick`/`downscale` pair verbatim.

Search widening (same filter hunk): match `p.email`, `p.contact2`, `p.firstName`, `p.lastName` alongside code/name/contact.

- [ ] **Step 2: Build the client**

Run: `npm run build` in `client/`
Expected: PASS.

- [ ] **Step 3: Manual check**

Directory shows photos/contacts; Edit opens prefilled; save persists after reload; failed save (e.g. cleared last name) keeps the dialog with the message.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Patrons.jsx
git commit -m "feat: show intake data and edit members in directory"
```

### Task 5: Verification pass

**Files:** none (verification only).

- [ ] **Step 1: Full backend suite**

Run: `node --env-file=.env --test test/` (server on :4000, seeded DB)
Expected: PASS, all files.

- [ ] **Step 2: Build + lint the client**

Run: `npm run build` and `npm run lint` in `client/`
Expected: build PASS; lint 0 errors (warnings stay at the pre-existing baseline).

- [ ] **Step 3: Manual end-to-end loop**

Register a member with photo + full address → QR pass shows composed name; directory shows photo/contact; edit secondary contact + barangay → persists on reload; Lookup/Scan still show the plain display name.

- [ ] **Step 4: Commit (only if fixes were needed)**

```bash
git add -A
git commit -m "fix: intake verification touch-ups"
```

## Self-Review

- Spec coverage: migration → Task 1; POST/PUT → Task 2; add form → Task 3; directory + edit → Task 4; tests/build/loop → Tasks 1-2 steps + Task 5. Error handling (400/404/50KB/revert-on-failure) lives in Tasks 2-4. Lookup/Scan untouched per spec.
- Placeholder scan: no TBD/TODO; no "similar to Task N" (downscale/pick/field markup repeated inline where the spec mandates copying, not importing).
- Type consistency: field keys `firstName/middleName/lastName/email/contact/contact2/addrStreet/addrBarangay/addrCity/addrProvince/addrPostal/avatar` identical in migration, POST, PUT, both forms, and tests; `name` composed by the same join rule in POST and PUT.

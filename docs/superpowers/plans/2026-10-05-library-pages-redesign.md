# Library Pages Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give all 9 pages their own bookish cover-led compositions ending the generic cards-and-tables look.

**Architecture:** One shared-CSS task (shelf/stamp/ledger/ticket utilities + serif heads + Cover lg + video-hidden rule), then three page-group tasks recomposing JSX with classes only, then a verification task. No API, route, or dependency changes.

**Tech Stack:** React 19 + Vite 8 + react-router-dom 7, plain CSS (no new deps).

**Spec:** `docs/superpowers/specs/2026-10-05-library-pages-redesign-design.md`

## Global Constraints

- No new dependencies — plain CSS + existing `lucide-react` icons only.
- No API/server changes — same endpoints, params, response shapes; filters client-side on existing payloads.
- Same routes, same flows (TOTP, avatar downscale, accent apply, camera denied path, print receipt).
- Keep light + dark themes (`[data-theme]`) and mobile support (390px, 768px, 1440px).
- Stamps are text, not color-only; `role=alert` regions kept; covers keep title text alongside.
- Verification for CSS/JSX tasks is `npm run build` + `npm run lint` + grep-count checks (no test framework in repo).

---

## File structure

- Append: `client/src/theme.css` — `.shelf`, `.shelfcard` (+spine-stripe), `.stamp` (+ok/busy/late), `.ledger`, `.ticket`, `.masthead`, serif heads, `video.preview[hidden]{display:none}`, `.cover.lg`.
- Modify: `client/src/cover.jsx` — `size="lg"` prop.
- Recompose: `Desk.jsx`, `Scan.jsx` (Task 2); `Catalog.jsx`, `Patrons.jsx`, `Loans.jsx` (Task 3); `Lookup.jsx`, `Login.jsx`, `Profile.jsx`, `Settings.jsx` (Task 4).
- Untouched: `App.jsx`, `api.js`, server, routes, tokens.

---

### Task 1: Shared shelf system (CSS + Cover lg)

**Files:**
- Modify: `client/src/theme.css` (append ~90 lines at end)
- Modify: `client/src/cover.jsx` (3-line prop)
- Test: grep counts + build + lint

**Interfaces:**
- Consumes: existing tokens (`--primary/--success/--late/--s1/--s2/--line/--ink/--muted/--subtle`), `.pill` convention.
- Produces: `.shelf/.shelfcard/.stamp/.ledger/.ticket/.masthead`, serif heads, `.cover.lg`, video-hidden rule — consumed by Tasks 2-4.

- [ ] **Step 1: Add Cover lg prop**

In `client/src/cover.jsx`, change the component to:

```jsx
export function Cover({ title, size }) {
  const h = hue(title);
  return <span className={'cover' + (size === 'lg' ? ' lg' : '')} style={{ background: `linear-gradient(135deg, hsl(${h} 60% 45%), hsl(${(h + 40) % 360} 65% 35%)` }}>{initials(title)}</span>;
}
```

- [ ] **Step 2: Append shared CSS to theme.css**

Append exactly (after the last rule, before or after `@media print` — put before it):

```css
/* bookish shelf system (pages redesign) */
.page-head h2, .loginhero h1 { font-family: "Fraunces", Georgia, serif; }
.masthead { display: flex; align-items: flex-end; gap: 16px; flex-wrap: wrap; }
.masthead .grow { flex: 1 1 240px; min-width: 0; }
.shelf { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 20px; }
.shelfcard { background: var(--s1); border: 1px solid var(--line); border-radius: var(--r-lg); padding: 14px; display: flex; flex-direction: column; gap: 8px; box-shadow: var(--shadow); }
.shelfcard .t { font-weight: 700; font-size: 14px; color: var(--ink); }
.shelfcard .s { font-size: 12px; color: var(--subtle); }
.cover.lg { width: 72px; height: 96px; font-size: 22px; border-radius: 10px; }
.spine { border-left: 4px solid var(--subtle); padding-left: 10px; }
.spine.ok { border-color: var(--success); }
.spine.busy { border-color: var(--primary); }
.stamp { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; padding: 3px 10px; border-radius: var(--r-pill); border: 1.5px solid var(--subtle); color: var(--muted); white-space: nowrap; }
.stamp.ok { color: var(--success); border-color: var(--success); }
.stamp.busy { color: var(--primary); border-color: var(--primary); }
.stamp.late { color: var(--late); border-color: var(--late); }
.ledger { display: flex; flex-direction: column; }
.ledger .day { font-size: 11px; font-weight: 700; letter-spacing: 0.8px; text-transform: uppercase; color: var(--subtle); padding: 12px 0 4px; }
.ticket { border-top: 2px dashed var(--line-strong); margin-top: 12px; padding-top: 12px; }
video.preview[hidden] { display: none; }
```

- [ ] **Step 3: Verify counts**

Run: `Select-String -Path 'client/src/theme.css' -Pattern 'shelfcard|\.stamp|\.ledger|\.ticket|\.masthead|cover\.lg|video\.preview\[hidden\]' | Measure-Object -Line`
Expected: 8+ matching lines.

Run: `Select-String -Path 'client/src/cover.jsx' -Pattern "size === 'lg'"`
Expected: 1 match.

- [ ] **Step 4: Build + lint**

Run: `npm run build` in `client/` — Expected: PASS (dist emitted).
Run: `npm run lint` in `client/` — Expected: 0 errors (pre-existing warnings only).

- [ ] **Step 5: Commit**

```bash
git add client/src/theme.css client/src/cover.jsx
git commit -m "style: shared shelf/stamp/ledger/ticket system + Cover lg"
```

---

### Task 2: Desk (editorial front page) + Scan (counter slip)

**Files:**
- Modify: `client/src/pages/Desk.jsx` (masthead, stat band, stamped ledger, call-slips, ranked shelf; same 4 API calls)
- Modify: `client/src/pages/Scan.jsx` (slip header, stamped confirm, ticket receipt, hidden-attribute video)
- Test: grep + build + lint

**Interfaces:**
- Consumes: `.masthead/.stamp/.ledger/.ticket`, `Cover size="lg"`, `video.preview[hidden]` from Task 1.
- Produces: nothing downstream (leaf pages).

- [ ] **Step 1: Recompose Desk.jsx**

Keep all state/fetch/computation identical. Change only markup/classes:
- Page head: wrap in `<div className="masthead">` (title block + scan button). Replace `location.href = '/scan'` with `useNavigate()` + `nav('/scan')` (import from react-router-dom).
- Stat band: drop `tile` icon spans and colored `bg` tiles; render `<div className="card">` per stat with `<span className="num">` + `<span className="lbl">`, keep `data-tip` + `tabIndex`.
- Latest activity rows: replace `pill ok/busy` with `stamp ok/busy` (same conditions).
- Overdue side card: rows keep structure, replace `pill late` with `stamp late`.
- Popular side card: ranked shelf — prefix each `loanrow` with `<span className="mono" style={{fontWeight:800}}>{i+1}</span>`, use `<Cover title={p.title} size="lg" />`, keep `{p.n}×` chip (change class to `stamp busy`).
- Delete the now-unused icon imports (`ArrowLeftRight, LibraryBig, TriangleAlert`) and `bg` fields.

- [ ] **Step 2: Recompose Scan.jsx slip + video**

Keep `useCamera`, `ScanBox`, step state, `act/next/back/restart`, receipt data logic identical.
- Slip header: add `masthead` class to the existing title area is optional — keep `page-head`; add `ticket` class to the receipt card (`step === 2 && out` card: `className="card ticket"`).
- Confirm card (step 2, no out): replace plain `kv` summary with stamped lines — after the `dl`, add `<span className={copyCode.trim() ? 'stamp busy' : 'stamp'}>Ready to scan</span>`? No — keep minimal: add `stamp busy` "Review" marker is noise. Instead: receipt card gets `ticket` class (above) and recommendation `rec` spans stay.
- Camera block: render `<video ref={cam.v} className="preview" hidden={!camActive} />` and `<canvas ref={cam.c} hidden />` always while `step < 2`; show hint + Start button only when `!camActive`. Keep both denied hints. (This carries the companion rule from Task 1; no empty box because hidden videos render nothing.)

- [ ] **Step 3: Verify**

Run: `Select-String -Path 'client/src/pages/Desk.jsx' -Pattern 'masthead|stamp|loanrow' | Measure-Object -Line` — Expected: 5+ lines.
Run: `Select-String -Path 'client/src/pages/Scan.jsx' -Pattern 'ticket|hidden=\{!camActive\}' | Measure-Object -Line` — Expected: 2+ lines.
Run: `Select-String -Path 'client/src/pages/Desk.jsx' -Pattern 'location\.href|LibraryBig|ArrowLeftRight|TriangleAlert'` — Expected: no matches.
Run: `npm run build` in `client/` — Expected: PASS. `npm run lint` — Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Desk.jsx client/src/pages/Scan.jsx
git commit -m "style: Desk editorial front page, Scan counter slip"
```

---

### Task 3: Catalog shelf, Members cards, Activity ledger

**Files:**
- Modify: `client/src/pages/Catalog.jsx` (cover grid + All/Available/On-loan pills)
- Modify: `client/src/pages/Patrons.jsx` (library-card rows)
- Modify: `client/src/pages/Patrons.jsx`, `client/src/pages/Loans.jsx` (stamped date-grouped ledger + tabs with counts)
- Test: grep + build + lint

**Interfaces:**
- Consumes: `.shelf/.shelfcard/.spine/.stamp/.ledger` from Task 1.
- Produces: nothing downstream.

- [ ] **Step 1: Catalog cover grid**

Keep fetch + `q` filter; add `avail` filter state (`'' | 'Available' | 'On loan'`, default `''`):
```jsx
const [f, setF] = useState('');
const list = rows.filter((r) => (r.title + r.author + r.copyCode).toLowerCase().includes(q.toLowerCase()) && (!f || r.status === f));
```
Replace the table card with:
```jsx
<div className="toolbar"><div className="grow"><input placeholder="Search by name or code" value={q} onChange={(e) => setQ(e.target.value)} /></div><span className="pill">{list.length} shown</span></div>
<div className="toolbar"><button className={'secondary' + (f === '' ? ' active' : '')} onClick={() => setF('')}>All</button><button className={'secondary' + (f === 'Available' ? ' active' : '')} onClick={() => setF('Available')}>Available</button><button className={'secondary' + (f === 'On loan' ? ' active' : '')} onClick={() => setF('On loan')}>On loan</button></div>
<div className="shelf">{list.map((r, i) => <div key={i} className="shelfcard"><span className={'spine ' + (r.status === 'Available' ? 'ok' : 'busy')}><Cover title={r.title} size="lg" /></span><span className="t">{r.title}</span><span className="s">{r.author}</span><span className="mono subtle">{r.copyCode}</span><span><span className={'stamp ' + (r.status === 'Available' ? 'ok' : 'busy')}>{r.status}</span></span><a href={`http://localhost:4000/api/qr/${r.copyCode}`} target="_blank" rel="noreferrer">QR</a></div>)}</div>
{list.length === 0 && <div className="empty">Empty shelf — try a different search.</div>}
```
Delete the `<table>` block. Import `Cover` (already imported).

- [ ] **Step 2: Members library cards**

Keep fetch + `q` filter. Replace table rows with ledger cards:
```jsx
<div className="card"><div className="toolbar"><div className="grow"><input placeholder="Search by name or code" value={q} onChange={(e) => setQ(e.target.value)} /></div><span className="pill">{list.length} shown</span></div>
<div className="ledger">{list.map((p) => <div key={p.code} className="loanrow"><Cover title={p.name} /><span className="grow"><span className="t">{p.name}</span><br /><span className="subtle mono">{p.code} · {p.contact || '—'}</span></span><a href={`http://localhost:4000/api/qr/${p.code}`} target="_blank" rel="noreferrer">QR</a></div>)}</div>
{list.length === 0 && <div className="empty">No members match.</div></div>}
```
Delete the `<table>` block. No borrow-count chip (payload has none).

- [ ] **Step 3: Activity stamped ledger**

Keep `load(f)` + filter buttons; add counts fetched once on mount (same endpoints, no new API):
```jsx
const [counts, setCounts] = useState({ all: 0, active: 0, overdue: 0 });
useEffect(() => { Promise.all([api('/api/loans'), api('/api/loans?status=active'), api('/api/loans?status=overdue')]).then(([a, ac, od]) => setCounts({ all: a.length, active: ac.length, overdue: od.length })).catch(() => {}); }, []);
```
Buttons read `All ({counts.all})`, `Active ({counts.active})`, `Overdue ({counts.overdue})`. Group rendered rows by checkout date:
```jsx
const groups = {};
rows.forEach((l) => { const k = fmt(l.checkoutAt); (groups[k] = groups[k] || []).push(l); });
```
Render inside the card after the toolbar:
```jsx
<div className="ledger">{Object.entries(groups).map(([day, ls]) => <div key={day}><div className="day">{day}</div>{ls.map((l) => <div key={l.id} className="loanrow"><span className="grow"><span className="mono">{l.patronCode}</span> → {l.title || l.copyCode}<br /><span className="subtle">{fmt(l.checkoutAt)} – {fmt(l.dueAt)} · returned {fmt(l.returnAt)}</span></span>{l.returnAt ? <span className="stamp ok">Returned</span> : new Date(l.dueAt) < new Date() ? <span className="stamp late">Overdue</span> : <span className="stamp busy">Borrowed</span>}</div>)}</div>)}</div>
```
Delete the `<table>` block. Keep `pill` CSS untouched.

- [ ] **Step 4: Verify**

Run: `Select-String -Path 'client/src/pages/Catalog.jsx' -Pattern 'shelfcard|spine|stamp' | Measure-Object -Line` — Expected: 3+.
Run: `Select-String -Path 'client/src/pages/Patrons.jsx' -Pattern '<table' ; Select-String -Path 'client/src/pages/Loans.jsx' -Pattern '<table'` — Expected: no matches (all three tables gone).
Run: `npm run build` in `client/` — Expected: PASS. `npm run lint` — Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Catalog.jsx client/src/pages/Patrons.jsx client/src/pages/Loans.jsx
git commit -m "style: cover shelf, member cards, activity ledger"
```

---

### Task 4: Lookup, Login, Profile, Settings

**Files:**
- Modify: `client/src/pages/Lookup.jsx` (reader card + picks shelf)
- Modify: `client/src/pages/Login.jsx` (hero shelf strip only)
- Modify: `client/src/pages/Profile.jsx` (ledger grouping classes)
- Modify: `client/src/pages/Settings.jsx` (ledger grouping + pine-first swatches)
- Test: grep + build + lint

**Interfaces:**
- Consumes: `.shelf/.shelfcard/.stamp` from Task 1. Produces: nothing downstream.

- [ ] **Step 1: Lookup reader card + picks shelf**

Keep `code/out/go` logic. Replace the `grid two` result block with:
```jsx
<div className="grid two">
  <div className="card"><div className="loanrow"><Cover title={out.patron.name} size="lg" /><span className="grow"><h3 style={{margin:0}}>{out.patron.name}</h3><span className="subtle mono">{out.patron.code}</span></span></div>
    {out.activeLoans.length === 0 && <p className="desc">No books on loan right now.</p>}
    {out.activeLoans.map((l) => <div key={l.id} className="loanrow"><Cover title={l.title} /><span className="grow">{l.title}</span><span className="stamp busy">Due {l.dueAt ? new Date(l.dueAt).toLocaleDateString() : '—'}</span></div>)}
  </div>
  <div className="card"><h3>Picked for you</h3><p className="desc">Based on what you and similar readers borrow.</p>
    <div className="shelf">{out.recommendations.map((r) => <div key={r.id} className="shelfcard"><Cover title={r.title} size="lg" /><span className="t">{r.title}</span></div>)}</div>
  </div>
</div>
```
Delete the old `recs/rec` picks block in this file only.

- [ ] **Step 2: Login hero shelf strip**

In `loginhero .hero-inner`, after the `recs` div, insert a static strip:
```jsx
<div className="shelf" style={{marginTop:20}}>{['Dune', 'The Hobbit', 'Clean Code', 'El Filibusterismo'].map((t) => <div key={t} className="shelfcard" style={{background:'rgba(255,255,255,.12)',borderColor:'rgba(255,255,255,.35)'}}><Cover title={t} size="lg" /><span className="t" style={{color:'#fff'}}>{t}</span></div>)}</div>
```
Import `Cover` from `../cover.jsx`. No form/TOTP logic change.

- [ ] **Step 3: Profile + Settings grouping**

Profile: change the three `card` wrappers to add `ledger` rhythm is wrong (ledger is for rows) — instead: keep structure, add `masthead` to page-head? Minimal: no structural change needed; add `stamp ok` to the Saved message is already alert-styled. Concretely: replace the msg `alert` div classes so success uses `stamp ok` inline: keep the `alert` div as-is (error path), and when `msg === 'Saved.'` render `<span className="stamp ok">Saved</span>` instead. Nothing else.
Settings: replace `swatches` array first entry with pine: `['#175E3C', '#f97316', '#5e6ad2', '#0284c7']` and change the color-input fallback `'#f97316'` to `'#175E3C'`. Nothing else.

- [ ] **Step 4: Verify**

Run: `Select-String -Path 'client/src/pages/Lookup.jsx' -Pattern 'shelfcard|stamp busy' | Measure-Object -Line` — Expected: 2+.
Run: `Select-String -Path 'client/src/pages/Login.jsx' -Pattern "from '../cover.jsx'"` — Expected: 1 match.
Run: `Select-String -Path 'client/src/pages/Settings.jsx' -Pattern '#175E3C' | Measure-Object -Line` — Expected: 2+.
Run: `npm run build` in `client/` — Expected: PASS. `npm run lint` — Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Lookup.jsx client/src/pages/Login.jsx client/src/pages/Profile.jsx client/src/pages/Settings.jsx
git commit -m "style: reader card, hero shelf, ledger grouping"
```

---

### Task 5: Verification pass (spec §7)

**Files:** touch none (verification only).

- [ ] **Step 1: Final build + lint**

Run: `npm run build` in `client/` — Expected: PASS.
Run: `npm run lint` in `client/` — Expected: 0 errors.

- [ ] **Step 2: Static spec-coverage sweep**

Run: `Select-String -Path 'client/src/pages/*.jsx' -Pattern '<table' ` — Expected: no matches (all tables replaced).
Run: `Select-String -Path 'client/src/theme.css' -Pattern 'shelfcard|\.stamp|\.ledger|\.ticket|\.masthead'` — Expected: matches present.
Run: `Select-String -Path 'client/src' -Pattern 'coverwall' -Recurse` — Expected: no matches.

- [ ] **Step 3: Manual QA owed (no browser in agent env)**

With server running, eyeball at 1440/768/390 light+dark: Desk masthead/band/ledger/shelf; Scan slip+ticket, Start-gated camera, denied fallback with no empty box; Catalog/Members/Activity search+filter+empty; Lookup card+shelf; Login hero+TOTP; Profile save; Settings accent/pw/2FA; print receipt hides chrome.

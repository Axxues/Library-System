# Library Civic Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the library shell in clean civic-modern (pine) fixing all layout bugs with the shortest diff.

**Architecture:** Single live stylesheet rewrite (`theme.css`) + targeted JSX edits; delete 2 dead CSS files; no route/API changes.

**Tech Stack:** React 19 + Vite 8 + react-router-dom 7, plain CSS (no new deps).

**Spec:** `docs/superpowers/specs/2026-10-05-library-civic-redesign-design.md`

## Global Constraints

- No new dependencies — plain CSS + existing `lucide-react` icons only.
- No API/server changes — same `api()` calls, same routes.
- Keep light + dark themes (`[data-theme]`) and mobile support (390px, 768px, 1440px).
- Keep all 6 nav routes + profile/settings/lookup/login working.
- Camera-denied typed-code fallback must keep working.
- Print receipt must still hide chrome.

---

## File structure

- Rewrite: `client/src/theme.css` — sole stylesheet (tokens, shell, cards, tables, scan, login, responsive).
- Delete: `client/src/index.css`, `client/src/App.css` (dead — not imported by `main.jsx`/`App.jsx`).
- Modify: `client/src/App.jsx:63-98` — sidebar label, bottom tab bar, sticky topbar structure.
- Modify: `client/src/pages/Scan.jsx:1-134` — remove coverwall + catalog fetch, conditional camera, right-rail status.
- Light touch: `Desk.jsx`, `Catalog.jsx`, `Patrons.jsx`, `Loans.jsx`, `Lookup.jsx`, `Login.jsx` — toolbar/empty-state classnames only.

---

### Task 1: Rewrite theme.css (tokens + shell)

**Files:**
- Modify: `client/src/theme.css` (full rewrite, ~430 lines)
- Delete: `client/src/index.css`, `client/src/App.css`
- Test: `client/dist/` build output

**Interfaces:**
- Consumes: existing classnames (`shell, sidebar, sidelink, topbar, container, card, pill, table, scanlayout, camerastage, loginpage`) — keep every name so JSX keeps working.
- Produces: pine tokens + sticky shell that Tasks 2-4 rely on.

- [ ] **Step 1: Verify dead files are unimported**

Run: `grep -rn "index.css\|App.css" client/src client/index.html`
Expected: no hits (confirms safe to delete).

- [ ] **Step 2: Write new theme.css tokens + base**

Replace `:root, [data-theme="light"]` block (lines 4-29) with:

```css
:root, [data-theme="light"] {
  color-scheme: light;
  --canvas: #FBFAF7;
  --s1: #FFFFFF;
  --s2: #F4F2EC;
  --s3: #E9E5D9;
  --primary: #175E3C;
  --primary-ink: #FFFFFF;
  --hover: #134E32;
  --focus: #9AC7AD;
  --ink: #1B1E1C;
  --muted: #5A605C;
  --subtle: #8A918C;
  --line: #E7E2D6;
  --line-strong: #D8D1C0;
  --success: #15803d;
  --late: #b91c1c;
  --shadow: 0 1px 2px rgba(27,30,28,.05), 0 8px 24px -12px rgba(27,30,28,.18);
  --r-sm: 8px; --r-md: 12px; --r-lg: 16px; --r-pill: 9999px;
}
```

And `[data-theme="dark"]` (lines 30-50) with:

```css
[data-theme="dark"] {
  color-scheme: dark;
  --canvas: #101412;
  --s1: #18211D;
  --s2: #202B26;
  --s3: #2A3832;
  --primary: #4ADE80;
  --primary-ink: #052012;
  --hover: #86EFAC;
  --focus: #175E3C;
  --ink: #F2F5F2;
  --muted: #C2CBC5;
  --subtle: #8FA095;
  --line: #2A352F;
  --line-strong: #3B4942;
  --success: #4ade80;
  --late: #fca5a5;
  --shadow: 0 8px 28px rgba(0,0,0,.45);
}
```

- [ ] **Step 3: Replace shell layout (sidebar/topbar/container)**

Replace `.shell` through `.topbar .search` rules with:

```css
.shell { display: flex; min-height: 100dvh; }
.sidebar { width: 248px; flex-shrink: 0; background: var(--s1); border-right: 1px solid var(--line); display: flex; flex-direction: column; padding: 20px 12px; position: sticky; top: 0; height: 100dvh; }
.navlabel { font-size: 11px; font-weight: 700; letter-spacing: .8px; color: var(--subtle); padding: 14px 12px 6px; }
.sidelink.active { background: var(--s2); color: var(--ink); box-shadow: inset 3px 0 0 var(--primary); }
.main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.topbar { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; gap: 12px; height: 64px; padding: 0 28px; background: color-mix(in srgb, var(--canvas) 88%, transparent); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line); }
.container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 24px 28px 64px; }
.tabbar { display: none; }
@media (max-width: 1100px) {
  .sidebar { width: 68px; padding: 20px 8px; }
  .sidebar .sidelink { justify-content: center; }
  .sidebar .sidelink span.lbl, .sidebar .navlabel, .sidebar .brand span { display: none; }
}
@media (max-width: 720px) {
  .sidebar { display: none; }
  .tabbar { display: flex; position: sticky; bottom: 0; z-index: 30; background: var(--s1); border-top: 1px solid var(--line); padding: 6px 4px calc(6px + env(safe-area-inset-bottom)); }
  .tabbar a { flex: 1; text-align: center; font-size: 11px; color: var(--muted); padding: 6px 2px; border-radius: 8px; }
  .tabbar a.active { color: var(--primary); background: var(--s2); }
}
```

Note: sidebar labels need `span.lbl` — added in Task 2. Old CSS without it still works (labels just show until Task 2).

- [ ] **Step 4: Replace scan + table + login sections**

Scan: `.scanlayout{display:grid;grid-template-columns:1.15fr .85fr;gap:20px;align-items:start}` / `.statuscard{margin:0}` / `.camerastage{background:var(--s1);border:1px solid var(--line);border-radius:var(--r-lg);padding:20px}` + `.camerastage video.preview{width:100%;aspect-ratio:4/3;object-fit:cover;display:block}` / delete `.coverwall` rules. Tables: `.card:has(table){overflow-x:auto}` keep + add `.toolbar{display:flex;gap:8px;align-items:center;margin-bottom:12px}` + `.empty{text-align:center;padding:28px;color:var(--subtle)}` + `thead th{position:sticky;top:0;background:var(--s1)}`. Login: collapse duplicated `.loginpage/.loginhero` blocks into one, gradient `linear-gradient(160deg,#123F2A,#175E3C 70%)`, `.hero-logo{height:96px}`.

- [ ] **Step 5: Build + lint**

Run: `npm run build` in `client/`
Expected: PASS (`dist/index.html` emitted).

Run: `npm run lint` in `client/`
Expected: PASS (no new warnings).

- [ ] **Step 6: Commit**

```bash
git add client/src/theme.css
git rm -q client/src/index.css client/src/App.css
git commit -m "style: civic pine theme, sticky shell, delete dead css"
```

---

### Task 2: App shell JSX (sidebar label + bottom tabs)

**Files:**
- Modify: `client/src/App.jsx:16-23,71-98`
- Test: manual nav at 1440/768/390px

**Interfaces:**
- Consumes: `.navlabel`, `.tabbar`, `span.lbl` from Task 1.
- Produces: labeled nav used by all pages.

- [ ] **Step 1: Wrap link labels + add section label**

In `App.jsx` sidebar block, change:

```jsx
<div className="brand">STO.TOMAS<span> LIBRARY</span></div>
<div className="navlabel">Circulation</div>
{links.map((l) => <NavLink key={l.to} to={l.to} className={({ isActive }) => 'sidelink' + (isActive ? ' active' : '')}><span className="ico"><l.Icon size={18} /></span><span className="lbl">{l.label}</span></NavLink>)}
```

- [ ] **Step 2: Add bottom tab bar for mobile**

After `</div>` closing `.main` (before closing `.shell`), insert:

```jsx
<nav className="tabbar" aria-label="Primary">
  {links.map((l) => <NavLink key={l.to} to={l.to} className={({ isActive }) => isActive ? 'active' : ''}><l.Icon size={20} /><div>{l.label}</div></NavLink>)}
</nav>
```

- [ ] **Step 3: Verify routes still render**

Run: `npm run build` in `client/`
Expected: PASS. Manual: visit `/desk /scan /catalog /patrons /loans /lookup` — all render, active tab highlighted.

- [ ] **Step 4: Commit**

```bash
git add client/src/App.jsx
git commit -m "style: labeled sidebar sticky shell + mobile tabbar"
```

---

### Task 3: Scan flow fix (kill empty box + coverwall)

**Files:**
- Modify: `client/src/pages/Scan.jsx`
- Test: camera denied + happy path

**Interfaces:**
- Consumes: `.scanlayout .scanslip .scanvisual .camerastage .statuscard` from Task 1.
- Produces: clean 2-panel scan used by staff.

- [ ] **Step 1: Remove cover fetch + Cover import**

Delete: `import { Cover }` line, `covers` state + `useEffect(.../api/catalog...)` line, and the entire `<div className="coverwall">...</div>` block. Keep `useCamera`, `ScanBox`, steps logic untouched.

- [ ] **Step 2: Conditional camera (no empty box)**

Replace the `<aside className="scanvisual">` block with:

```jsx
<aside className="scanvisual">
  <div className="card statuscard">
    <p className="eyebrow">Reading now</p>
    {!patronCode.trim()
      ? <p className="desc">Scan a patron to begin.</p>
      : (<dl className="kv">
        <dt>Patron</dt><dd className="mono">{patronCode}</dd>
        <dt>Copy</dt><dd className="mono">{copyCode || '—'}</dd>
        <dt>Due</dt><dd>{due}</dd>
      </dl>)}
  </div>
  {step < 2 && (
    <div className="camerastage">
      {camActive
        ? (<><video ref={cam.v} className="preview" /><canvas ref={cam.c} hidden /></>)
        : (<><p className="desc">Point the camera at the QR, or type the code.</p><button className="secondary" onClick={() => { setCamActive(true); cam.start(); }} type="button">Start camera</button></>)}
      {cam.denied && <p className="desc">Camera unavailable — type the code instead.</p>}
    </div>
  )}
</aside>
```

Add `const [camActive, setCamActive] = useState(false);` next to step state; call `setCamActive(false)` inside existing `stopCams()`.

- [ ] **Step 3: Verify scan still checks out**

Run: `npm run build` in `client/`
Expected: PASS. Manual with server: patron `P-0001` → copy `B-COPY-001` → Review → Checkout shows receipt; camera-denied browser shows typed-code hint, no empty video box.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Scan.jsx
git commit -m "fix: scan conditional camera, drop coverwall clutter"
```

---

### Task 4: Page polish (toolbars + empty states + login dedupe)

**Files:**
- Modify: `client/src/pages/Desk.jsx`, `Catalog.jsx`, `Patrons.jsx`, `Loans.jsx`, `Lookup.jsx`, `Login.jsx`
- Test: visual pass

**Interfaces:**
- Consumes: `.toolbar`, `.empty` (defined in Task 1 step 4).
- Produces: consistent page heads.

- [ ] **Step 1: Add toolbar wrappers**

`Catalog.jsx` / `Patrons.jsx`: wrap search input row in `<div className="toolbar"><div className="grow">…input…</div><span className="pill">{list.length} shown</span></div>`. `Loans.jsx`: add `toolbar` class to existing filter row + count pill. `Desk.jsx`: no logic change — remove inline `style={{marginBottom:16}}` in favor of `.grid` gap (keep 3 stat cards, trend, notes, latest + side stack as-is).

- [ ] **Step 2: Empty states**

After each table add: `{list.length === 0 && <div className="empty">No results — try a different search.</div>}` (keep existing copy where present; unify class to `empty`).

- [ ] **Step 3: Login dedupe**

`Login.jsx`: no logic change. Verify hero logo renders at 96px and single gradient from Task 1 covers both themes.

- [ ] **Step 4: Build + lint**

Run: `npm run build` in `client/` — Expected: PASS.
Run: `npm run lint` in `client/` — Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages
git commit -m "style: consistent toolbars and empty states"
```

---

### Task 5: Verification pass (themes + breakpoints + print)

**Files:**
- Touch none (verification only).

- [ ] **Step 1: Light/dark screenshot check**

Manual: toggle theme on Desk + Scan — pine accent readable on both, no white-on-white or black-on-black text.

- [ ] **Step 2: Breakpoint check**

Manual widths 1440 / 768 / 390: sidebar → rail → tabbar; scan stacks to 1 col; tables scroll inside cards; no horizontal page scroll.

- [ ] **Step 3: Print check**

On Scan receipt: `window.print()` hides sidebar/topbar/tabbar/actions (existing `@media print` rule).

- [ ] **Step 4: Final build**

Run: `npm run build` in `client/` — Expected: PASS.

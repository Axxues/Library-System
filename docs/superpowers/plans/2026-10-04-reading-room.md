# Reading Room Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the app shell in Reading Room language and give Scan a two-column slip + visual column.

**Architecture:** CSS-first change in `theme.css` plus a Scan.jsx restructure that reuses existing circulation logic and data endpoints. No new dependencies, no router changes.

**Tech Stack:** Vite + React (client), Fraunces via Google Fonts, existing CSS variables.

**Spec:** `docs/superpowers/specs/2026-10-04-reading-room-design.md`

## Global Constraints

- Reuse `--canvas`, `--s1`, `--primary`, `--line`; no new accent hue.
- Fraunces 600 for page titles (`h2`) and receipt masthead only.
- Scan layout `1fr 360px`, stacks below 900px.
- Camera denial shows inline hint with typed-code fallback, never `alert()`.

---

### Task 1: Display type + shell titles

**Files:**
- Modify: `client/index.html` (add Fraunces font link)
- Modify: `client/src/theme.css` (add `--display` var, `.page-head h2` serif rule)
- Test: `check-reading-room-1.mjs` (temp file in `C:\Users\JV\AppData\Local\Temp\opencode`, deleted after)

**Interfaces:**
- Consumes: existing Google Fonts link block in `client/index.html`, `:root` vars in `theme.css`.
- Produces: `--display: "Fraunces", Georgia, serif` var and `.page-head h2` rule that Tasks 2-3 rely on for titles.

- [ ] **Step 1: Write the failing check**

```js
// check-reading-room-1.mjs
import fs from 'node:fs';
import assert from 'node:assert';
const html = fs.readFileSync('client/index.html', 'utf8');
const css = fs.readFileSync('client/src/theme.css', 'utf8');
assert.match(html, /Fraunces/, 'index.html must load Fraunces');
assert.match(css, /--display/, 'theme.css must define --display');
assert.match(css, /\.page-head h2/, 'theme.css must style page-head h2');
console.log('task1 ok');
```

- [ ] **Step 2: Run check to verify it fails**

Run: `node C:\Users\JV\AppData\Local\Temp\opencode\check-reading-room-1.mjs` from repo root
Expected: FAIL with assertion error (no Fraunces / --display yet)

- [ ] **Step 3: Write minimal implementation**

In `client/index.html`, extend the existing Google Fonts `href` to include `Fraunces:wght@600` (one link, no new preconnects).

In `client/src/theme.css`, add to `:root, [data-theme="light"]` block:

```css
--display: "Fraunces", Georgia, serif;
```

And add rule (near `.page-head`):

```css
.page-head h2 { font-family: var(--display); font-size: 28px; font-weight: 600; letter-spacing: -0.3px; }
```

- [ ] **Step 4: Run check to verify it passes**

Run: `node C:\Users\JV\AppData\Local\Temp\opencode\check-reading-room-1.mjs` then `npm run build --prefix client`
Expected: PASS (`task1 ok`), build succeeds

- [ ] **Step 5: Commit**

```bash
git add client/index.html client/src/theme.css
git commit -m "feat: reading-room display type and shell titles"
```

### Task 2: Scan two-column slip + camera stage

**Files:**
- Modify: `client/src/pages/Scan.jsx`
- Modify: `client/src/theme.css` (append scan layout rules)
- Test: `check-reading-room-2.mjs` (temp file, deleted after)

**Interfaces:**
- Consumes: `--display` var and `.page-head h2` from Task 1; existing `useCamera`, `ScanBox`, `act()` logic in `Scan.jsx` (unchanged signatures).
- Produces: `.scanlayout`, `.scanvisual`, `.camerastage`, `.loanslip` classes; `Scan` renders `<div className="scanlayout">` with slip + visual column.

- [ ] **Step 1: Write the failing check**

```js
// check-reading-room-2.mjs
import fs from 'node:fs';
import assert from 'node:assert';
const jsx = fs.readFileSync('client/src/pages/Scan.jsx', 'utf8');
const css = fs.readFileSync('client/src/theme.css', 'utf8');
assert.match(jsx, /scanlayout/, 'Scan.jsx must render scanlayout');
assert.match(jsx, /scanvisual/, 'Scan.jsx must render visual column');
assert.match(css, /\.scanlayout/, 'theme.css must define scanlayout grid');
assert.match(css, /\.camerastage/, 'theme.css must define camerastage');
console.log('task2 ok');
```

- [ ] **Step 2: Run check to verify it fails**

Run: `node C:\Users\JV\AppData\Local\Temp\opencode\check-reading-room-2.mjs` from repo root
Expected: FAIL with assertion error

- [ ] **Step 3: Write minimal implementation**

In `client/src/pages/Scan.jsx`: wrap the step cards + new aside in:

```jsx
<div className="scanlayout">
  <div className="scanslip">{/* existing step cards unchanged */}</div>
  <aside className="scanvisual">
    <div className="camerastage">{/* move ScanBox camera preview here on steps 0-1; step 2 shows loan slip */}</div>
  </aside>
</div>
```

Keep `useCamera`, `ScanBox`, `act()`, step state, validation, and inline `formerr` exactly as-is; only relocate where the `<video>` preview mounts (large stage) and show a "reading now" slip (patron + copy + due) in the visual column. Camera denial keeps typed-code fallback with an inline hint, no `alert()`.

In `client/src/theme.css` append:

```css
.scanlayout { display: grid; grid-template-columns: 1fr 360px; gap: 16px; align-items: start; }
.scanvisual { display: flex; flex-direction: column; gap: 16px; }
.camerastage { background: var(--s1); border: 1px solid var(--line); border-radius: var(--r-lg); padding: 16px; box-shadow: var(--shadow); }
.camerastage video.preview { width: 100%; }
@media (max-width: 900px) { .scanlayout { grid-template-columns: 1fr; } }
```

- [ ] **Step 4: Run check to verify it passes**

Run: `node C:\Users\JV\AppData\Local\Temp\opencode\check-reading-room-2.mjs` then `npm run build --prefix client`
Expected: PASS (`task2 ok`), build succeeds

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Scan.jsx client/src/theme.css
git commit -m "feat: scan two-column slip with camera stage"
```

### Task 3: Cover wall + responsive finish

**Files:**
- Modify: `client/src/pages/Scan.jsx` (cover wall using `/api/catalog` + recent loans)
- Modify: `client/src/theme.css` (cover wall rules)
- Test: `check-reading-room-3.mjs` (temp file, deleted after)

**Interfaces:**
- Consumes: `.scanlayout` / `.scanvisual` from Task 2; `Cover` from `client/src/cover.jsx`; `api` from `client/src/api.js`.
- Produces: visual column shows cover wall; empty states invite ("Scan a patron to begin"); 360px mobile stacks.

- [ ] **Step 1: Write the failing check**

```js
// check-reading-room-3.mjs
import fs from 'node:fs';
import assert from 'node:assert';
const jsx = fs.readFileSync('client/src/pages/Scan.jsx', 'utf8');
const css = fs.readFileSync('client/src/theme.css', 'utf8');
assert.match(jsx, /\/api\/catalog/, 'Scan.jsx must fetch catalog for covers');
assert.match(jsx, /coverwall/, 'Scan.jsx must render cover wall');
assert.match(css, /\.coverwall/, 'theme.css must define coverwall');
console.log('task3 ok');
```

- [ ] **Step 2: Run check to verify it fails**

Run: `node C:\Users\JV\AppData\Local\Temp\opencode\check-reading-room-3.mjs` from repo root
Expected: FAIL with assertion error

- [ ] **Step 3: Write minimal implementation**

In `client/src/pages/Scan.jsx`: on mount fetch `api('/api/catalog')` (take first 6 with covers) for the cover wall; empty visual states render invitation copy, never blank. Reuse `Cover` component. No new endpoints.

In `client/src/theme.css` append:

```css
.coverwall { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.coverwall .covertitle { font-size: 11px; color: var(--subtle); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
```

Verify 360px mobile: visual column stacks below slip (covered by Task 2 media query); confirm no horizontal scroll.

- [ ] **Step 4: Run check to verify it passes**

Run: `node C:\Users\JV\AppData\Local\Temp\opencode\check-reading-room-3.mjs` then `npm run build --prefix client`
Expected: PASS (`task3 ok`), build succeeds; manual light/dark + mobile check

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Scan.jsx client/src/theme.css
git commit -m "feat: scan cover wall and responsive finish"
```

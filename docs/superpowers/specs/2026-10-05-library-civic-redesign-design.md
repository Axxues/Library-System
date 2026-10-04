# Library Civic Redesign — Design Spec (Approach B)

Date: 2026-10-05
Status: approved in chat (tokens / shell / pages+scan)
Scope: Full UX rethink, clean civic modern, keep light+dark + mobile. No new deps.

## 1. Problem (verified in repo)

- `client/src/theme.css` is the only live stylesheet (`App.jsx` imports it; `main.jsx` imports nothing else). `index.css` (`#root 1126px, text-align:center`) and `App.css` (Vite demo + nesting) are dead files — delete them.
- Shell bug: `.topbar{position:fixed; left:232px}` + `.main{padding-top:64px}` drifts on zoom/scroll; `.sidebar{width:232px; height:100vh}` with no collapse; below 900px sidebar vanishes with no mobile nav (staff loses nav on phone).
- `.container` has no max-width → ultra-wide stretch; tables `min-width:520px` inside cards with no toolbar.
- Scan page (`pages/Scan.jsx`): `.camerastage` always renders an empty 200px `video.preview` box; `coverwall` dumps 6 covers under the camera (the clutter in the screenshot); `scanlayout 1fr 360px` squeezes the form.
- Visual: warm beige `#f6f3ee` + orange `#f97316` reads placeholder; serif `Fraunces` only on page-head; radius scale 6/10/16/20 inconsistent; login hero has duplicated rule blocks.

## 2. Tokens (light + dark)

- Light: `--canvas:#FBFAF7; --s1:#FFFFFF; --s2:#F4F2EC; --s3:#E9E5D9; --ink:#1B1E1C; --muted:#5A605C; --subtle:#8A918C; --line:#E7E2D6; --line-strong:#D8D1C0; --primary:#175E3C (pine); --primary-ink:#fff; --hover:#134E32; --focus:#9AC7AD; --success:#15803d; --late:#b91c1c`
- Dark: `--canvas:#101412; --s1:#18211D; --s2:#202B26; --s3:#2A3832; --ink:#F2F5F2; --muted:#C2CBC5; --subtle:#8FA095; --line:#2A352F; --line-strong:#3B4942; --primary:#4ADE80; --primary-ink:#052012; --hover:#86EFAC; --success:#4ade80; --late:#fca5a5`
- Type: `Inter, Plus Jakarta Sans` body; `Fraunces` display only for `.page-head h2` + login h1. Mono unchanged.
- Radius: 8 / 12 / 16 + pill. Shadow single soft level. Contrast target ≥ 4.5:1 for body.

## 3. Shell

- `248px` sticky sidebar (`position:sticky; height:100dvh`), brand lockup + section label "CIRCULATION", active link = `s2` fill + 3px pine left bar via `box-shadow: inset 3px 0 0 var(--primary)` (not full-color fill).
- `<1100px`: icon rail (64px, labels hidden). `<720px`: sidebar hidden, bottom tab bar with same 6 links.
- Topbar: `position:sticky; top:0` inside `.main` (no `left:232px` fixed hack), search `max-width:480px` + real label, theme toggle + user chip right.
- `.container{max-width:1200px; padding:24px 28px 64px}`. Page-head pattern: crumbs + h2 + desc + actions row.

## 4. Pages

- Desk: 3 stat cards (titles / on-loan / overdue), trend card, `content (1fr) + side (320px)` grid → single col <1024px. Notes row 3-up → 1-up <720px.
- Catalog / Patrons / Loans: card with toolbar row (search input + count + filter pills), table with sticky header, `cellmain` cover+title, status pills. Empty state component (icon + line + action).
- Lookup (public): centered `max-width:720px` card, patron summary + loans + picks.
- Login: keep split hero, remove duplicated CSS blocks, single gradient pine `#123F2A→#175E3C`, seal 96px, form card 400px with proper labels + error region.

## 5. Scan flow (biggest fix)

- Grid `1.15fr .85fr`, gap 20px → 1 col <960px.
- Left slip: step cards unchanged logically (Patron → Copy → Confirm/Receipt).
- Right rail: `status` card (Reading now kv) always visible; `camera` card only when Camera pressed (`video` full-width `aspect-ratio:4/3`, `display:none` until stream active) — kills the empty box. Denied → inline hint, no video element.
- Delete `coverwall` from Scan (covers belong on Desk/Popular). Recommendations stay on receipt as pills.
- Buttons: Back=secondary left, primary action right; `disabled` states while `!code.trim() || busy`.

## 6. Data flow / error handling

- No API change. Same `api()` calls, same routes. Forms keep `role=alert` error blocks; camera `denied` state preserved.
- Reduced-motion respected (existing media query kept). Focus rings pine 3px mix.

## 7. Testing

- `vite build` in `client/` passes; manual check Desk / Scan / Catalog at 1440 / 768 / 390px light+dark; camera denied path typed-code fallback; print receipt still hides chrome.

## Files touched

- Rewrite `client/src/theme.css` (single source). Delete `client/src/index.css`, `client/src/App.css`.
- Edit `client/src/App.jsx` (sidebar section label, bottom nav, sticky topbar structure — no route changes).
- Edit `client/src/pages/Scan.jsx` (remove coverwall fetch/render, conditional camera, right-rail status).
- Light touch `Desk.jsx`, `Catalog.jsx`, `Patrons.jsx`, `Loans.jsx`, `Lookup.jsx`, `Login.jsx` (toolbar/empty-state/classnames only).

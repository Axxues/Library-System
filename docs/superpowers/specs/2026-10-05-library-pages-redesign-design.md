# Library Pages Redesign — Design Spec (Approach A, cover-led)

Date: 2026-10-05
Status: approved in chat (Desk+Scan / collections / edges)
Scope: All 9 pages, one pass. Bookish & rich; fixes generic/boring composition (not just tokens).
Supersedes note: absorbs the pending `video.preview[hidden]{display:none}` companion rule into the Scan redesign.

## 1. Problem (verified in repo)

Round 1 (civic shell, commits up to 4a44db2) reskinned tokens/shell but left every page as the same white card + gray table composition: Desk, Catalog, Patrons, Loans all render `.card > table` with identical rhythm; no page has its own identity. Generic composition, not color, is what reads boring.

## 2. Shared system (all pages)

- Tokens unchanged: pine `#175E3C` / mint dark, paper `#FBFAF7` / ink dark (from civic spec).
- Fraunces serif returns for `.page-head h2` + login headline only; body stays Plus Jakarta Sans/Inter; mono for codes unchanged.
- Additions to `client/src/theme.css`: `.shelf` cover-grid (auto-fill minmax 150px, gap 20px), `.shelfcard` (cover large, title, meta, spine-stripe availability: 4px left bar in status color), `.stamp` rubber-stamp pills (uppercase, letter-spaced, bordered), `.ledger` date-grouped rows, `.ticket` perforated stub (dashed divider), `.masthead` editorial title row.
- `Cover` (`client/src/cover.jsx`) gains `size="lg"` variant (96px, radius 10px); deterministic hues kept, no image assets.
- No API/server/route changes. No new deps. Light+dark via `[data-theme]`; responsive 1440/768/390; reduced-motion + print rules kept (print also hides `.tabbar`).

## 3. Section 1 — Desk + Scan

- Desk (`pages/Desk.jsx`): masthead row (date-line left, "Go to scan" primary right; use `nav()` not `location.href`); stat band as ledger figures (big numerals + thin rules, drop colored icon tiles but keep `data-tip` tooltips); full-width trend chart card unchanged in data; content rail: Latest activity as stamped ledger rows (Returned/On-loan stamps); side rail: Overdue as call-slips (title, patron code, due stamp, Late stamp), Popular as ranked shelf (rank numeral + Cover + title + borrow-count chip). Same 4 API calls, same slices.
- Scan (`pages/Scan.jsx`): counter slip (left) — slip header with 3-step progress, patron/book lines via existing `ScanBox`, confirm as stamped summary (patron/copy mono, action buttons Return/Checkout), receipt as perforated ticket stub (meta row, kv, recommendation pills, Print/Scan-next). Right rail: Reading-now ticket (always visible) + camera card: Start-gated, video+canvas always mounted while step<2 with `hidden` until active, denied hint preserved; companion rule `video.preview[hidden]{display:none}` added (author `display:block` beats UA hidden). `useCamera`, step logic, `act/next/back/restart` untouched.

## 4. Section 2 — Catalog, Members, Activity

- Catalog (`pages/Catalog.jsx`): cover-grid shelf primary (no table): shelfcard per copy — Cover lg, title, author, copyCode mono, availability spine-stripe + stamp, QR link action. Toolbar: search + `{n} shown` pill. Filters: All/Available/On-loan pills (client-side on existing `status`). Empty shelf state.
- Members (`pages/Patrons.jsx`): library-card ledger rows — seal avatar (initials, deterministic hue), name + code mono, contact, QR action. No borrow-count chip (payload has no counts; YAGNI). Search + count toolbar; empty state.
- Activity (`pages/Loans.jsx`): stamped ledger grouped by checkout date: rows patron mono → title, Borrow–Due range, Returned, status stamp (Borrowed/Overdue/Returned). Filter tabs All/Active/Overdue with counts. Same `/api/loans?status=` calls.

## 5. Section 3 — Lookup, Login, Profile, Settings

- Lookup (`pages/Lookup.jsx`, public): reader card (seal, name, code, active loans as due-slips) + picks shelf (cover row of recommendations). Same recommendations endpoint; error alert kept.
- Login (`pages/Login.jsx`): bookish split — hero keeps pine gradient + seal, adds featured-shelf strip (static covers from everyday titles, CSS only) under serif headline; form card unchanged (username/password, test-account button, TOTP step, error alert, theme toggle).
- Profile (`pages/Profile.jsx`): staff ledger — photo card (128px preview, file input, downscale kept), identity card (all fields + role pill), address card (street + 2×2 grid), save slip with inline Saved/error message. No logic change.
- Settings (`pages/Settings.jsx`): grouped ledger — appearance card (swatches as book-cloth circles + custom color + save/reset), password card, 2FA card (status pill, setup QR + verify, disable with prompt). No logic change; swatch defaults re-tinted pine-first (custom values untouched).

## 6. Data flow / error handling

- No endpoint, param, or response-shape changes on any page. All filters client-side on existing payloads. Form validations, TOTP flows, avatar downscale, accent apply, camera denied path, print-receipt chrome hiding all preserved verbatim.
- Accessibility: focus rings kept; stamps are text (not color-only); covers keep title text alongside; `role=alert` regions kept; motion respects existing media query.

## 7. Testing

- `npm run build` + `npm run lint` in `client/` PASS per change (0 errors; pre-existing warnings in Scan/cover accepted).
- Manual with server: Desk loads (4 calls), Scan P-0001→B-COPY-001 receipt + Start-gated camera + denied fallback with no empty box, Catalog/Members/Activity search+filter+empty states, Lookup recs, Login pw+TOTP, Profile save, Settings accent/pw/2FA — at 1440/768/390 light+dark.

## Files touched

- Rewrite-add to `client/src/theme.css` (shelf, stamp, ledger, ticket, masthead, serif heads, video-hidden rule).
- Small edit `client/src/cover.jsx` (lg variant).
- Recompose `Desk.jsx`, `Scan.jsx`, `Catalog.jsx`, `Patrons.jsx`, `Loans.jsx`, `Lookup.jsx`, `Login.jsx` (hero strip only), `Profile.jsx`, `Settings.jsx` (grouping/classes only).
- Untouched: `App.jsx` shell, `api.js`, server, routes.

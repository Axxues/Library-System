# Library System Design — Dual QR + Tri-Hybrid Recommender
Date: 2026-09-28 | Stack: React Vite + Node/Express + SQL Server Local Express | Theme: DESIGN.md Linear

## 1. Goal
Replace paper ledgers at Sto. Tomas Municipal Library with: dual-QR borrow/return in one request, real-time availability, borrower history/overdue, QR generation, patron self-lookup with personal recommendations. Minimal thesis metrics (no eval dashboard).

## 2. Architecture (monorepo, ponytail: fewest files)
```
prototype/
  client/ (Vite React: /login, /desk, /catalog, /patrons, /loans, /lookup)
  server/index.js (Express API + recommender scorer)
  db/schema.sql + seed.sql
  docs/superpowers/specs/2026-09-28-library-system-design.md
```
- Auth: admin/staff login (bcrypt + session JWT). Patrons: no login — `/lookup` by typed ID or camera QR.
- QR codes: `P-0001` (patron), `B-COPY-001` (book copy). Gen via `qrcode` lib, print from UI. Scan via laptop camera (`jsQR`) + manual text fallback.
- Deps only: `express, mssql, bcryptjs, jsonwebtoken, qrcode, cors, dotenv` + `react-router-dom, jsQR, qrcode.react`.

## 3. Data (6 tables)
- Users(id, username, hash, role: admin|staff)
- Patrons(id, code UNIQUE, name, contact, active)
- Books(id, title, author, genre, classification)
- BookCopies(id, copyCode UNIQUE, bookId FK, status: Available|Borrowed)
- Loans(id, patronId FK, copyId FK, checkoutAt, dueAt, returnAt NULL, ms)
- Logs(id, at, action, detail, ms)
- Atomic rule: checkout/return wrapped in `BEGIN TRAN / COMMIT`, `ROLLBACK` on any fail.

## 4. Single-execution flow
`POST /api/circulation {patronCode, copyCode, action: checkout|return}`:
1. Verify patron active, verify copy status.
2. Insert Loans (dueAt = checkoutAt + 7 days) / set returnAt, flip BookCopies.status, write Logs with ms.
3. Run recommender in same request, return `{loan, recommendations[5]}`.
- No multi-request chain. Overdue = `dueAt < NOW AND returnAt IS NULL` (flag only, does not block checkout — ponytail: block when library demands it).

## 5. Tri-hybrid recommender (~60 lines, no ML server)
- Content: +3 same author, +2 same genre/classification vs patron history + just-scanned book.
- Collaborative: co-borrow count — patrons who took X also took Y (from Loans).
- Popularity: total loan count per book. Cold-start (no history) → popularity only.
- Score = sum, top-5, returned on receipt + `/lookup`.

## 6. UI + DESIGN.md tokens
- Tokens: canvas `#010102`, surface-1 `#0f1011`, surface-2 `#141516`, primary `#5e6ad2`, hover `#828fff`, ink `#f7f8f8`, muted `#d0d6e0`, subtle `#8a8f98`, hairline `#23252a`. Font: Inter (Linear substitute), mono for codes. Buttons 8px, cards 12px + 1px hairline, screenshot panels 16px.
- Desk: two scan boxes (patron + book) with camera toggle, action button, receipt panel with recs + print.
- Lookup: input ID/QR → my active loans, overdue flag, personal top-5.

## 7. Error handling
400 + rollback on: unknown QR, inactive patron, copy already Borrowed / not Borrowed on return. No partial writes. Role guard: desk/catalog/patrons require staff+.

## 8. Checks (one runnable)
`seed.sql` loads demo patrons/books/loans. `demo.js` asserts: checkout flips to Borrowed → recs length 5 → return flips to Available → overdue query works. Manual: one camera scan test.

## 9. Skipped (ponytail)
ORM, eval dashboard (Precision@K/MRR/t-test UI), RFID, cloud deploy, patron passwords. Add when panel demands numbers.

# Add Books + Per-Copy Condition Design Spec (2026-10-06)

## Goal
Staff can add new titles with copies (each copy keeps its unique `copyCode`/QR) and track per-copy condition (Good / Worn / Damaged) as staff information that never blocks circulation.

## Approaches considered
- **A — One full-stack slice (chosen):** migration + POST catalog + PATCH condition + Add Books page + Books Condition column + Scan receipt badge. Single spec, shippable.
- **B — Phased (rejected):** Add Books now, condition later. Two specs, slower to value.
- **C — Heavy (rejected, noted future):** condition history table + copy detail drawer + repair workflow. Ruled out by the simple-label decision.

## Architecture
MSSQL backend (`server/index.js`, `mssql`), React JSX client (`client/`). One migration file following the existing `db/migrate-*.sql` pattern. Two new/changed API endpoints reusing the existing `auth` middleware (any logged-in staff, same as all current catalog endpoints). Frontend: one new page, one new table column, one new receipt badge. No dependency changes.

## Components
- **Data (`db/migrate-condition.sql`):** `ALTER TABLE BookCopies ADD condition NVARCHAR(10) NOT NULL DEFAULT 'Good' CHECK (condition IN ('Good','Worn','Damaged'))`. Existing rows backfill to `Good`. Seed file untouched.
- **API `POST /api/catalog` (new):** body `{title, author, genre, classification?, copies}`. Requires non-empty title/author/genre; `copies` integer 1–50 else 400 with a plain message. Creates the Books row, then N BookCopies rows with the next global codes in `B-COPY-%03d` format (1 + max numeric suffix across BookCopies, widening past 999). All inserts in one transaction. On UNIQUE collision of a generated code, regenerates once from a fresh max and retries, else 500. Returns `{book: {id, title, author, genre, classification}, copies: [{copyCode, qrUrl}]}` where `qrUrl` is `/api/qr/<copyCode>`.
- **API `PATCH /api/copies/:code/condition` (new):** body `{condition}`. Must be Good/Worn/Damaged else 400; unknown code 404. Updates the single row, returns `{copyCode, condition}`.
- **API `GET /api/catalog` (changed):** select adds `c.condition`. Response shape otherwise identical.
- **API `POST /api/circulation` (changed):** response adds the acting copy's `condition` string so Scan can render the receipt badge. No rule changes: condition never blocks checkout or return.
- **Page `client/src/pages/AddBook.jsx` (new, route `/catalog/new`):** form with Title, Author, Genre, Classification (optional), Copies count (default 1). Client validation mirrors the server (required fields, 1–50). Submit POSTs; on success replaces the form with a QR sheet: one row per new copy showing copyCode, `<img src="/api/qr/<code>">`, and a Print button (`window.print()`, same pattern as Scan receipt). Server errors render in a `role="alert"` block; logic for TOTP/login untouched.
- **Books table `client/src/pages/Catalog.jsx` (changed):** new Condition column rendering a Badge (Good → success, Worn → warning, Damaged → destructive) plus an inline select (Good/Worn/Damaged). Changing the select PATCHes optimistically and reverts to the previous value with a `role="alert"` message on failure. Entry point: an "Add books" Button in the Books header navigating to `/catalog/new`. Sidebar unchanged.
- **Scan receipt `client/src/pages/Scan.jsx` (changed):** shows the scanned copy's condition as a read-only Badge next to the existing timing badge, sourced from the circulation response (server includes `condition` for the copy) — display only, no editing here.

## Data flow
Add Books form → POST /api/catalog → QR sheet (print anytime via QR image URLs). Books table loads condition via GET /api/catalog; select change → PATCH → badge updates. Scan checkout/return response carries the copy's condition → receipt badge. Circulation checkout/return rules unchanged: condition never blocks a loan.

## Error handling
- POST validation failures return 400 with messages the form shows verbatim (`title required`, `copies must be 1-50`).
- PATCH invalid value 400, unknown copyCode 404; the row select reverts and shows the message.
- Code-collision retry limited to one regeneration; persistent failure is a 500 with `could not allocate copy codes`.
- Unreachable server keeps the existing `unreachable` message convention on every touched call.

## Testing
- `node --test test/`: new cases — POST creates a book with exactly N sequentially-coded copies; POST rejects missing title and copies=0/51; PATCH round-trips Good→Damaged→Good; PATCH rejects `Broken` and unknown code; GET /api/catalog rows include `condition`.
- Client: `npm run build` passes; manual loop — add a 2-copy book, print QR sheet, change one copy to Worn, reload Books (persists), scan that copy (badge shows Worn), checkout still succeeds.

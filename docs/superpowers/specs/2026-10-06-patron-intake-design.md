# Member Intake Upgrade Design Spec (2026-10-06)

## Goal
Member registration captures structured identity (first/middle/last name), email, secondary contact, structured address, and profile photo — and staff can edit these later. Display name behavior everywhere else stays identical.

## Approaches considered
- **A — One slice (chosen):** migration + POST/PUT + add form + directory edit in a single spec.
- **B — Phased (rejected):** add-form fields now, editing later. Slower to value.
- **C — Member profile page (rejected, noted future):** dedicated per-member page. Heavier than asked.

## Architecture
MSSQL backend (`server/index.js`), React JSX client. One migration following `db/migrate-*.sql`. Endpoints reuse `auth` (any logged-in staff). Photo reuses the staff Profile downscale pattern (128px JPEG dataURL, 50KB cap). No dependency changes.

## Components
- **Data (`db/migrate-patron-intake.sql`):** `ALTER TABLE Patrons ADD firstName NVARCHAR(100) NULL, middleName NVARCHAR(100) NULL, lastName NVARCHAR(100) NULL, email NVARCHAR(100) NULL, contact2 NVARCHAR(100) NULL, addrStreet NVARCHAR(100) NULL, addrBarangay NVARCHAR(100) NULL, addrCity NVARCHAR(100) NULL, addrProvince NVARCHAR(100) NULL, addrPostal NVARCHAR(20) NULL, avatar NVARCHAR(MAX) NULL`. `name` stays NOT NULL as the display value; existing rows untouched (parts NULL, display falls back to `name`).
- **API `POST /api/patrons` (changed):** accepts `firstName, middleName, lastName, email, contact2, addrStreet, addrBarangay, addrCity, addrProvince, addrPostal, avatar` alongside legacy `name/contact`. When any name part is present, requires non-empty first and last name and composes `name` as their space-joined non-empty parts; otherwise legacy `name required` rule applies. Avatar over 50000 chars → 400 `picture too large (50KB max)` (same message as profile). Contact fields stored trimmed-or-null. Returns the inserted row.
- **API `PUT /api/patrons/:code` (new):** same field set and validation as POST; unknown code → 404 `unknown patron`; returns the updated row. Code itself is immutable.
- **API `GET /api/patrons` (unchanged):** `SELECT *` already exposes the new columns.
- **Page `client/src/pages/AddPatron.jsx` (changed):** form gains First/Middle/Last name, Email, Contact + Secondary contact, the five address fields (same labels as staff Profile), and photo upload with preview (downscale helper shared by copying the Profile pattern, not by importing across pages). Success view shows the composed name and photo. Validation messages via `role="alert"`.
- **Page `client/src/pages/Patrons.jsx` (changed):** directory rows show avatar photo (fallback initials, as today) plus secondary contact/email where present; an Edit action per row opens a dialog reusing the AddPatron field set, saving via PUT and refetching. Search also matches email and contact2.
- **Untouched:** Lookup, Scan, receipts, QR labels, recommendations — all keep reading `name`.

## Data flow
Add form → POST → QR pass (unchanged shape, composed name). Directory loads via GET; Edit dialog PUTs one row and refetches. Photo never leaves the Patrons row (dataURL in `avatar`, same as staff profiles).

## Error handling
- POST/PUT validation failures return 400 with messages the UI shows verbatim (`first and last name required`, `picture too large (50KB max)`).
- PUT unknown code 404; unreachable server keeps the `unreachable` convention.
- Failed PUT keeps the dialog open with the message; the row only updates on success.

## Testing
- `node --test test/`: POST with parts composes `First Middle Last`; POST part-without-last 400s; PUT round-trips address/email/photo; PUT unknown code 404s; GET rows include new columns.
- Client: `npm run build` passes; manual loop — register with photo, edit address + secondary contact, reload directory (persists), QR pass shows composed name.

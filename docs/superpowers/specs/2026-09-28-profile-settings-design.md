# Profile + Settings Design
Date: 2026-09-28 | Approach: extend Users (Approach 1) | Dep add: otplib

## 1. Goal
Staff profile page (names, DOB, email, phone, static role, normalized address,
file-picker avatar with preview) and settings page (accent swatches + color
wheel, password change, real TOTP 2FA). No changes for users who ignore them.

## 2. Data (db/migrate-profile.sql, all nullable except totpEnabled default)
ALTER TABLE Users ADD firstName NVARCHAR(50), middleName NVARCHAR(50),
lastName NVARCHAR(50), dob DATE, email NVARCHAR(100), phone NVARCHAR(30),
addrStreet NVARCHAR(120), addrBarangay NVARCHAR(80), addrCity NVARCHAR(80),
addrProvince NVARCHAR(80), addrPostal NVARCHAR(10), avatar NVARCHAR(MAX),
totpSecret NVARCHAR(100), totpEnabled BIT NOT NULL DEFAULT 0,
accent NVARCHAR(7). Address normalized = one value per column, no free-text blob.

## 3. API (auth, self-only; admin list unchanged)
- GET /api/profile — row minus hash/totpSecret.
- PUT /api/profile — first/last required, avatar base64 ≤50KB checked server-side.
- POST /api/settings/password — verifies current pw via bcrypt, hashes new (min 6).
- POST /api/settings/totp/setup — creates secret (not yet enabled), returns otpauth_url + QR PNG.
- POST /api/settings/totp/verify — correct code → totpEnabled=1. Wrong → 400.
- POST /api/settings/totp/disable — requires current password.
- POST /api/settings/accent — validates ^#[0-9a-fA-F]{6}$ or null (reset).
- POST /api/auth/login — unchanged shape, plus: correct pw + totpEnabled → 200 { totpRequired: true, userId } WITHOUT token.
- POST /api/auth/totp — { userId, code } valid → { token, role } like login.

## 4. UI (gated; sidenav Profile ◍, Settings ⚙; dropdown gains both links)
- /profile: avatar card (128px preview, file picker downscales to JPEG client-side)
  + identity form + static role pill + address group. Save → PUT, topbar chip photo refreshes.
- /settings: Appearance (4 swatches + <input type=color> + reset; applies --primary live, persists per user),
  Password (current/new/confirm), 2FA (status pill, QR + code box to enable, disable w/ password).
- Accent applies as document-level --primary override loaded post-login; login screen keeps default accent.

## 5. Checks (demo-profile.js)
Profile update→read-back match; wrong-current-pw 400; bad accent 400; oversize avatar 400;
TOTP setup→verify→login returns totpRequired→/auth/totp wrong code 401→right code token.
Existing suites + demo.js stay green.

## 6. Skipped (ponytail)
Disk uploads/multer, email-2FA, admin editing others' profiles, backup codes for TOTP
(manual secret reset by admin via DB). Add when the library outgrows single-desk use.

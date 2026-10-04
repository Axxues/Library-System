# Reading Room — App Shell Redesign (2026-10-04)

Scope: whole app shell, Scan-first. Fills Scan's empty right side with
visual richness (camera presence, covers, loan slip), not more tables.

## Tokens

- Color: reuse existing `--canvas` (paper `#f6f3ee` / ember `#15110c`),
  `--s1` card, `--primary` orange (`#f97316` / `#fb8126`), `--line`.
  No new accent hue.
- Type: Plus Jakarta Sans stays for UI/body. Add Fraunces 600 for page
  titles (`h2`) + receipt masthead only. Mono (`ui-monospace`) stays for
  patron/copy codes.
- Layout: left-aligned, content max 1200px. Scan becomes `1fr 360px`:
  working slip left, visual column right. Mobile stacks visual below.
- Principles: one serif moment per page; covers + camera carry richness;
  no gradients, no eyebrow-per-step, no `->` buttons.

## Shell

- Sidebar/topbar structure unchanged. Page-head `h2` becomes Fraunces
  28px tight; crumbs + sub-note unchanged.
- Footer unchanged.

## Scan

```
+-- slip (steps) --+-- visual column ------+
| Patron > Book >  | [ camera stage, large ]|
| Confirm          | Current loan slip      |
| [card per step]  | Cover wall (recent)    |
+------------------+------------------------+
```

- Step logic unchanged (Patron -> Book -> Confirm, receipt replaces
  confirm). Step rail stays.
- Camera preview renders large in visual column on steps 0-1 only.
- "Reading now" slip shows patron + copy + due; empty state invites:
  "Scan a patron to begin."
- Cover wall: 4-6 covers from `/api/catalog` + recent loans. No new API.
- Camera denial: inline hint + typed-code fallback, never alert().

## Desk alignment

- Serif titles only. Stat tiles, trend bars, tables unchanged so Desk
  and Scan read as one system without a Desk rewrite.

## Data flow

- Scan lazily fetches catalog + recent loans for visual column.
- Circulation `POST /api/circulation` unchanged. Inline `formerr`
  for failures.

## Testing

- `npm run build --prefix client`; manual light/dark + 360px mobile.

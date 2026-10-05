# Cellwego System UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver an enterprise-grade Cellwego Dashboard UI/UX redesign across the entire Sto. Tomas Municipal Library Dual-QR Circulation System (`client/`), including the navigation shell, circulation command center (Desk & Scan), data management (Catalog, Patrons, Loans), authentication (Login), and kiosk/settings screens.

**Architecture:** Build a shared suite of enhanced UI primitives (`MetricCard`, `EmptyState`, enhanced `Badge`, enhanced `Table`) on top of TailwindCSS 3.4.17 and Plus Jakarta Sans. Progressively refactor the application shell and all 9 pages to consume these primitives, elevating typography, contrast, data visualization, and micro-interactions while leaving backend API routes and circulation logic untouched.

**Tech Stack:** React 19 JSX, Vite 8, TailwindCSS 3.4.17, PostCSS, Autoprefixer, clsx, tailwind-merge, class-variance-authority, Lucide React icons.

**Spec:** `docs/superpowers/specs/2026-10-06-cellwego-system-ui-ux-redesign.md`

## Global Constraints

- TailwindCSS pinned `^3.4.17`.
- Primary remains Cellwego Blue: light `221 83% 55%` (`#2563EB`), dark `217 91% 60%` (`#3B82F6`).
- Dark mode strictly via `class="dark"` on `<html>`.
- Zero changes to backend API contract, route endpoints, or circulation business logic.
- All 9 pages must build with zero errors via `npm run build` in `client/`.

---

### Task 1: Shared UI Primitives & Style Enhancements

**Files:**
- Modify: `client/src/index.css`
- Create: `client/src/components/ui/metric-card.jsx`
- Create: `client/src/components/ui/empty-state.jsx`
- Modify: `client/src/components/ui/badge.jsx`
- Modify: `client/src/components/ui/table.jsx`

**Interfaces:**
- Produces:
  - `MetricCard({ title, value, icon: Icon, iconColor, subtitle, progress, trend, className })`
  - `EmptyState({ icon: Icon, title, description, actionText, onAction, className })`
  - `Badge({ variant, statusDot, children, className })` supporting variants: `default`, `secondary`, `destructive`, `outline`, `success`, `warning`, `info`, `neutral`
  - Enhanced `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell` with consistent card styling and hover effects.

- [ ] **Step 1: Update `client/src/index.css` with shadow and surface tokens**

Ensure `shadow-card`, `shadow-float`, `shadow-primary-sm`, and smooth transition utility classes exist.

- [ ] **Step 2: Create `client/src/components/ui/metric-card.jsx`**

Implement `MetricCard` with icon badge, large stat tracking, contextual subtitle, and optional progress bar.

- [ ] **Step 3: Create `client/src/components/ui/empty-state.jsx`**

Implement `EmptyState` component with dashed container, Lucide icon, heading, descriptive text, and optional action button.

- [ ] **Step 4: Update `client/src/components/ui/badge.jsx`**

Add semantic variants (`success`, `warning`, `info`, `neutral`) and optional `statusDot` boolean rendering an animated or solid colored dot.

- [ ] **Step 5: Verify build**

Run: `cd client; npm run build`  
Expected: PASS with no JSX/CSS errors.

- [ ] **Step 6: Commit**

```bash
git add client/src/index.css client/src/components/ui/metric-card.jsx client/src/components/ui/empty-state.jsx client/src/components/ui/badge.jsx client/src/components/ui/table.jsx
git commit -m "feat: add metric-card, empty-state, and enhanced badge and table primitives"
```

---

### Task 2: Application Shell (Navbar & Sidebar)

**Files:**
- Modify: `client/src/layouts/Navbar.jsx`
- Modify: `client/src/layouts/Sidebar.jsx`
- Modify: `client/src/layouts/Layout.jsx`

**Interfaces:**
- Consumes: `Badge`, `Button`, icons from `lucide-react`.
- Produces: Modern fixed glass Navbar with brand crest, `Ctrl+K` route search pill, dark/light theme switch, user profile avatar menu; Collapsible Sidebar with categorized sections (Circulation, Management, Kiosk) and active glow pill.

- [ ] **Step 1: Upgrade `client/src/layouts/Navbar.jsx`**

Add frosted glass styling (`backdrop-blur-md bg-background/85 border-b border-border/60`), Sto. Tomas Municipal Library brand mark, search pill with keyboard shortcut badge, animated theme toggle, and polished avatar dropdown menu.

- [ ] **Step 2: Upgrade `client/src/layouts/Sidebar.jsx`**

Group navigation into sections ("CIRCULATION", "MANAGEMENT", "PUBLIC KIOSK"), implement active link highlight with blue glow (`shadow-primary-sm`), and support smooth collapse/expand states with tooltip labels.

- [ ] **Step 3: Verify build**

Run: `cd client; npm run build`  
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add client/src/layouts/Navbar.jsx client/src/layouts/Sidebar.jsx client/src/layouts/Layout.jsx
git commit -m "feat: polish navbar and sidebar shell with cellwego enterprise layout"
```

---

### Task 3: Desk (Circulation Dashboard) Redesign

**Files:**
- Modify: `client/src/pages/Desk.jsx`

**Interfaces:**
- Consumes: `MetricCard`, `Badge`, `Table`, `Button`, `EmptyState`.
- Produces: Polished dashboard cockpit with welcome banner, 3 MetricCards, gradient monthly circulation trend chart, Attention Required panel, Popular Titles ranking, and Recent Activity log.

- [ ] **Step 1: Refactor header & metrics row in `client/src/pages/Desk.jsx`**

Add welcome greeting with current date, status chip, and quick-action shortcuts. Replace inline tiles with 3 `MetricCard`s (Catalog Titles, Active Checkouts, Overdue Alerts with shelf ratio progress).

- [ ] **Step 2: Implement gradient circulation trend visualizer**

Upgrade the last-8-months bar chart with rounded bars, vertical gradient fills (`from-primary/70 to-primary`), hover badges showing loan counts, and month axis labels.

- [ ] **Step 3: Refactor Attention Required and Popular Books panels**

Style overdue attention cards with patron code, overdue duration, and quick return action; format Top 3 borrowed books with rank numbers and genre pills.

- [ ] **Step 4: Refactor Recent Activity table**

Format recent loans with patron avatar initials, book title, formatted dates, and `Badge` status pills.

- [ ] **Step 5: Verify build**

Run: `cd client; npm run build`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/Desk.jsx
git commit -m "feat: redesign circulation desk dashboard with metric cards and trend chart"
```

---

### Task 4: Scan (Dual-QR Circulation Station) Redesign

**Files:**
- Modify: `client/src/pages/Scan.jsx`

**Interfaces:**
- Consumes: `Badge`, `Button`, `Card`, `EmptyState`.
- Produces: High-visibility Dual-QR circulation console with camera viewfinder, laser scan animation, Slot 1 (Patron) card, Slot 2 (Book Copy) card, context-aware action button, and shift transaction log.

- [ ] **Step 1: Refactor camera viewfinder & input pane**

Add corner target brackets, animated laser scanline, camera device switcher dropdown, and autofocus manual barcode input.

- [ ] **Step 2: Build Slot 1 (Patron) card with live state**

Render clear waiting prompt when empty; display patron photo/avatar, ID number, active loan counter, and borrowing eligibility badge once scanned.

- [ ] **Step 3: Build Slot 2 (Book Copy) card with live state**

Render clear waiting prompt when empty; display book cover, title, copy accession barcode, call number, and physical condition badge once scanned.

- [ ] **Step 4: Refactor transaction action bar & session history log**

Add primary dynamic CTA button (*"Complete Checkout"*, *"Process Return"*) and clean session activity list showing items scanned during this shift.

- [ ] **Step 5: Verify build**

Run: `cd client; npm run build`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/Scan.jsx
git commit -m "feat: redesign dual-qr scan station with slot console and laser viewfinder"
```

---

### Task 5: Catalog & Book Conditions Redesign

**Files:**
- Modify: `client/src/pages/Catalog.jsx`

**Interfaces:**
- Consumes: `Badge`, `Button`, `Table`, `Dialog`, `EmptyState`.
- Produces: Modern book catalog table with spine preview, category filter, availability status ratio pills, Add Book modal, and Copy Condition inspector modal.

- [ ] **Step 1: Upgrade search, filter bar, and book records table in `client/src/pages/Catalog.jsx`**

Add category filter dropdown, search input with clear button, book spine preview thumbnail with genre color tints, and availability ratio badge (`e.g. 4/5 Available`).

- [ ] **Step 2: Polish Add Book modal & Book Copies Condition modal**

Ensure physical copy list clearly displays copy accession barcodes, loan status, and condition pills (*New, Good, Fair, Poor*) with inline condition update dropdown.

- [ ] **Step 3: Verify build**

Run: `cd client; npm run build`  
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Catalog.jsx
git commit -m "feat: polish catalog page with book spine badges and copy condition modal"
```

---

### Task 6: Patrons Directory & Library QR Card Redesign

**Files:**
- Modify: `client/src/pages/Patrons.jsx`

**Interfaces:**
- Consumes: `Badge`, `Button`, `Table`, `Dialog`, `EmptyState`.
- Produces: Patrons directory table with avatar initials, role pills, borrowing capacity meter bars, and high-resolution printable Sto. Tomas Municipal Library QR Card modal.

- [ ] **Step 1: Upgrade patrons table in `client/src/pages/Patrons.jsx`**

Add avatar initials circle, role badge (Student, Faculty, Guest), borrowing capacity progress bar, and status pill (`Active` / `Suspended`).

- [ ] **Step 2: Redesign printable Library Card modal**

Create a municipal library card layout featuring header crest, patron details, high-contrast QR code, and print/download buttons.

- [ ] **Step 3: Verify build**

Run: `cd client; npm run build`  
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Patrons.jsx
git commit -m "feat: redesign patrons directory and printable municipal library qr card"
```

---

### Task 7: Loans Activity & Management Redesign

**Files:**
- Modify: `client/src/pages/Loans.jsx`

**Interfaces:**
- Consumes: `Badge`, `Button`, `Table`, `EmptyState`.
- Produces: Circulation loans management with filter tabs and live counters (`All`, `Active`, `Overdue`, `Returned`), time-to-due dynamic countdown badges, and row action buttons.

- [ ] **Step 1: Upgrade filter tabs and search bar in `client/src/pages/Loans.jsx`**

Add pill tabs with live badge counters for each status, and search input for patron or book title.

- [ ] **Step 2: Upgrade loans data table**

Add patron avatar badge, book accession code, relative due date badge (`Due in X days` or `X days overdue` in rose), and direct action buttons for *"Return"* and *"Renew"*.

- [ ] **Step 3: Verify build**

Run: `cd client; npm run build`  
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Loans.jsx
git commit -m "feat: redesign loans page with live tab counters and countdown badges"
```

---

### Task 8: Login, Profile, Settings & Public Lookup Redesign

**Files:**
- Modify: `client/src/pages/Login.jsx`
- Modify: `client/src/pages/Lookup.jsx`
- Modify: `client/src/pages/Profile.jsx`
- Modify: `client/src/pages/Settings.jsx`

**Interfaces:**
- Consumes: `Button`, `Card`, `Badge`, `EmptyState`.
- Produces: Branded split hero login screen with 1-click test credentials; public search kiosk layout; staff account profile card; tabbed circulation rules settings.

- [ ] **Step 1: Upgrade `client/src/pages/Login.jsx`**

Split layout with Cellwego blue gradient banner, library badge, feature highlights, floating login card, and quick demo credentials chip.

- [ ] **Step 2: Upgrade `client/src/pages/Lookup.jsx`**

Clean kiosk search page with large central search bar, shelf location / call number guidance, and book availability chips.

- [ ] **Step 3: Upgrade `client/src/pages/Profile.jsx` & `client/src/pages/Settings.jsx`**

Staff account summary card with station details and password updater; tabbed settings for loan periods, patron limits, fine rates, and theme controls.

- [ ] **Step 4: Verify build**

Run: `cd client; npm run build`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Login.jsx client/src/pages/Lookup.jsx client/src/pages/Profile.jsx client/src/pages/Settings.jsx
git commit -m "feat: polish login hero, lookup kiosk, profile, and system settings"
```

---

### Task 9: Full Build & Regression Smoke Verification

**Files:**
- Verify: all client files and server tests.

- [ ] **Step 1: Run client build**

Run: `cd client; npm run build`  
Expected: PASS with 0 errors.

- [ ] **Step 2: Run server automated test suite**

Run: `npm test`  
Expected: PASS with all existing tests passing.

- [ ] **Step 3: Smoke test routes and theme flip**

Verify light and dark theme contrast, modal transitions, and route navigation.

- [ ] **Step 4: Final commit & tag**

```bash
git commit --allow-empty -m "chore: complete cellwego system ui ux redesign verification"
```

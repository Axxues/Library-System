# System-Wide Page Layouts Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a comprehensive layout overhaul across all core screens of the Sto. Tomas Municipal Library Dual-QR Circulation System (`client/`): Dashboard (`Desk.jsx`), Dual-QR Station (`Scan.jsx`), Catalog & Copies (`Catalog.jsx`), Patrons Directory (`Patrons.jsx`), Circulation Activity (`Loans.jsx`), and Public Search Kiosk (`Lookup.jsx`).

**Architecture:** Implement Modern Command-Center & Split-Workbench Layouts featuring dual-view switchers (Grid/Table for Catalog & Patrons), optical camera HUD with laser scanline on Scan, 4-metric executive header on Desk, timeline workbench with 1-click check-ins on Loans, and self-service catalog explorer on Lookup.

**Tech Stack:** React 19 JSX, Vite 8, TailwindCSS 3.4.17, Lucide React icons, Plus Jakarta Sans typography.

**Spec:** `docs/superpowers/specs/2026-10-06-system-wide-page-layouts-redesign.md`

## Global Constraints

- TailwindCSS pinned `^3.4.17`.
- Primary remains Cellwego Blue: light `221 83% 55%` (`#2563EB`), dark `217 91% 60%` (`#3B82F6`).
- Dark mode strictly via `class="dark"` on `<html>`.
- Zero changes to backend API contract, route endpoints, or circulation business logic.
- All pages must build cleanly with zero errors via `npm run build` in `client/`.

---

### Task 1: Desk Dashboard Layout Overhaul (`Desk.jsx`)

**Files:**
- Modify: `client/src/pages/Desk.jsx`

**Interfaces:**
- Consumes: `MetricCard`, `Badge`, `Button`, `Table`, `Cover`, `EmptyState`.
- Produces: 4-metric executive header, gradient circulation trend visualizer, and 2-column split workbench (Recent Activity feed + Overdue Action Queue & Popular Titles).

- [ ] **Step 1: Implement 4-metric executive header in `client/src/pages/Desk.jsx`**

Add station live status banner, quick shortcuts, and 4 `MetricCard`s: Titles with shelf availability percentage, Active Borrowings, Overdue Alerts, and Circulation Volume.

- [ ] **Step 2: Polish circulation trend visualizer and split operational workbench**

Format 8-month gradient bars with hover counts; split workbench with ~60% recent activity stream and ~40% overdue action queue & all-time popular titles.

- [ ] **Step 3: Verify build**

Run: `cd client; npm run build`  
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Desk.jsx
git commit -m "feat: overhaul desk dashboard with 4-metric executive strip and split operational workbench"
```

---

### Task 2: Dual-QR Circulation Station Layout Overhaul (`Scan.jsx`)

**Files:**
- Modify: `client/src/pages/Scan.jsx`

**Interfaces:**
- Consumes: `Badge`, `Button`, `Input`, `Cover`, `useCamera`.
- Produces: Integrated optical terminal with camera viewfinder, laser sweep HUD, Dual-Slot Smart Dock (Patron + Book), and action authorization bar.

- [ ] **Step 1: Build optical viewfinder HUD with animated scanline and barcode input**

Include corner target brackets, laser sweep line, camera toggle, and autofocus manual input field with Enter-to-lookup shortcut.

- [ ] **Step 2: Build Dual-Slot Smart Dock console**

Slot 1: Patron card with quota progress bar. Slot 2: Book copy card with copy accession barcode and physical condition tag (*Good / Worn / Damaged*).

- [ ] **Step 3: Build contextual action dock, printable receipt, and shift log**

Dynamic authorization button (*"Complete Checkout"*, *"Process Return"*), audio-visual feedback, printable receipt preview, and shift transaction log.

- [ ] **Step 4: Verify build**

Run: `cd client; npm run build`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Scan.jsx
git commit -m "feat: overhaul dual-qr station with optical hud and dual-slot dock layout"
```

---

### Task 3: Book Catalog & Copies Dual-View Layout Overhaul (`Catalog.jsx`)

**Files:**
- Modify: `client/src/pages/Catalog.jsx`

**Interfaces:**
- Consumes: `Badge`, `Button`, `Input`, `Dialog`, `Table`, `Cover`, `EmptyState`.
- Produces: Dual View Switcher (`Grid View` vs. `Table View`), visual 3D book cards, dense table, Add Book modal, Condition Updater modal, and QR preview modal.

- [ ] **Step 1: Implement toolbar with Grid/Table View Switcher and filters**

Add View Switcher buttons (`LayoutGrid` and `List` icons), search input with clear button, status filter tabs, genre dropdown, and Add Book CTA.

- [ ] **Step 2: Implement Visual Card Grid Mode and Dense Data Table Mode**

Grid View: 3D-styled book cards with genre tags, copy barcodes, condition pills, and hover actions. Table View: Dense table with cover thumbnails and actions.

- [ ] **Step 3: Wire up Add Book, Condition Updater, and QR Preview dialogs**

Ensure modal actions smoothly open, submit, and refresh catalog records.

- [ ] **Step 4: Verify build**

Run: `cd client; npm run build`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Catalog.jsx
git commit -m "feat: overhaul catalog with dual-view grid and table layouts and condition dialogs"
```

---

### Task 4: Patrons Directory Dual-View Layout Overhaul (`Patrons.jsx`)

**Files:**
- Modify: `client/src/pages/Patrons.jsx`

**Interfaces:**
- Consumes: `Badge`, `Button`, `Input`, `Dialog`, `Table`, `EmptyState`.
- Produces: Dual View Switcher (`Card View` vs. `Table View`), digital patron membership pass cards with borrowing quota gauges, and official printable municipal library pass modal.

- [ ] **Step 1: Implement toolbar with Card/Table View Switcher**

Add View Switcher buttons, search bar, and total registered count badge.

- [ ] **Step 2: Implement Member Cards Grid Mode and Directory Table Mode**

Card View: Digital membership cards with crest, avatar initials, role badge, and borrowing quota meters. Table View: Rapid directory table.

- [ ] **Step 3: Polish printable Municipal Library Pass modal**

High-resolution printable card preview with municipal crest, patron identity, and sharp QR code.

- [ ] **Step 4: Verify build**

Run: `cd client; npm run build`  
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/Patrons.jsx
git commit -m "feat: overhaul patrons directory with card grid and table switchers"
```

---

### Task 5: Circulation Activity Layout Overhaul (`Loans.jsx`)

**Files:**
- Modify: `client/src/pages/Loans.jsx`

**Interfaces:**
- Consumes: `Badge`, `Button`, `Input`, `Table`, `Cover`, `EmptyState`.
- Produces: Timeline activity workbench with live status tabs, relative due countdown chips, and 1-click inline check-in.

- [ ] **Step 1: Implement tracking toolbar with live status counter tabs**

Add `All Loans (n)`, `Active (n)`, `Overdue (n)`, `Returned (n)` tabs with live counters and search bar.

- [ ] **Step 2: Implement timeline activity table with countdown badges and inline return**

Borrower profile cell, book cover cell, timeline cell with relative due chips, and 1-click *"Check In"* return button.

- [ ] **Step 3: Verify build**

Run: `cd client; npm run build`  
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Loans.jsx
git commit -m "feat: overhaul loans activity with live counter tabs and inline return actions"
```

---

### Task 6: Public Search Kiosk Layout Overhaul (`Lookup.jsx`)

**Files:**
- Modify: `client/src/pages/Lookup.jsx`

**Interfaces:**
- Consumes: `Badge`, `Button`, `Input`, `Cover`, `EmptyState`.
- Produces: Welcoming patron self-service kiosk with floating search console, active loan summary, personal recommendations, and public catalog title search.

- [ ] **Step 1: Build kiosk hero console and patron loans summary**

Floating search input for patron ID code, active loans table with due date badges, and personal recommendation cards.

- [ ] **Step 2: Build integrated Public Catalog Book Explorer**

Add a search tab allowing patrons to look up any book title in the library catalog to check on-shelf availability and shelf location.

- [ ] **Step 3: Verify build**

Run: `cd client; npm run build`  
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/Lookup.jsx
git commit -m "feat: overhaul lookup page with kiosk hero console and public catalog explorer"
```

---

### Task 7: Full Build & Regression Verification

**Files:**
- Verify: all client files and build output.

- [ ] **Step 1: Run client build**

Run: `cd client; npm run build`  
Expected: PASS with 0 errors.

- [ ] **Step 2: Run test suite**

Run: `node --test test/recommender.test.js`  
Expected: PASS.

- [ ] **Step 3: Final commit**

```bash
git commit --allow-empty -m "chore: complete system-wide page layouts redesign verification"
```

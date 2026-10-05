# System-Wide Page Layouts & UX Redesign — Design Specification

**Date:** 2026-10-06  
**Status:** Approved  
**Author:** Pair Programming Session  

---

## 1. Overview & Objective

Comprehensively enhance and redesign the layouts of all core operational and public-facing pages in the **Sto. Tomas Municipal Library Dual-QR Circulation System** (`client/`):
1. **Front Desk Dashboard (`Desk.jsx`)**: 4-metric executive header, gauge meters, circulation trend visualizer, and split operational workbench (Attention Queue + Live Circulation Feed).
2. **Dual-QR Circulation Station (`Scan.jsx`)**: Integrated optical sensor console with laser sweep HUD and dual-slot physical dock (Patron Badge card + Book Barcode card) with real-time checkout/return authorization.
3. **Book Catalog & Copies (`Catalog.jsx`)**: Dual-view switcher (`Grid View` with 3D-styled cards vs. `Table View` with copy condition inspection) with Add Book and Condition Updater modals.
4. **Patrons Directory (`Patrons.jsx`)**: Dual-view switcher (`Member Cards Grid` with borrowing capacity meters vs. `Directory Table`) with official printable Sto. Tomas library pass modal.
5. **Circulation Activity (`Loans.jsx`)**: Timeline activity workbench with live status tabs (`All`, `Active`, `Overdue`, `Returned`), relative due-date countdown chips, and 1-click inline check-in.
6. **Public Patron Kiosk (`Lookup.jsx`)**: Kiosk-grade hero interface with floating search bar, borrower loan pass preview, recommendation cards, and public catalog title search.

---

## 2. Page-by-Page Layout Specifications

### 2.1 Front Desk Dashboard (`Desk.jsx`)
- **Header & Metric Strip:**
  - Live terminal status badge (`Terminal 01 · Online`), current date banner, and quick action shortcuts.
  - 4 KPI `MetricCard` widgets:
    - *Titles in Catalog:* Count with progress bar indicating on-shelf copy ratio.
    - *Active Borrowings:* Current active loans with circulation trend badge.
    - *Overdue Alerts:* Overdue loans count with attention pill and patron count.
    - *Circulation Velocity:* 8-month volume and peak checkout month.
- **Circulation Trend Bar Visualizer:**
  - Modern vertical gradient bars for the last 8 months with hover count badges and month axis labels.
- **Split Operational Workbench:**
  - **Left (~60%):** Recent circulation activity stream with patron avatar circles, book cover previews, and status badges.
  - **Right (~40%):** Overdue action queue with quick resolve buttons + All-time popular books ranking (1-3 podium).

### 2.2 Dual-QR Circulation Station (`Scan.jsx`)
- **Top Command Console:**
  - Camera sensor status indicator and connected 3-stage breadcrumb tracker (*1. Patron -> 2. Book -> 3. Authorize*).
- **Split Console Columns:**
  - **Left Column (Optical Viewfinder & Manual Barcode):**
    - High-visibility camera viewfinder with target brackets, animated laser line, and stop/start controls.
    - Manual barcode input field with autofocus and Enter-key lookup.
  - **Right Column (Dual Smart Dock):**
    - *Slot 1 (Patron Dock):* Waiting state prompt or active patron badge with avatar, code, and loan quota progress bar.
    - *Slot 2 (Book Copy Dock):* Waiting state prompt or active book card with cover preview, title, copy accession code, and condition tag (*Good / Worn / Damaged*).
    - *Action Dock:* Context-aware action button (*"Complete Checkout"*, *"Process Return"*), audio-visual feedback, and printable loan receipt preview with reading recommendations.
- **Shift Activity Drawer:** Live feed of transactions completed during the current desk shift.

### 2.3 Book Catalog & Copies (`Catalog.jsx`)
- **Interactive Control Toolbar:**
  - Search input with clear button, status filter tabs (`All`, `Available`, `On Loan`), genre category filter dropdown, *"Add New Book"* primary CTA, and a **View Switcher** (`Grid View` vs. `Table View`).
- **Visual Card Grid Mode:**
  - Responsive cards with 3D-styled covers, genre color badges, copy accession barcodes, and shelf availability tags.
  - Interactive physical condition pill (*Good, Worn, Damaged*) with 1-click update modal trigger.
  - Hover action to view QR label or copy details.
- **Dense Data Table Mode:**
  - Tabular layout with cover thumbnail, accession barcode, genre, condition, status, and quick QR modal launch.
- **Integrated Modals:**
  - *Add Book Modal:* Add title, author, genre, classification, and copy count (1-50).
  - *Condition Inspector Modal:* Quick physical grading updater (*Good, Worn, Damaged*).
  - *QR Label Preview Modal:* High-resolution printable barcode label.

### 2.4 Patrons Directory (`Patrons.jsx`)
- **Interactive Control Toolbar:**
  - Search input, registered count badge, and a **View Switcher** (`Card View` vs. `Table View`).
- **Member Cards Grid Mode:**
  - Digital membership pass cards with Sto. Tomas crest, patron avatar initials, full name, student/faculty ID, and role badge.
  - **Borrowing Capacity Meter:** Visual progress bar showing active borrowings against the maximum loan limit.
  - 1-click action to preview printable QR Library Pass.
- **Directory Table Mode:**
  - Tabular view with avatar initials, patron code, contact info, active status, and action buttons.
- **Printable Library Pass Modal:**
  - Official Sto. Tomas Municipal Library card preview with municipal crest, patron identity, and high-contrast scannable QR code.

### 2.5 Circulation Activity (`Loans.jsx`)
- **Tracking Toolbar & Metrics:**
  - Overdue alert chip and total loans counter.
  - Status filter tabs with live counters: `All Loans (n)`, `Active (n)`, `Overdue (n)`, `Returned (n)`.
  - Search input by borrower code, book title, or copy barcode.
- **Timeline Activity Table:**
  - Borrower profile cell with avatar initials and student/faculty ID.
  - Book cell with cover preview, title, and copy barcode.
  - Timeline cell featuring relative countdown badges:
    - `Due today` (amber badge)
    - `X days overdue` (rose badge with attention styling)
    - `Due in X days` (subtle blue badge)
    - `Returned [date]` (emerald badge)
  - Instant row action: One-click *"Check In"* button to return books directly without page reloads.

### 2.6 Public Search Kiosk (`Lookup.jsx`)
- **Kiosk Command Console:**
  - Dedicated kiosk layout with brand seal and floating search input for patron ID code.
- **Dual-Pane Borrower Results:**
  - **My Active Loans (Left):** Card showing the patron's current borrowed books, return dates, and due alerts.
  - **Personalized Recommendations (Right):** Visual gallery of recommended books based on borrowing history.
- **Public Catalog Availability Explorer:**
  - Integrated book search allowing patrons to look up any book in the library to check its shelf location and on-shelf copy status.

---

## 3. Non-Functional Requirements & Constraints

1. **Zero API / Logic Regressions:** All existing API routes (`/api/catalog`, `/api/loans`, `/api/patrons`, `/api/auth`) and state management logic remain 100% compatible.
2. **Build Correctness:** `npm run build` in `client/` must complete with zero errors.
3. **Accessibility & Contrast:** High contrast text on all light and dark mode surfaces complying with WCAG AA.
4. **Responsive Layouts:** All pages must gracefully adapt between mobile (<768px), tablet (<1024px), and desktop (>=1024px) viewports.

---

## 4. Verification & Acceptance Criteria

- [ ] `client/` builds cleanly via Vite with zero lint/build errors.
- [ ] View switchers (Grid/Table) on Catalog and Patrons toggle smoothly and persist view preference.
- [ ] Desk dashboard displays 4 KPI metrics, trend visualizer, and split operational workbench.
- [ ] Dual-QR scanner provides clean viewfinder with target brackets, dual-slot dock, and action feedback.
- [ ] Loans page shows status filter tabs with dynamic counts and 1-click return actions.
- [ ] Lookup kiosk presents patron loans, personal recommendations, and public catalog title search.

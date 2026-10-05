# Cellwego System UI/UX Redesign — Design Specification

**Date:** 2026-10-06  
**Status:** Approved  
**Author:** Pair Programming Session  

---

## 1. Overview & Objective

Upgrade the visual design, interactive usability, and aesthetic polish of the **Sto. Tomas Municipal Library Dual-QR Circulation System** (`client/`). The goal is to deliver an enterprise-grade **Cellwego Dashboard** experience across the entire web application suite—enhancing typography, data visualization, table presentation, circulation desk ergonomics, and light/dark theme fidelity without altering existing backend APIs or business rules.

---

## 2. Core Architecture & Design System Tokens

### 2.1 Color Palette & Theme Tokens (`client/src/index.css`)
- **Primary Color:** Cellwego Blue
  - Light mode: `hsl(221 83% 55%)` (`#2563EB`)
  - Dark mode: `hsl(217 91% 60%)` (`#3B82F6`)
- **Backgrounds & Surfaces:**
  - Canvas: `hsl(220 14% 97.5%)` in light mode, `hsl(222.2 84% 4.9%)` in dark mode.
  - Card & Container Surface: `hsl(0 0% 100%)` light / `hsl(222.2 84% 7%)` dark with hairline borders (`border-border/60`).
  - Table Header & Secondary Surfaces: `hsl(210 40% 96.1% / 0.5)` light / `hsl(217.2 32.6% 12% / 0.5)` dark.
- **Semantic Accents:**
  - Success / Available: Emerald `hsl(142 71% 38%)` with subtle background tint `hsl(142 71% 95%)` / dark `hsl(142 71% 15%)`.
  - Warning / Attention: Amber `hsl(38 92% 50%)` with amber tint.
  - Destructive / Overdue: Crimson/Rose `hsl(0 84.2% 60.2%)` with rose tint.
  - Info / Borrowed: Blue `hsl(199 89% 48%)` with blue tint.
- **Typography:**
  - Font Family: `Plus Jakarta Sans`, `system-ui`, sans-serif.
  - Heading scales: clean tight tracking (`tracking-tight`), crisp weight contrast (`font-semibold` / `font-bold`).
- **Shadows & Elevation:**
  - Card Shadow: `shadow-[0_2px_8px_rgba(0,0,0,0.04)]` (light) / `shadow-[0_2px_8px_rgba(0,0,0,0.3)]` (dark).
  - Floating Shadow: `shadow-[0_12px_32px_rgba(0,0,0,0.08)]`.
  - Primary Glow: `shadow-[0_4px_14px_rgba(37,99,235,0.25)]`.

---

## 3. Shared UI Primitives (`client/src/components/ui/`)

1. **`MetricCard` (`metric-card.jsx`):**
   - Icon container with soft background badge (e.g. blue for total books, green for active checkouts, amber for overdue items).
   - Prominent numerical stat (`text-2xl md:text-3xl font-bold tracking-tight`).
   - Contextual caption with optional trend or progress bar (e.g. shelf availability ratio).
2. **`StatusBadge` & Enhanced `Badge` (`badge.jsx`):**
   - Standardized status indicator pills with an inline dot indicator:
     - `Available` / `Active` (Emerald)
     - `Borrowed` / `Pending` (Blue)
     - `Overdue` / `Suspended` (Rose)
     - `Returned` / `Archived` (Muted gray)
3. **`EmptyState` (`empty-state.jsx`):**
   - Dashed border card container with centered icon, bold headline, descriptive helper text, and optional action button.
4. **Enhanced `Table` (`table.jsx`):**
   - Rounded border wrapper with subtle background for `TableHeader`, row hover transitions (`hover:bg-muted/40 transition-colors`), and avatar initials for names.

---

## 4. Screen-by-Screen Specifications

### 4.1 Shell Navigation (`Navbar.jsx` & `Sidebar.jsx`)
- **Navbar:**
  - Fixed frosted glass header (`backdrop-blur-md bg-background/85 border-b border-border/60 h-16`).
  - Brand identity: Sto. Tomas Municipal Library logo mark and text badge.
  - Search trigger pill (`Ctrl + K`) opening rapid navigation.
  - Theme switch button with smooth rotation/fade icon.
  - User profile menu button with avatar circle and animated dropdown.
- **Sidebar:**
  - Categorized navigation groups:
    - *Circulation:* Desk (`/desk`), Scan Station (`/scan`).
    * *Management:* Catalog (`/catalog`), Patrons (`/patrons`), Loans (`/loans`).
    * *Kiosk:* Public Search (`/lookup`).
  - Active navigation pill featuring primary blue background (`bg-primary text-primary-foreground shadow-primary-sm`).
  - Smooth collapse/expand toggle (`w-64` expanded, `w-18` collapsed) with tooltip labels in collapsed mode.

### 4.2 Desk — Circulation Dashboard (`Desk.jsx`)
- **Header:** Welcome title with current system date, station status pill, and quick-action buttons.
- **Top Metrics Row:** 3 `MetricCard` widgets displaying:
  1. *Catalog Titles:* Total distinct titles, copy count, and shelf availability meter.
  2. *Active Borrowings:* Current active loans, and most popular genre/title insight.
  3. *Overdue Loans:* Overdue count with alert badge and number of affected patrons.
- **Circulation Trend Chart:**
  - Modern vertical bar chart representing the last 8 months of loans.
  - Rounded bars (`rounded-t-md`) with gradient fills (`bg-gradient-to-t from-primary/80 to-primary`).
  - Exact count badge displayed on bar hover with month labels along the X-axis.
- **Operational Split Panels:**
  - *Attention Required:* List of overdue items showing patron code, book title, and direct return action.
  * *Popular Titles:* Top 3 borrowed books ranked with circulation count badges.
  * *Recent Activity Table:* Latest 5 transactions with patron avatar initials, book title, formatted date, and status pills.

### 4.3 Scan — Dual-QR Circulation Station (`Scan.jsx`)
- **Split Viewport Layout:**
  - **Left (Camera & Input):**
    - High-visibility camera viewfinder with corner guide lines and laser scanning animation.
    - Camera selection dropdown and live status indicator.
    - Manual barcode input with enter-key autofocus and instant lookup.
  - **Right (Dual-Slot Station):**
    - **Slot 1 (Patron):**
      - Waiting state: Illustrated guide prompt (*"Scan Patron QR Code"*).
      - Active state: Patron badge card with avatar, ID, active loans count, and eligibility indicator.
    - **Slot 2 (Book Copy):**
      - Waiting state: Illustrated guide prompt (*"Scan Book Copy Barcode"*).
      - Active state: Book preview card with cover thumbnail, title, accession barcode, call number, and physical condition badge.
- **Transaction Actions & Feedback:**
  - Large primary action button dynamically responding to current slot state:
    - *"Complete Checkout"* (when patron + book scanned).
    - *"Process Return"* (when book scanned).
  - Clear success banner and session transaction history log.

### 4.4 Catalog — Inventory & Conditions (`Catalog.jsx`)
- **Search & Filter Header:**
  - Integrated search input, category dropdown, and *"Add New Book"* primary button.
- **Book Records Table/Grid:**
  - Spine/Cover preview thumbnail with color category fallback.
  - Clear typographic hierarchy: Title, Author, Call Number, ISBN.
  - Shelf availability ratio pill (`e.g. 4/5 Available`).
  - Action buttons: View copies, edit book details.
- **Book Copies & Condition Modal:**
  - Inventory breakdown per physical copy (Accession barcode, Copy number, Status, Condition: *New, Good, Fair, Poor*).
  - Condition updater dropdown allowing instant condition changes.

### 4.5 Patrons — Directory & Cards (`Patrons.jsx`)
- **Patron Records Table:**
  - Avatar initials badge for each patron.
  - Name, Patron Code (student/faculty ID), Role pill (Student / Faculty / Guest).
  - Borrowing capacity meter (e.g. `2 of 3 borrowed`).
  - Status pill (`Active` / `Suspended`).
- **QR ID Card Modal:**
  - Professional printable library card design featuring Sto. Tomas municipal crest, patron metadata, and sharp QR code.
  - *"Print Card"* and *"Download QR"* actions.

### 4.6 Loans — Circulation Activity (`Loans.jsx`)
- **Filter Tabs with Counters:** `All`, `Active`, `Overdue`, `Returned`.
- **Enhanced Loans Table:**
  - Patron Name & Code with avatar badge.
  - Book Title & Copy Barcode.
  - Checkout date and dynamic Due Date badge (e.g., `Due in 3 days` or `4 days overdue` in rose).
  - Row action buttons for instant *"Return"* and *"Renew"*.

### 4.7 Login, Profile, Settings & Kiosk
- **Login (`Login.jsx`):** Split layout with branded Cellwego gradient hero on the left and elevated login card with demo 1-click credentials on the right.
- **Lookup (`Lookup.jsx`):** Public search kiosk layout with clean search hero and shelf location results.
- **Profile (`Profile.jsx`):** Staff account information card, assigned circulation station, and credentials updater.
- **Settings (`Settings.jsx`):** Clean tabbed settings for loan rules (period, limits, fines), branch details, and theme preferences.

---

## 5. Non-Functional Requirements & Constraints

1. **Zero API / Logic Regressions:** All existing API routes (`/api/catalog`, `/api/loans`, `/api/patrons`, `/api/auth`) and state management logic remain 100% compatible.
2. **Build Correctness:** `npm run build` in `client/` must complete with zero errors.
3. **Accessibility & Contrast:** High contrast text on all light and dark mode surfaces complying with WCAG AA.
4. **Performance:** Lightweight CSS transitions with no heavyweight animation libraries.

---

## 6. Verification & Acceptance Criteria

- [ ] `client/` builds cleanly via Vite with zero lint/build errors.
- [ ] All 9 routes (`/login`, `/desk`, `/scan`, `/catalog`, `/patrons`, `/loans`, `/lookup`, `/profile`, `/settings`) render correctly.
- [ ] Light mode and Dark mode toggle seamlessly with proper surface and text contrast.
- [ ] Dual-QR scanning interface smoothly displays Patron and Book copy status cards.
- [ ] Catalog condition modal and Patron QR card modal open, display high-resolution details, and close cleanly on backdrop click / Escape.

# System-Wide Skeleton Loading & Zero-CLS Shimmer Design

## Overview
This specification details the architecture and implementation for adding high-fidelity skeleton loading screens with smooth CSS shimmer wave animations across all primary pages of the Sto. Tomas Municipal Library Dual-QR Circulation System.

The goal is to eliminate cumulative layout shift (CLS), improve perceived responsiveness, and maintain the modern Command-Center aesthetic during API data fetching operations.

---

## 1. Core Design System Primitive (`Skeleton.jsx`)

### File Location
`client/src/components/ui/skeleton.jsx`

### Styling & Shimmer Wave Animation
- Base container: `relative overflow-hidden rounded-xl bg-muted/65 dark:bg-muted/40`
- Shimmer gradient pseudoelement:
  - Gradient: `linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 50%, transparent)` in dark mode, or `rgba(0,0,0,0.04)` in light mode.
  - Animation: Continuous horizontal translation `animate-[shimmer_1.8s_infinite]`.
- Keyframe defined in `client/src/index.css` or Tailwind arbitrary animation:
  ```css
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  ```

### Exposed Components
- `Skeleton`: Generic block accepting custom dimensions, border-radius, and utility classes.
- `SkeletonCover`: Aspect-ratio-tailored block matching `Cover` component dimensions (`size="sm"`, `size="md"`, `size="lg"`).
- `SkeletonCircle`: Circular placeholder for patron avatars and status indicators.
- `SkeletonText`: Variable-width text line placeholder (`h-4`, `w-3/4`, etc.).

---

## 2. Page-by-Page Integration Specifications

### 2.1 Executive Desk Dashboard (`Desk.jsx`)
- **State Hook:** `const [loading, setLoading] = useState(true)` tied to `Promise.all([api('/api/catalog'), api('/api/loans'), api('/api/patrons')])`.
- **Skeleton Layout:**
  1. **Executive Metric Cards (4 cards):**
     - Card container matching `MetricCard` dimensions.
     - Top row: shimmer title line (`w-24 h-3.5`) and shimmer icon box (`w-9 h-9 rounded-xl`).
     - Value block: shimmer stat number (`w-16 h-7`) and secondary ratio pill (`w-20 h-5 rounded-full`).
  2. **Monthly Throughput Bar Chart:**
     - Header block placeholder.
     - 6 chart bar columns of varying staggered heights (e.g. 40%, 65%, 85%, 50%, 75%, 90%) with shimmer effect.
  3. **Split Workbench (2 columns):**
     - Column 1 (Live Circulation Stream): 4 list items with circular badge shimmer, 2 lines of text, and timestamp badge.
     - Column 2 (Overdue Attention Queue): 3 items with warning badge placeholder, title/patron placeholder, and action button placeholder.

### 2.2 Book Catalog & Copies Explorer (`Catalog.jsx`)
- **State Hook:** `const [loading, setLoading] = useState(true)` during `fetchCatalog()`.
- **Skeleton Layout:**
  - Persisted mode detection (`catalog_view === 'grid'` vs `'table'`).
  - **Grid Mode Skeleton:**
    - 8 cards in responsive grid (`sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`).
    - Top badges row (`genre` pill + `status` pill).
    - Book cover placeholder (2:3 aspect ratio).
    - Title line (`w-4/5 h-4`), author line (`w-1/2 h-3`), call number tag (`w-20 h-4`).
    - Footer copy counter and button placeholder.
  - **Table Mode Skeleton:**
    - Table header structure preserved.
    - 6 table rows with cover thumbnail (`w-8 h-10`), 2-line title block, genre badge, call number, availability badge, and action button.

### 2.3 Patrons Directory (`Patrons.jsx`)
- **State Hook:** `const [loading, setLoading] = useState(true)` during `fetchPatrons()`.
- **Skeleton Layout:**
  - Persisted mode detection (`patrons_view === 'cards'` vs `'table'`).
  - **Card Mode Skeleton:**
    - 6 membership pass cards.
    - Header: Avatar circle (`w-11 h-11 rounded-2xl`), name line, member code.
    - Metric strip: Active loans chip and member since placeholder.
    - Action bar: Print pass and view profile button placeholders.
  - **Table Mode Skeleton:**
    - 6 table rows with avatar circle, name/email, patron code, active loan badge, and actions.

### 2.4 Circulation Activity (`Loans.jsx`)
- **State Hook:** `const [loading, setLoading] = useState(true)` during `fetchLoans()`.
- **Skeleton Layout:**
  - Top summary counter tabs: 4 pill buttons with shimmer count badges.
  - Timeline table: 6 rows with book cover thumbnail, title & copy code, patron name, countdown badge placeholder, and check-in button placeholder.

### 2.5 Public Search Kiosk (`Lookup.jsx`)
- **State Hooks:** `loadingCatalog` for Catalog Explorer tab; `patronBusy` for Patron Borrower Pass tab.
- **Skeleton Layout:**
  - **Catalog Explorer Tab:** Shimmer grid or table matching `CatalogSkeleton`.
  - **Patron Pass Tab (when looking up card):**
    - Patron header card placeholder (avatar, name, member badge).
    - Active loans table placeholder (3 rows with covers and due date chips).
    - Recommended for You gallery (4 card placeholders with covers).

---

## 3. Implementation Verification & Quality Gates
- `client/src/index.css`: Verify `@keyframes shimmer` runs smoothly on GPU with zero paint bottlenecks.
- Build verification: `npm run build` in `client/` must pass with 0 errors.
- Regression verification: All circulation features, filters, dual-view toggles, and modal dialogues remain fully interactive once data resolves.

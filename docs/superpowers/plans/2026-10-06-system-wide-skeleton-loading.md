# System-Wide Skeleton Loading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement zero-CLS skeleton loading screens with smooth CSS shimmer wave animations across all primary pages of the Sto. Tomas Municipal Library system.

**Architecture:** Create a reusable `Skeleton` UI primitive with continuous CSS shimmer translation in `client/src/components/ui/skeleton.jsx`, then integrate high-fidelity layout-matched skeleton states into each page (`Desk.jsx`, `Catalog.jsx`, `Patrons.jsx`, `Loans.jsx`, `Lookup.jsx`) while API data fetches resolve.

**Tech Stack:** React 19, TailwindCSS, Vite 8, Lucide React.

**Spec:** `docs/superpowers/specs/2026-10-06-system-wide-skeleton-loading.md`

## Global Constraints
- Zero breaking changes to existing circulation, check-in, search, or scan business logic.
- Zero cumulative layout shift (CLS): skeleton dimensions must accurately preview the loaded content cards, tables, and metric strips.
- All tasks must pass `npm run build` in `client/` with 0 errors.

---

### Task 1: Core Skeleton Primitive & Shimmer Animation
**Files:**
- Create: `client/src/components/ui/skeleton.jsx`
- Modify: `client/src/index.css`

**Interfaces:**
- Produces:
  - `Skeleton({ className, ...props })`
  - `SkeletonCover({ size, className })`
  - `SkeletonCircle({ size, className })`
  - `SkeletonText({ lines, className })`

- [x] **Step 1: Add shimmer keyframes and animation to `client/src/index.css`**
Add `@keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }` and `.animate-shimmer` utility if needed.

- [x] **Step 2: Create `client/src/components/ui/skeleton.jsx`**
Implement the `Skeleton`, `SkeletonCover`, `SkeletonCircle`, and `SkeletonText` components.

- [x] **Step 3: Verify build**
Run: `cd client && npm run build`
Expected: 0 errors.

- [x] **Step 4: Commit**
```bash
git add client/src/index.css client/src/components/ui/skeleton.jsx
git commit -m "feat(ui): add Skeleton primitive with shimmer wave animation"
```

---

### Task 2: Desk Dashboard Skeleton Integration (`Desk.jsx`)
**Files:**
- Modify: `client/src/pages/Desk.jsx`

**Interfaces:**
- Consumes: `Skeleton`, `SkeletonCircle` from `../components/ui/skeleton.jsx`
- Produces: `loading` state rendering `DeskSkeleton` previewing executive 4-metric strip, bar chart, and split workbenches while `Promise.all` executes.

- [x] **Step 1: Add `loading` state to `Desk.jsx`**
Initialize `const [loading, setLoading] = useState(true);`, set `setLoading(false)` once `Promise.all` resolves or errors.

- [x] **Step 2: Construct `DeskSkeleton` component**
Render 4 executive metric card skeletons, 6-bar chart skeleton, 4 circulation stream rows skeleton, and 3 overdue queue items skeleton when `loading === true`.

- [x] **Step 3: Verify build**
Run: `cd client && npm run build`
Expected: 0 errors.

- [x] **Step 4: Commit**
```bash
git add client/src/pages/Desk.jsx
git commit -m "feat(desk): add high-fidelity skeleton loading state"
```

---

### Task 3: Book Catalog & Copies Dual-View Skeleton (`Catalog.jsx`)
**Files:**
- Modify: `client/src/pages/Catalog.jsx`

**Interfaces:**
- Consumes: `Skeleton`, `SkeletonCover` from `../components/ui/skeleton.jsx`
- Produces: `loading` state rendering `CatalogGridSkeleton` (8 book cards) or `CatalogTableSkeleton` (6 table rows) based on `viewMode`.

- [x] **Step 1: Add `loading` state to `Catalog.jsx`**
Initialize `const [loading, setLoading] = useState(true);`, toggle off in `fetchCatalog().finally(...)`.

- [x] **Step 2: Construct `CatalogGridSkeleton` and `CatalogTableSkeleton`**
Render 8 card placeholders with cover aspect ratio, tags, and titles in Grid mode; render 6 table rows with cover thumbnails in Table mode.

- [x] **Step 3: Verify build**
Run: `cd client && npm run build`
Expected: 0 errors.

- [x] **Step 4: Commit**
```bash
git add client/src/pages/Catalog.jsx
git commit -m "feat(catalog): add dual-view grid and table skeleton loading states"
```

---

### Task 4: Patrons Directory Dual-View Skeleton (`Patrons.jsx`)
**Files:**
- Modify: `client/src/pages/Patrons.jsx`

**Interfaces:**
- Consumes: `Skeleton`, `SkeletonCircle` from `../components/ui/skeleton.jsx`
- Produces: `loading` state rendering `PatronsCardSkeleton` (6 member passes) or `PatronsTableSkeleton` (6 directory rows).

- [x] **Step 1: Add `loading` state to `Patrons.jsx`**
Initialize `const [loading, setLoading] = useState(true);`, toggle off in `fetchPatrons().finally(...)`.

- [x] **Step 2: Construct `PatronsCardSkeleton` and `PatronsTableSkeleton`**
Render 6 membership pass cards with circular avatar shimmers in Card mode; render 6 table rows in Table mode.

- [x] **Step 3: Verify build**
Run: `cd client && npm run build`
Expected: 0 errors.

- [x] **Step 4: Commit**
```bash
git add client/src/pages/Patrons.jsx
git commit -m "feat(patrons): add dual-view membership pass skeleton loading states"
```

---

### Task 5: Circulation Activity Timeline Skeleton (`Loans.jsx`)
**Files:**
- Modify: `client/src/pages/Loans.jsx`

**Interfaces:**
- Consumes: `Skeleton`, `SkeletonCover` from `../components/ui/skeleton.jsx`
- Produces: `loading` state rendering 4 counter tab pill skeletons and 6 timeline loan rows with countdown badge placeholders.

- [x] **Step 1: Integrate `loading` state in `Loans.jsx`**
Ensure `loading` is set to `true` at fetch start and `false` on completion.

- [x] **Step 2: Construct `LoansSkeleton`**
Render 4 status tab pill skeletons and 6 timeline table rows with book cover, title, patron name, and countdown chips placeholders.

- [x] **Step 3: Verify build**
Run: `cd client && npm run build`
Expected: 0 errors.

- [x] **Step 4: Commit**
```bash
git add client/src/pages/Loans.jsx
git commit -m "feat(loans): add timeline activity skeleton loading state"
```

---

### Task 6: Public Search Kiosk Skeletons (`Lookup.jsx`)
**Files:**
- Modify: `client/src/pages/Lookup.jsx`

**Interfaces:**
- Consumes: `Skeleton`, `SkeletonCover` from `../components/ui/skeleton.jsx`
- Produces: Skeletons for `loadingCatalog` in the Catalog Explorer tab, and for `patronBusy` in the Patron Borrower Pass tab.

- [x] **Step 1: Implement `CatalogExplorerSkeleton` in `Lookup.jsx`**
Render grid or table book skeletons while `loadingCatalog === true`.

- [x] **Step 2: Implement `PatronPassSkeleton` in `Lookup.jsx`**
Render active loans table skeleton and recommendations gallery skeleton while `patronBusy === true`.

- [x] **Step 3: Verify build**
Run: `cd client && npm run build`
Expected: 0 errors.

- [x] **Step 4: Commit**
```bash
git add client/src/pages/Lookup.jsx
git commit -m "feat(lookup): add catalog explorer and patron pass skeleton loading states"
```

---

### Task 7: Full System Verification & Regression Testing
**Files:**
- None (verification)

- [x] **Step 1: Run production build**
Run: `npm run build` in `client/`
Expected: 0 errors.

- [x] **Step 2: Run test suite**
Run: `node --test test/recommender.test.js`
Expected: 100% passing tests.

- [x] **Step 3: Commit plan completion**
```bash
git add docs/superpowers/plans/2026-10-06-system-wide-skeleton-loading.md
git commit -m "docs: complete system-wide skeleton loading implementation plan"
```

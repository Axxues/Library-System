# System-Wide Fluid Motion Design Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement system-wide 60fps GPU-accelerated motion choreography, active tactile feedback, hover card elevation, modal spring animations, and view cross-fades across the Sto. Tomas Municipal Library system.

**Architecture:** Enhance base UI components (`button.jsx`, `dialog.jsx`, `metric-card.jsx`, `index.css`) with standard active/hover micro-interactions, then integrate smooth view transitions (`animate-in fade-in`), card hover lifts, and HUD animations into each page (`Desk.jsx`, `Scan.jsx`, `Catalog.jsx`, `Patrons.jsx`, `Loans.jsx`, `Lookup.jsx`).

**Tech Stack:** React 19, TailwindCSS, `tailwindcss-animate`, Vite 8, Lucide React.

**Spec:** `docs/superpowers/specs/2026-10-06-system-wide-motion-design.md`

## Global Constraints
- Zero breaking changes to existing circulation business logic, barcode scanning, or API contracts.
- Strictly GPU-accelerated CSS animations (`transform` and `opacity`) to maintain 60fps on kiosks and lower-power hardware.
- All tasks must pass `npm run build` in `client/` with 0 errors.

---

### Task 1: Global Interactive Component Motion (`button.jsx`, `dialog.jsx`, `metric-card.jsx`, `index.css`)
**Files:**
- Modify: `client/src/components/ui/button.jsx`
- Modify: `client/src/components/ui/dialog.jsx`
- Modify: `client/src/components/ui/metric-card.jsx`
- Modify: `client/src/index.css`

- [ ] **Step 1: Add tactile press feedback to `Button.jsx`**
Add `active:scale-[0.98] transition-all duration-150 ease-out` to button variants.

- [ ] **Step 2: Add spring-scale modal animation to `Dialog.jsx`**
Add `animate-in zoom-in-95 fade-in duration-200 ease-out` to modal container.

- [ ] **Step 3: Add hover elevation to `MetricCard.jsx`**
Add `hover:-translate-y-1 hover:shadow-card-hover hover:border-primary/40 transition-all duration-200` and icon micro-motion.

- [ ] **Step 4: Verify build**
Run: `cd client && npm run build`
Expected: 0 errors.

- [ ] **Step 5: Commit**
```bash
git add client/src/components/ui/button.jsx client/src/components/ui/dialog.jsx client/src/components/ui/metric-card.jsx client/src/index.css
git commit -m "feat(motion): add tactile press feedback, spring dialogs, and card hover physics"
```

---

### Task 2: Desk Dashboard Motion Choreography (`Desk.jsx`)
**Files:**
- Modify: `client/src/pages/Desk.jsx`

- [ ] **Step 1: Add throughput bar chart height transitions**
Add `transition-[height] duration-500 ease-out hover:brightness-110 hover:scale-x-105` to the monthly bar columns.

- [ ] **Step 2: Add quick-return button press and row hover transitions**
Add smooth row transitions and active button feedback in workbench lists.

- [ ] **Step 3: Verify build**
Run: `cd client && npm run build`
Expected: 0 errors.

- [ ] **Step 4: Commit**
```bash
git add client/src/pages/Desk.jsx
git commit -m "feat(desk): add bar chart transitions and workbench row motion"
```

---

### Task 3: Dual-QR Station Optical HUD & Dock Motions (`Scan.jsx`)
**Files:**
- Modify: `client/src/pages/Scan.jsx`

- [ ] **Step 1: Enhance laser scanline and viewfinder bracket pulsing**
Add continuous sweep and pulsing corner crosshairs to the camera HUD.

- [ ] **Step 2: Add dock detection pop-in transitions**
Add `animate-in zoom-in-95 duration-200` when Patron Pass or Book Copy is docked.

- [ ] **Step 3: Verify build**
Run: `cd client && npm run build`
Expected: 0 errors.

- [ ] **Step 4: Commit**
```bash
git add client/src/pages/Scan.jsx
git commit -m "feat(scan): add optical HUD laser sweeps and smart dock scan transitions"
```

---

### Task 4: Catalog & Copies View-Switch & Card Motion (`Catalog.jsx`)
**Files:**
- Modify: `client/src/pages/Catalog.jsx`

- [ ] **Step 1: Add view-switch cross-fade and filter chip active feedback**
Add `animate-in fade-in duration-200` to grid and table views.

- [ ] **Step 2: Add 3D card elevation, cover zoom, and condition dialog springs**
Add `hover:-translate-y-1.5 hover:shadow-lifted hover:border-primary/50 group-hover:scale-105` to book cards.

- [ ] **Step 3: Verify build**
Run: `cd client && npm run build`
Expected: 0 errors.

- [ ] **Step 4: Commit**
```bash
git add client/src/pages/Catalog.jsx
git commit -m "feat(catalog): add view cross-fades and book card hover motion"
```

---

### Task 5: Patrons Directory & Member Pass Motion (`Patrons.jsx`)
**Files:**
- Modify: `client/src/pages/Patrons.jsx`

- [ ] **Step 1: Add view-switch cross-fade and member pass card hover lifts**
Add `hover:-translate-y-1 hover:shadow-lifted hover:border-primary/40` and avatar scale.

- [ ] **Step 2: Add spring-scale animation to printable membership pass modal**
Ensure QR pass modal pops in with spring physics.

- [ ] **Step 3: Verify build**
Run: `cd client && npm run build`
Expected: 0 errors.

- [ ] **Step 4: Commit**
```bash
git add client/src/pages/Patrons.jsx
git commit -m "feat(patrons): add member pass hover lifts and modal spring transitions"
```

---

### Task 6: Circulation Activity & Public Kiosk Motion (`Loans.jsx`, `Lookup.jsx`)
**Files:**
- Modify: `client/src/pages/Loans.jsx`
- Modify: `client/src/pages/Lookup.jsx`

- [ ] **Step 1: Add status tab cross-fade and inline return button press in `Loans.jsx`**
Add smooth tab switching transitions and `active:scale-[0.96]` feedback on check-in.

- [ ] **Step 2: Add kiosk navigation tab slide and recommendation card hover in `Lookup.jsx`**
Add smooth tab transitions, card hover lifts, and copy inspection modal spring.

- [ ] **Step 3: Verify build**
Run: `cd client && npm run build`
Expected: 0 errors.

- [ ] **Step 4: Commit**
```bash
git add client/src/pages/Loans.jsx client/src/pages/Lookup.jsx
git commit -m "feat(loans,lookup): add circulation tab cross-fades and kiosk motion"
```

---

### Task 7: Full System Verification & Regression Testing
**Files:**
- None (verification)

- [ ] **Step 1: Run production build**
Run: `npm run build` in `client/`
Expected: 0 errors.

- [ ] **Step 2: Run test suite**
Run: `node --test test/recommender.test.js`
Expected: 100% passing tests.

- [ ] **Step 3: Commit plan completion**
```bash
git add docs/superpowers/plans/2026-10-06-system-wide-motion-design.md
git commit -m "docs: complete system-wide motion design implementation plan"
```

# System-Wide Fluid Motion Design Specification

## Overview
This specification details the motion design system and tactile micro-interactions added throughout the Sto. Tomas Municipal Library Dual-QR Circulation System.

The goal is to make every movement, click, hover, tab switch, and modal transition feel fluid, responsive, and alive (Command-Center aesthetic), while maintaining 60fps GPU acceleration and zero runtime performance overhead.

---

## 1. Global Motion Design System & Tokens

### 1.1 Tactile Interactive Controls
- **Buttons & Pills (`Button.jsx`, Filter Chips, Tab Switchers):**
  - Active press physics: `active:scale-[0.98] transition-all duration-150 ease-out`
  - Hover brightness & ring feedback: `hover:brightness-105 hover:shadow-primary-sm`
  - Disabled state: `disabled:opacity-50 disabled:pointer-events-none`
- **Dialogs, Modals & Floating Popovers (`Dialog.jsx`, tooltips, profile dropdown):**
  - Backdrop: `animate-in fade-in duration-200 backdrop-blur-sm`
  - Modal container: `animate-in zoom-in-95 fade-in-up duration-200 ease-out`
  - Rail Tooltips: `opacity-0 -translate-x-2 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0`

### 1.2 Card Elevation & Micro-Interactions
- **Metric Cards (`MetricCard.jsx`):**
  - Hover translation: `hover:-translate-y-1 hover:shadow-card-hover hover:border-primary/40 transition-all duration-200 ease-out`
  - Icon accent: `group-hover:scale-110 group-hover:rotate-3 transition-transform duration-200`
- **Book Cards (`Catalog.jsx`, `Lookup.jsx`):**
  - Hover translation: `hover:-translate-y-1.5 hover:shadow-lifted hover:border-primary/50 transition-all duration-200`
  - Book Cover zoom: `group-hover:scale-105 transition-transform duration-200`
- **Patron Passes (`Patrons.jsx`):**
  - Hover translation: `hover:-translate-y-1 hover:shadow-lifted hover:border-primary/40 transition-all duration-200`
  - Avatar micro-scale: `group-hover:scale-105 transition-transform duration-200`

---

## 2. Page-Level Motion Choreography

### 2.1 Executive Desk Dashboard (`Desk.jsx`)
- Executive stat cards enter with staggered subtle fade-in.
- Monthly throughput bar chart: animated upward height bars (`transition-[height] duration-500 ease-out`) with hover scale.
- Split workbench: smooth row transitions on quick returns.

### 2.2 Dual-QR Circulation Station (`Scan.jsx`)
- Optical Viewfinder HUD:
  - Laser sweep: Continuous vertical sweep (`animate-laser-scan`).
  - Corner crosshairs: Pulsing bracket glow.
- Smart Dock Slots:
  - When Slot 1 (Patron) or Slot 2 (Book Copy) gets scanned: pop-in animation (`animate-in zoom-in-95 fade-in duration-200`) and green pulse indicator.
- Authorization Checkout Drawer:
  - Complete check-in / check-out button with active bounce and receipt pop-in.

### 2.3 Book Catalog & Copies (`Catalog.jsx`)
- View switcher (`grid` <-> `table`): Cross-fade transition (`animate-in fade-in duration-200`).
- Condition updater dialog & QR label print dialog: Spring scale modal entry (`animate-in zoom-in-95 duration-150`).

### 2.4 Patrons Directory (`Patrons.jsx`)
- View switcher (`cards` <-> `table`): Cross-fade transition.
- Printable pass modal: Spring entry with high-contrast QR code rendering.

### 2.5 Circulation Activity (`Loans.jsx`)
- Status tabs (`All`, `Active`, `Overdue`, `Returned`): Content cross-fade.
- 1-click `Check In` return button: `active:scale-[0.96]` tactile feedback and immediate row state update.

### 2.6 Public Search Kiosk (`Lookup.jsx`)
- Tab switcher (`Catalog Explorer` <-> `My Borrower Pass`): Smooth cross-fade.
- Search result cards: Staggered entry with hover lift and cover zoom.

---

## 3. Accessibility & Performance Guardrails
- **Hardware Acceleration:** All animations use CSS `transform` and `opacity` properties to run on the compositor thread without layout repaints.
- **Reduced Motion:** Full respect for `@media (prefers-reduced-motion: reduce)` in `client/src/index.css`.
- **Zero CLS:** Elements animate transform in place without changing layout flow dimensions.

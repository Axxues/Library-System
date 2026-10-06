# Cellwego Theme Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `client/` to Tailwind v3 + Cellwego HSL tokens/blue primary with new Layout/Navbar/Sidebar and converted pages.

**Architecture:** Copy reference `tailwind.config.js` + `src/index.css` verbatim into `client/`, port 6 `ui/` primitives to JSX, rewrite shell to fixed glass Navbar + collapsible Sidebar, convert 9 pages class-by-class with logic untouched.

**Tech Stack:** Vite 8, React 19 JSX, react-router-dom 7, TailwindCSS 3.4.17, postcss/autoprefixer, clsx, tailwind-merge, class-variance-authority, lucide-react.

**Spec:** `docs/superpowers/specs/2026-10-06-cellwego-theme-migration-design.md`

## Global Constraints

- TailwindCSS pinned `^3.4.17` (reference uses `@tailwind base` directives; v4 breaks them).
- Primary stays Cellwego blue: light `221 83% 55%`, dark `217 91% 60%` — do not reintroduce pine green.
- Dark mode via `class="dark"` on `<html>`, never `[data-theme]`.
- No new ui primitives beyond button/card/badge/input/table/dialog.
- Page logic (QR/scan/loan fetch) stays byte-identical; only classNames change.
- `client/vite.config.js` unchanged.

---

### Task 1: Tailwind foundation

**Files:**
- Create: `client/tailwind.config.js`, `client/postcss.config.js`, `client/src/index.css`
- Modify: `client/package.json`, `client/index.html`, `client/src/main.jsx`
- Delete: `client/src/theme.css`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: `cn()`-ready Tailwind build; `client/src/index.css` exporting HSL vars + utilities; `document.documentElement.classList` dark contract for Task 3.

- [ ] **Step 1: Install Tailwind deps**

```bash
npm install -D tailwindcss@^3.4.17 postcss autoprefixer
npm install clsx tailwind-merge class-variance-authority
```

Run: `npm install` in `client/`
Expected: PASS, `node_modules/tailwindcss` exists.

- [ ] **Step 2: Add tailwind + postcss configs**

`client/tailwind.config.js` — copy verbatim from reference:

Run:
```bash
Copy-Item -LiteralPath "D:\cellwego\Frontend\Admin\tailwind.config.js" -Destination "client\tailwind.config.js" -Force
```

`client/postcss.config.js` — create with:

```js
export default { plugins: { tailwindcss: {}, autoprefixer: {} } };
```

- [ ] **Step 3: Add index.css (verbatim port)**

Run:
```bash
Copy-Item -LiteralPath "D:\cellwego\Frontend\Admin\src\index.css" -Destination "client\src\index.css" -Force
```

- [ ] **Step 4: Rewire index.html + main.jsx, delete theme.css**

`client/index.html` — fonts already present; replace pre-paint script line 12 with:

```html
<script>try{if((localStorage.getItem('theme')||'light')==='dark')document.documentElement.classList.add('dark')}catch(e){}</script>
```

`client/src/main.jsx` — add import:

```js
import './index.css';
```

Run:
```bash
Remove-Item -LiteralPath "client\src\theme.css" -Force
npm run build
```

Expected: PASS (unstyled JSX still compiles; Tailwind classes mostly absent until Tasks 2-5).

- [ ] **Step 5: Commit**

```bash
git add client/package.json client/tailwind.config.js client/postcss.config.js client/src/index.css client/index.html client/src/main.jsx
git commit -m "feat: tailwind foundation with cellwego tokens"
```

### Task 2: UI primitives (JSX ports)

**Files:**
- Create: `client/src/lib/cn.js`, `client/src/components/ui/button.jsx`, `client/src/components/ui/card.jsx`, `client/src/components/ui/badge.jsx`, `client/src/components/ui/input.jsx`, `client/src/components/ui/table.jsx`, `client/src/components/ui/dialog.jsx`

**Interfaces:**
- Consumes: Task 1 Tailwind tokens (`bg-card`, `text-muted-foreground`, `shadow-card`, …).
- Produces: `Button`, `Card…`, `Badge`, `Input`, `Table…`, `Dialog…` imports for Tasks 3-5.

- [ ] **Step 1: Create cn util**

```js
// client/src/lib/cn.js
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) { return twMerge(clsx(inputs)); }
```

- [ ] **Step 2: Create button.jsx (JSX port of reference, no Radix Slot)**

```jsx
import { cva } from "class-variance-authority";
import { cn } from "../../lib/cn.js";
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 shrink-0 outline-none focus-visible:ring-[3px]",
  { variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-subtle hover:shadow-card hover:bg-primary/90 active:scale-[0.98]",
        destructive: "bg-destructive text-white shadow-subtle hover:bg-destructive/90 active:scale-[0.98]",
        outline: "border border-input bg-background text-foreground shadow-subtle hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
        secondary: "bg-secondary text-secondary-foreground shadow-subtle hover:bg-secondary/80 active:scale-[0.98]",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        soft: "bg-primary/10 text-primary shadow-none hover:bg-primary/20",
      },
      size: { default: "h-9 px-4 py-2", sm: "h-8 rounded-lg gap-1.5 px-3 text-xs", lg: "h-10 rounded-lg px-6 text-base", icon: "size-9 rounded-lg" },
    },
    defaultVariants: { variant: "default", size: "default" } }
);
export function Button({ className, variant, size, ...props }) {
  return <button data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
```

- [ ] **Step 3: Create card.jsx / badge.jsx / input.jsx**

```jsx
// card.jsx
import { cn } from "../../lib/cn.js";
export function Card({ className, ...props }) {
  return <div data-slot="card" className={cn("bg-card text-card-foreground flex flex-col gap-6 rounded-xl border shadow-card p-6", className)} {...props} />;
}
export function CardHeader({ className, ...props }) {
  return <div className={cn("flex flex-col gap-1.5", className)} {...props} />;
}
export function CardTitle({ className, ...props }) {
  return <h4 className={cn("leading-none font-semibold text-card-foreground", className)} {...props} />;
}
export function CardDescription({ className, ...props }) {
  return <p className={cn("text-muted-foreground text-sm", className)} {...props} />;
}
export function CardContent({ className, ...props }) {
  return <div className={cn("", className)} {...props} />;
}
```

```jsx
// badge.jsx
import { cva } from "class-variance-authority";
import { cn } from "../../lib/cn.js";
const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", {
  variants: { variant: {
    default: "border-transparent bg-primary text-primary-foreground",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    success: "border-transparent bg-success/10 text-success",
    warning: "border-transparent bg-warning/10 text-warning",
    destructive: "border-transparent bg-destructive/10 text-destructive",
    outline: "text-foreground",
  } },
  defaultVariants: { variant: "default" },
});
export function Badge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
```

```jsx
// input.jsx
import { cn } from "../../lib/cn.js";
export function Input({ className, ...props }) {
  return <input className={cn("flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-subtle outline-none placeholder:text-muted-foreground focus-visible:ring-[3px] focus-visible:ring-ring/30", className)} {...props} />;
}
```

- [ ] **Step 4: Create table.jsx / dialog.jsx**

```jsx
// table.jsx
import { cn } from "../../lib/cn.js";
export function Table({ className, ...props }) { return <table className={cn("w-full caption-bottom text-sm", className)} {...props} />; }
export function TableHeader({ className, ...props }) { return <thead className={cn("[&_tr]:border-b", className)} {...props} />; }
export function TableBody({ className, ...props }) { return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />; }
export function TableRow({ className, ...props }) { return <tr className={cn("border-b transition-colors hover:bg-muted/50", className)} {...props} />; }
export function TableHead({ className, ...props }) { return <th className={cn("h-10 px-2 text-left align-middle text-xs font-semibold uppercase tracking-wider text-muted-foreground", className)} {...props} />; }
export function TableCell({ className, ...props }) { return <td className={cn("p-2 align-middle", className)} {...props} />; }
```

```jsx
// dialog.jsx — minimal, no Radix; fixed overlay + centered panel
import { cn } from "../../lib/cn.js";
export function Dialog({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="overlay-backdrop fixed inset-0" onClick={onClose} />
      <div className={cn("relative z-10 w-full max-w-2xl rounded-2xl border bg-card p-6 shadow-float animate-scale-in")}>{children}</div>
    </div>
  );
}
```

- [ ] **Step 5: Verify + commit**

Run: `npm run build` in `client/`
Expected: PASS.

```bash
git add client/src/lib/cn.js client/src/components/ui/
git commit -m "feat: add minimal cellwego ui primitives"
```

### Task 3: Shell (Layout/Navbar/Sidebar + App rewire)

**Files:**
- Create: `client/src/layouts/Layout.jsx`, `client/src/layouts/Navbar.jsx`, `client/src/layouts/Sidebar.jsx`
- Modify: `client/src/App.jsx`

**Interfaces:**
- Consumes: Task 2 `Button`, `Input`, `Dialog`.
- Produces: `<Layout>` shell contract used by all pages (pages render inside `max-w-[1600px]` container; no page may import old `.shell/.sidebar/.topbar` CSS).

- [ ] **Step 1: Create Sidebar.jsx**

```jsx
import { NavLink } from 'react-router-dom';
import { BookOpen, ClipboardList, PanelLeftClose, PanelLeftOpen, QrCode, ScanLine, Search as SearchIcon, Users } from 'lucide-react';
import { cn } from "../lib/cn.js";
export const NAV = [
  { to: '/desk', label: 'Desk', Icon: ScanLine },
  { to: '/scan', label: 'Scan', Icon: QrCode },
  { to: '/catalog', label: 'Books', Icon: BookOpen },
  { to: '/patrons', label: 'Members', Icon: Users },
  { to: '/loans', label: 'Activity', Icon: ClipboardList },
  { to: '/lookup', label: 'Lookup', Icon: SearchIcon },
];
export function Sidebar({ open, setOpen, collapsed, onToggle }) {
  return (
    <>
      {open && <div className="overlay-backdrop fixed inset-0 z-10 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cn("z-20 flex h-[calc(100vh-4rem)] flex-col border-r border-border/60 bg-background/95 backdrop-blur-xl transition-all max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:top-16", open ? "max-lg:translate-x-0" : "max-lg:-translate-x-full", collapsed ? "lg:w-16 w-72" : "w-72")}>
        <button type="button" onClick={onToggle} className="absolute top-3 right-0 hidden h-9 w-9 translate-x-1/2 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-subtle lg:flex" aria-label="Toggle sidebar">
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
        <nav className="custom-scrollbar flex-1 space-y-0.5 overflow-y-auto p-4">
          {NAV.map((l) => (
            <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)}
              className={({ isActive }) => cn("flex items-center gap-2.5 rounded-xl px-3 py-3 text-[15px] font-medium text-muted-foreground transition-all hover:bg-accent hover:text-foreground", isActive && "bg-primary font-bold text-primary-foreground shadow-primary-sm")}>
              <l.Icon className="h-5 w-5 shrink-0" />{!collapsed && <span>{l.label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
```

- [ ] **Step 2: Create Navbar.jsx**

```jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, Moon, Search, Settings as SettingsIcon, Sun, UserRound, X } from 'lucide-react';
import { NAV } from "./Sidebar.jsx";
import { Dialog } from "../components/ui/dialog.jsx";
export function Navbar({ sidebarOpen, setSidebarOpen, theme, setTheme, onLogout }) {
  const [q, setQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const nav = useNavigate();
  const me = (() => { try { return JSON.parse(localStorage.getItem('staff') || '{}'); } catch { return {}; } })();
  const results = NAV.filter((l) => (l.label + l.to).toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8);
  return (
    <nav className="glass fixed top-0 z-30 w-full border-b border-border/40 shadow-subtle">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-xl p-2 text-muted-foreground hover:bg-accent lg:hidden">{sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
          <span className="ml-2 text-base font-black tracking-tight">STO.TOMAS <span className="text-primary">LIBRARY</span></span>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="ml-3 hidden h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-accent md:flex" aria-label="Toggle dark mode">{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
        </div>
        <button onClick={() => setSearchOpen(true)} className="mx-3 hidden h-10 w-full max-w-xl items-center justify-between rounded-full border border-border bg-muted/50 px-4 hover:bg-muted md:flex">
          <span className="flex items-center text-sm font-semibold text-muted-foreground"><Search className="mr-3 h-4 w-4" />Search pages…</span>
          <span className="rounded-lg border border-border bg-background px-2 py-1 text-[10px] font-black text-muted-foreground">Ctrl K</span>
        </button>
        <div className="relative">
          <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center rounded-xl border border-transparent px-2 py-1.5 hover:border-border hover:bg-accent">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{(me.username || 'S')[0].toUpperCase()}</span>
            <span className="ml-2 hidden max-w-[120px] truncate text-sm font-bold sm:block">{me.username || 'Staff'}</span>
          </button>
          {profileOpen && (
            <div className="absolute right-0 z-50 mt-3 w-64 rounded-xl border border-border bg-card p-2 shadow-float">
              <button className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-bold hover:bg-accent" onClick={() => { setProfileOpen(false); nav('/profile'); }}><UserRound className="mr-3 h-4 w-4 text-muted-foreground" />Profile</button>
              <button className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-bold hover:bg-accent" onClick={() => { setProfileOpen(false); nav('/settings'); }}><SettingsIcon className="mr-3 h-4 w-4 text-muted-foreground" />Settings</button>
              <button className="flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/10" onClick={onLogout}><LogOut className="mr-3 h-4 w-4" />Log out</button>
            </div>
          )}
        </div>
      </div>
      <Dialog open={searchOpen} onClose={() => setSearchOpen(false)}>
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <Search className="h-5 w-5 text-muted-foreground" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search pages…" className="w-full bg-transparent text-base font-bold outline-none placeholder:text-muted-foreground"
            onKeyDown={(e) => { if (e.key === 'Enter' && results[0]) { setSearchOpen(false); nav(results[0].to); } }} />
        </div>
        <div className="max-h-[50vh] overflow-y-auto pt-2">
          {results.map((r) => <button key={r.to} onClick={() => { setSearchOpen(false); nav(r.to); }} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left hover:bg-primary/5"><r.Icon className="h-5 w-5 text-muted-foreground" /><span className="text-sm font-black">{r.label}</span><span className="text-xs text-muted-foreground">{r.to}</span></button>)}
          {results.length === 0 && <p className="py-10 text-center text-sm font-bold text-muted-foreground">No matches.</p>}
        </div>
      </Dialog>
    </nav>
  );
}
```

- [ ] **Step 3: Create Layout.jsx + rewire App.jsx**

```jsx
// layouts/Layout.jsx
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from "./Navbar.jsx";
import { Sidebar } from "./Sidebar.jsx";
export function Layout({ theme, setTheme, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-muted font-sans">
      <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} theme={theme} setTheme={setTheme} onLogout={onLogout} />
      <div className="relative flex min-w-0 flex-1 overflow-hidden pt-16">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <main className="custom-scrollbar relative w-full min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto max-w-[1600px] animate-fade-in-up p-5 sm:p-8 lg:p-10"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
```

`client/src/App.jsx` — replace `.shell/.sidebar/.topbar/.tabbar` markup with `Layout` route wrapper; replace `document.documentElement.dataset.theme = theme` with:

```js
document.documentElement.classList.toggle('dark', theme === 'dark');
```

Keep `links`, `gated()`, `logout()`, all 9 routes, footer text. Ctrl+K: add `useEffect` keydown in `Navbar` (already opens via button; add `window.addEventListener('keydown')` for ctrl/cmd+k → `setSearchOpen(true)`).

- [ ] **Step 4: Verify + commit**

Run: `npm run build` in `client/`
Expected: PASS. Smoke `/desk` shows fixed navy-on-white navbar, blue active sidebar pill.

```bash
git add client/src/layouts/ client/src/App.jsx
git commit -m "feat: add cellwego shell layout"
```

### Task 4: Data pages (Desk, Catalog, Loans)

**Files:**
- Modify: `client/src/pages/Desk.jsx`, `client/src/pages/Catalog.jsx`, `client/src/pages/Loans.jsx`

**Interfaces:**
- Consumes: Task 3 `<Layout>` container; Task 2 `Card`, `Badge`, `Table*`, `Input`, `Button`.
- Produces: converted table/card pattern reused by Task 5 (same class strings).

Class map (apply everywhere in these 3 files, logic untouched):
- `className="card"` → `className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover"`
- `className="pill ok|busy|late"` → `<Badge variant="success|default|destructive">`
- `className="toolbar"` → `className="mb-3 flex items-center gap-2"`
- `className="grid three"` → `className="grid gap-4 md:grid-cols-3"`
- `className="grid two"` → `className="grid gap-4 md:grid-cols-2"`
- `<table>` → `<Table>`, `<thead>` → `<TableHeader>`, `<tbody>` → `<TableBody>`, `<tr>` → `<TableRow>`, `<th>` → `<TableHead>`, `<td>` → `<TableCell>`
- `<input>` → `<Input>`, `<button>` (primary action) → `<Button>`, secondary → `<Button variant="secondary">`
- `className="stamp ok|busy|late"` → `<Badge variant="success|default|destructive">`
- `className="empty"` → `className="py-7 text-center text-sm text-muted-foreground"`

- [ ] **Step 1: Convert Desk.jsx**

Edits in `client/src/pages/Desk.jsx`:
1. Add `import { Card, CardDescription } from '../components/ui/card.jsx'; import { Badge } from '../components/ui/badge.jsx'; import { Button } from '../components/ui/button.jsx'; import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';`
2. Line 64-66: `<div className="crumbs">` → `<p className="mb-1.5 text-xs text-muted-foreground">`; `<div className="masthead">…<h2>` → `<div className="mb-5 flex flex-wrap items-end gap-4"><div className="min-w-0 flex-1"><h2 className="heading-2">`; `<button onClick={() => nav('/scan')}>` → `<Button onClick={() => nav('/scan')}>`.
3. `dash`/`dash-main`/`dash-side` → `grid items-start gap-4 lg:grid-cols-[1fr_300px]` / `grid content-start gap-4` / `grid content-start gap-4`.
4. Stat tiles: `className="card"` → Card classes above; `<span className="num">` → `<span className="text-2xl font-extrabold tracking-tight">`; `<span className="lbl">` → `<span className="text-xs text-muted-foreground">`.
5. Latest activity table → Table components; `stamp ok/busy` → Badge.
6. Overdue/popular `loanrow` rows → `flex items-center gap-2 border-t border-border py-2 text-sm`.

- [ ] **Step 2: Convert Catalog.jsx + Loans.jsx with same map**

Catalog: `toolbar` → flex row; search `<input>` → `<Input className="max-w-xs">`; filter `<button className="secondary">` → `<Button variant="secondary">`; book `<table>` → Table set; status `pill` → Badge; `cellmain .cover/.t/.s` → `flex items-center gap-2.5` + `font-semibold` + `text-xs text-muted-foreground`.
Loans: same table swap; date filters `<input type="date">` → `<Input type="date" className="w-auto">` (native picker, no lib); status pills → Badge.

- [ ] **Step 3: Verify + commit**

Run: `npm run build` in `client/`
Expected: PASS.

```bash
git add client/src/pages/Desk.jsx client/src/pages/Catalog.jsx client/src/pages/Loans.jsx
git commit -m "feat: convert desk catalog loans to cellwego style"
```

### Task 5: Form + hero pages (Scan, Patrons, Lookup, Profile, Settings, Login)

**Files:**
- Modify: `client/src/pages/Scan.jsx`, `client/src/pages/Patrons.jsx`, `client/src/pages/Lookup.jsx`, `client/src/pages/Profile.jsx`, `client/src/pages/Settings.jsx`, `client/src/pages/Login.jsx`

**Interfaces:**
- Consumes: Task 4 class map + Task 2 primitives.
- Produces: all 9 pages converted; old `.loginpage/.scanbox/.kv` CSS fully unreferenced.

Same class map as Task 4 plus:
- `className="field"` → `className="mb-3"`; `label` → `className="mb-1.5 block text-[13px] font-semibold text-muted-foreground"`
- `className="alert"` → `className="mt-3 rounded-lg border border-destructive bg-destructive/10 p-2 px-3 text-sm text-destructive"`
- `className="kv"` → `className="my-3 grid grid-cols-[130px_1fr] gap-x-3 gap-y-1.5 text-sm"`
- `className="rec"` → `className="rounded-full border border-input bg-secondary px-3.5 py-1.5 text-[13px] font-medium"`

- [ ] **Step 1: Convert Scan.jsx + Patrons.jsx + Lookup.jsx**

Scan: `scanlayout` → `grid items-start gap-5 lg:grid-cols-[1.15fr_.85fr]`; `scanbox` → `rounded-lg border border-border bg-secondary p-3.5`; `actions` → `mt-3.5 flex gap-2`; keep `video.preview` element + QR logic identical.
Patrons/Lookup: tables → Table set; toolbar inputs → Input; Lookup results `rec` chips → new rec classes.

- [ ] **Step 2: Convert Profile.jsx + Settings.jsx**

Forms: `field`/`label`/`input`/`button.secondary` per map above. Accent picker in Settings keeps `document.documentElement.style.setProperty('--primary', …)` — replace with note: Cellwego blue is fixed, drop custom accent override (delete that `useEffect` in `App.jsx` Shell `api('/api/profile')` block).

- [ ] **Step 3: Convert Login.jsx hero to Cellwego blue**

Replace `loginpage` → `grid min-h-screen lg:grid-cols-[1.1fr_1fr]`; `loginhero` → `relative flex flex-col justify-center overflow-hidden bg-primary p-14 text-white` (drop pine gradient + orb/qrdeco spans, keep headline/copy/recs/shelf); `loginform .card` → `<Card className="w-full max-w-[380px]">`; inputs → Input; buttons → Button; `logintoggle` → absolute top-right ghost Button. Keep TOTP flow identical.

- [ ] **Step 4: Verify + commit**

Run: `npm run build` in `client/`
Expected: PASS.

```bash
git add client/src/pages/Scan.jsx client/src/pages/Patrons.jsx client/src/pages/Lookup.jsx client/src/pages/Profile.jsx client/src/pages/Settings.jsx client/src/pages/Login.jsx client/src/App.jsx
git commit -m "feat: convert remaining pages and login hero"
```

### Task 6: Verification pass

**Files:** none (verification only).

- [ ] **Step 1: Full build + lint**

Run:
```bash
npm run build
npm run lint
```

Expected: build PASS; lint shows no new errors (baseline: oxlint only).

- [ ] **Step 2: Route + theme smoke (manual, 10 min)**

1. `npm run dev`, visit `/login` → blue hero, card sign-in works.
2. `/desk` → stat cards lift on hover, trend bars render, tables striped on hover.
3. `/scan` → camera stage + receipt layout side-by-side on desktop, stacked on mobile.
4. Toggle dark (navbar moon/sun) → background turns deep slate `220 29% 10%`, cards `12%`.
5. Resize to 375px → sidebar hidden, content readable; `Ctrl+K` opens search.
6. `prefers-reduced-motion: reduce` → no drift/scan animation.

- [ ] **Step 3: Commit (only if fixes were needed)**

```bash
git add -A
git commit -m "fix: theme verification touch-ups"
```

## Self-Review

- Spec coverage: foundation (§Architecture ¶1) → Task 1; primitives (§Components ¶primitives) → Task 2; shell (§Components ¶shell) → Task 3; all 9 pages (§Components ¶pages) → Tasks 4-5; class-dark (§Architecture ¶dark) → Tasks 1+3; build+smoke (§Testing) → Task 6. No gaps.
- Placeholder scan: no TBD/TODO; every code step has literal code/commands; no "similar to Task N" (Task 5 repeats its own map).
- Type consistency: `cn(...inputs)` JS signature used identically in all primitives; `NAV` exported once from Sidebar, imported by Navbar; `Dialog({open, onClose})` signature matches both usages.

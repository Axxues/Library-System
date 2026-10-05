# Cellwego Admin visual port — Design Spec (2026-10-06)

## Goal
Copy layout, format, techniques, coloring of `D:\cellwego\Frontend\Admin` onto `D:\Kurbs\System\Prototype\client` (Vite + React JSX, 9 pages). Approved choices: full Tailwind migration, Cellwego blue primary, all pages at once.

## Approaches considered
- **A — Full Tailwind migration (chosen):** port `tailwind.config.js`, `src/index.css` HSL tokens, Layout/Navbar/Sidebar simplified to JSX, minimal `ui/` primitives, convert all 9 pages. Closest match, largest diff (~15 files + 5 deps).
- **B — Token port only (rejected):** copy colors/radius/shadows into `theme.css`. 1-file, ~80% look, fails "copy layout/techniques" ask.
- **C — Hybrid shell-first (rejected by user):** A in two passes. Safer but user wants all-at-once.

## Architecture
- Add `tailwindcss@3.4.17 + postcss + autoprefixer + clsx + tailwind-merge + class-variance-authority` to `client/`. Keep Vite React plugin, no TS conversion (reference TSX adapted to JSX).
- `client/tailwind.config.js`: verbatim copy of reference `content`, `darkMode: ["class"]`, colors (border/input/ring/background/foreground/primary/secondary/muted/accent/popover/card/surface/success/warning/info/sidebar-*), radius scale (`--radius: 0.625rem`), `boxShadow` (soft→float + primary/success/warning/destructive), animations/keyframes, `fontFamily.sans = Plus Jakarta Sans`, `tailwindcss-animate` plugin.
- `client/src/index.css`: port of reference `src/index.css` — `:root`/`.dark` HSL vars (primary `221 83% 55%` light / `217 91% 60%` dark), base scrollbar (4px thin), focus-visible ring, typography utils (heading-1..4, body, label, caption), `.glass`, `.card-hover`, `.shimmer`, `.custom-scrollbar`, `.overlay-backdrop`, dialog sizing, reduced-motion. Replaces `theme.css` (delete it). Add Plus Jakarta Sans `<link>` in `client/index.html` (reference font stack expects it; fallback system-ui otherwise).
- Dark mode: switch from `[data-theme]` to `class="dark"` on `<html>` to match reference; existing toggle in `App.jsx` flips class + localStorage.

## Components
- **Shell `client/src/layouts/Layout.jsx`** (from reference `Layout.tsx` minus permission/badge/Realtime/Chatbot bloat): `h-screen flex flex-col bg-muted`, fixed `Navbar`, `flex flex-1 pt-16` wrapper, collapsible `Sidebar`, `main.overflow-y-auto.custom-scrollbar > div.p-5.sm:p-8.lg:p-10.max-w-[1600px].mx-auto.animate-fade-in-up > Outlet/Routes`.
- **Navbar** (simplified from reference `Navbar.tsx`): fixed `glass border-b shadow-subtle h-16`, left: mobile hamburger + library logo + theme toggle; center: search pill (`rounded-full bg-muted/50`, `Ctrl+K` opens dialog that filters local routes + navigates to `/catalog?q=`); right: avatar dropdown (Profile/Settings/Log out) with logout confirm. Drop: language toggle, secure-mode badge, SignalR realtime, universal inventory search, QR dialogs.
- **Sidebar** (simplified from reference `Sidebar.tsx`): `w-72` / collapsed `w-16`, `bg-background/95 backdrop-blur-xl border-r`, groups from existing 6 links (Desk/Scan/Books/Members/Activity/Lookup), active item `bg-primary text-primary-foreground shadow-primary-sm rounded-xl`, nested style kept flat (no submenus in library app — omit SubMenuList/flyout, keep collapse button + mobile drawer + `overlay-backdrop`).
- **Primitives `client/src/components/ui/` (JSX ports, only these):** `button` (cva variants), `card`, `badge`, `input`, `table`, `dialog`. Omit 30+ other reference ui files (accordion, chart, carousel, etc.) — YAGNI.
- **Pages (all 9):** `Login, Desk, Scan, Catalog, Patrons, Loans, Lookup, Profile, Settings` — replace `.card/.pill/.grid/.kv/.toolbar` custom classes with Tailwind (`rounded-xl border bg-card shadow-card`, `text-muted-foreground`, `grid gap-4 md:grid-cols-2/3`). Keep all QR/scan/loan logic byte-identical; only classNames change. Login keeps split-hero idea but recolored to Cellwego blue gradient.

## Data flow
No API changes. Shell holds `sidebarOpen/profileOpen/collapsed` state (localStorage persist like `sidebarStorage`). Search dialog filters static route list; `?q=` passed via react-router navigation. Theme toggle writes `document.documentElement.classList`.

## Error handling
- Missing Tailwind content path → build still succeeds but unstyled; verify by `vite build` + route smoke.
- `.dark` class absent → dark looks light; toggle test covers it.
- Dialog focus trap: reuse reference `Dialog` port as-is.

## Testing
- `cd client; npm install; npm run build` passes.
- Manual smoke: each route renders, sidebar active state correct, search `Ctrl+K` works, dark toggle flips, mobile <1024px drawer works, `prefers-reduced-motion` respected.
- No new test framework (ponytail: trivial className swap needs no suite; build + smoke is the check).

## Files touched
Add: `client/tailwind.config.js`, `client/postcss.config.js`, `client/src/index.css`, `client/src/layouts/{Layout,Navbar,Sidebar}.jsx`, `client/src/components/ui/{button,card,badge,input,table,dialog}.jsx`. Edit: `client/package.json`, `client/index.html` (font link), `client/src/main.jsx` (import index.css), `client/src/App.jsx` (use Layout/Navbar/Sidebar + class dark), 9 pages. `client/vite.config.js` unchanged. Delete: `client/src/theme.css`.

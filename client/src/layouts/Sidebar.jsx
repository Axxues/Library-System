import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BookOpen,
  ClipboardList,
  Library,
  PanelLeftClose,
  PanelLeftOpen,
  QrCode,
  ScanLine,
  Search as SearchIcon,
  Users,
  Sparkles,
} from 'lucide-react';
import { cn } from '../lib/cn.js';

export const NAV_SECTIONS = [
  {
    title: 'Circulation',
    items: [
      { to: '/desk', label: 'Desk Dashboard', shortLabel: 'Desk', Icon: ScanLine },
      { to: '/scan', label: 'Dual-QR Station', shortLabel: 'Scan', Icon: QrCode },
    ],
  },
  {
    title: 'Management',
    items: [
      { to: '/catalog', label: 'Catalog & Copies', shortLabel: 'Catalog', Icon: BookOpen },
      { to: '/patrons', label: 'Patrons Directory', shortLabel: 'Members', Icon: Users },
      { to: '/loans', label: 'Circulation Activity', shortLabel: 'Loans', Icon: ClipboardList },
    ],
  },
  {
    title: 'Public Kiosk',
    items: [
      { to: '/lookup', label: 'Public Book Search', shortLabel: 'Lookup', Icon: SearchIcon },
    ],
  },
];

export const NAV = NAV_SECTIONS.flatMap((s) => s.items);

export function Sidebar({ open, setOpen, collapsed, onToggle }) {
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const fn = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);

  const isCollapsed = collapsed && isDesktop;

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {open && (
        <div
          className="overlay-backdrop fixed inset-0 z-20 bg-background/80 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Main Sidebar Aside */}
      <aside
        className={cn(
          'relative z-20 flex h-[calc(100vh-4rem)] flex-col border-r border-border/70 bg-card/85 backdrop-blur-xl transition-all duration-300 ease-in-out max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:top-16 shadow-subtle',
          open ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full',
          isCollapsed ? 'lg:w-[76px] w-72' : 'w-72'
        )}
      >
        {/* Toggle rail button (desktop only) */}
        <button
          type="button"
          onClick={onToggle}
          title={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          aria-expanded={!isCollapsed}
          className="absolute -right-3.5 top-6 z-30 hidden h-7 w-7 items-center justify-center rounded-full border border-border/80 bg-card text-muted-foreground shadow-subtle transition-all duration-150 hover:bg-accent hover:text-foreground hover:scale-110 lg:flex"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-3.5 w-3.5 shrink-0" />
          ) : (
            <PanelLeftClose className="h-3.5 w-3.5 shrink-0" />
          )}
        </button>

        {/* Navigation Sections */}
        <nav
          className={cn(
            'custom-scrollbar flex-1 space-y-6 overflow-y-auto',
            isCollapsed ? 'p-2.5' : 'p-4'
          )}
        >
          {NAV_SECTIONS.map((section, idx) => (
            <div key={section.title || idx} className="space-y-1">
              {!isCollapsed ? (
                <div className="flex items-center justify-between px-3 pb-2 pt-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 select-none">
                    {section.title}
                  </p>
                  <span className="text-[10px] font-mono text-muted-foreground/60">
                    {section.items.length}
                  </span>
                </div>
              ) : (
                <div className="my-2 border-t border-border/50" />
              )}

              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 rounded-2xl transition-all duration-150 select-none',
                      isCollapsed
                        ? 'justify-center h-12 w-full px-0'
                        : 'px-3.5 py-2.5 text-sm font-medium',
                      isActive
                        ? isCollapsed
                          ? 'bg-primary/10 text-primary font-semibold shadow-xs ring-1 ring-primary/30 dark:bg-primary/15'
                          : 'bg-primary/10 text-primary font-semibold shadow-xs before:absolute before:left-0 before:top-2.5 before:bottom-2.5 before:w-1.5 before:rounded-r-full before:bg-primary dark:bg-primary/15'
                        : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <item.Icon
                        className={cn(
                          'shrink-0 transition-transform duration-200 group-hover:scale-110',
                          isCollapsed ? 'h-5 w-5' : 'h-4 w-4',
                          isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                        )}
                      />

                      {!isCollapsed && (
                        <span className="truncate flex-1 tracking-tight">{item.label}</span>
                      )}

                      {/* Floating tooltip in collapsed rail mode */}
                      {isCollapsed && (
                        <div className="pointer-events-none absolute left-full ml-3.5 hidden rounded-xl border border-border/80 bg-popover px-3 py-1.5 text-xs font-semibold text-popover-foreground shadow-float opacity-0 -translate-x-2 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0 group-hover:flex items-center gap-2 z-50 whitespace-nowrap">
                          <span>{item.label}</span>
                          {isActive && (
                            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          )}
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Station Status Footer */}
        <div className="border-t border-border/60 bg-muted/15 p-2">
          {!isCollapsed ? (
            <div className="m-2 rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-primary/5 p-3.5 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-xs font-bold text-foreground">Circulation Desk</span>
                </div>
                <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  ONLINE
                </span>
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground font-mono">
                Sto. Tomas · Node 01
              </p>
            </div>
          ) : (
            <div className="group relative my-2 flex justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/60 bg-card/60 transition-colors group-hover:border-emerald-500/50 shadow-xs">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                </span>
              </div>
              <div className="pointer-events-none absolute left-full ml-3.5 hidden rounded-xl border border-border/80 bg-popover px-3 py-1.5 text-xs font-semibold text-popover-foreground shadow-float opacity-0 -translate-x-2 transition-all duration-150 group-hover:opacity-100 group-hover:translate-x-0 group-hover:flex items-center gap-2 z-50 whitespace-nowrap">
                <span>Sto. Tomas Desk · Online</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

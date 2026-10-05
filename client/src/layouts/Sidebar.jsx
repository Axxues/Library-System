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
} from 'lucide-react';
import { cn } from "../lib/cn.js";

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
      {open && (
        <div
          className="overlay-backdrop fixed inset-0 z-20 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        className={cn(
          "relative z-20 flex h-[calc(100vh-4rem)] flex-col border-r border-border/70 bg-card/80 backdrop-blur-xl transition-all duration-300 max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:top-16",
          open ? "max-lg:translate-x-0" : "max-lg:-translate-x-full",
          isCollapsed ? "lg:w-20 w-72" : "w-72"
        )}
      >
        {/* Toggle rail button */}
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

        <nav className={cn("custom-scrollbar flex-1 space-y-6 overflow-y-auto", isCollapsed ? "p-3" : "p-4")}>
          {NAV_SECTIONS.map((section, idx) => (
            <div key={section.title || idx} className="space-y-1">
              {!isCollapsed ? (
                <p className="px-3 pb-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80 select-none">
                  {section.title}
                </p>
              ) : (
                <div className="my-2 border-t border-border/40" />
              )}
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  title={item.label}
                  aria-label={item.label}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150",
                      isCollapsed ? "justify-center px-0 h-11 w-full" : "",
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-primary-sm"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                    )
                  }
                >
                  <item.Icon className={cn("h-4 w-4 shrink-0 transition-transform duration-150 group-hover:scale-110", isCollapsed ? "h-5 w-5" : "")} />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                  {isCollapsed && (
                    <span className="sr-only">{item.label}</span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer station indicator */}
        {!isCollapsed && (
          <div className="m-4 rounded-xl border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-foreground">Circulation Desk Active</span>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Terminal 01 · Online</p>
          </div>
        )}
      </aside>
    </>
  );
}

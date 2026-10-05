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

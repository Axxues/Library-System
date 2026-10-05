import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, Moon, Search, Settings as SettingsIcon, Sun, UserRound, X } from 'lucide-react';
import { NAV } from "./Sidebar.jsx";
import { Dialog } from "../components/ui/dialog.jsx";
export function Navbar({ sidebarOpen, setSidebarOpen, theme, setTheme, onLogout }) {
  const [q, setQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const nav = useNavigate();
  const me = (() => { try { return JSON.parse(localStorage.getItem('staff') || '{}'); } catch { return {}; } })();
  const results = NAV.filter((l) => (l.label + l.to).toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8);
  useEffect(() => {
    const onKey = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearchOpen(true); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    const outside = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setProfileOpen(false); };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', esc); };
  }, []);
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
        <div className="relative" ref={profileRef}>
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

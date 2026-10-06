import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Command,
  Library,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings as SettingsIcon,
  Sun,
  UserRound,
  X,
} from 'lucide-react';
import { NAV } from "./Sidebar.jsx";
import { Dialog } from "../components/ui/dialog.jsx";
import { Button } from "../components/ui/button.jsx";

export function Navbar({ sidebarOpen, setSidebarOpen, theme, setTheme, onLogout }) {
  const [q, setQ] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const profileRef = useRef(null);
  const nav = useNavigate();

  const me = (() => {
    try {
      return JSON.parse(localStorage.getItem('staff') || '{}');
    } catch {
      return {};
    }
  })();

  const results = NAV.filter((l) =>
    (l.label + l.to).toLowerCase().includes(q.trim().toLowerCase())
  ).slice(0, 8);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const outside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    const esc = (e) => {
      if (e.key === 'Escape') setProfileOpen(false);
    };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', outside);
      document.removeEventListener('keydown', esc);
    };
  }, []);

  return (
    <nav className="glass fixed top-0 z-30 w-full border-b border-border/70 backdrop-blur-md bg-background/85 shadow-subtle">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Left: Mobile hamburger + Brand */}
        <div className="flex min-w-0 shrink-0 items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors lg:hidden"
            aria-label="Toggle navigation drawer"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <div
            onClick={() => nav('/desk')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-primary-sm transition-transform duration-200 group-hover:scale-105">
              <Library className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-foreground">
                  STO. TOMAS
                </span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary">
                  LIBRARY
                </span>
              </div>
              <p className="hidden text-[10px] text-muted-foreground sm:block tracking-wide">
                Dual-QR Circulation Console
              </p>
            </div>
          </div>
        </div>

        {/* Center: Command Search Pill */}
        <button
          onClick={() => setSearchOpen(true)}
          className="mx-4 hidden h-10 w-full min-w-0 max-w-lg flex-1 items-center justify-between rounded-full border border-border/80 bg-muted/40 px-4 text-sm text-muted-foreground transition-all duration-150 hover:border-primary/40 hover:bg-muted/70 md:flex"
        >
          <span className="flex items-center gap-2.5">
            <Search className="h-4 w-4 text-muted-foreground/80" />
            <span className="text-xs font-medium">Quick jump or search pages…</span>
          </span>
          <kbd className="flex items-center gap-1 rounded-md border border-border/80 bg-background px-2 py-0.5 text-[10px] font-semibold text-muted-foreground shadow-xs">
            <Command className="h-3 w-3" /> K
          </kbd>
        </button>

        {/* Right: Theme Toggle & Staff Avatar Profile */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 text-muted-foreground transition-all duration-150 hover:bg-muted hover:text-foreground hover:border-primary/30"
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 text-amber-400 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="h-4 w-4 text-slate-700 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* User profile dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-card/60 px-2.5 py-1.5 shadow-xs transition-all duration-150 hover:border-border hover:bg-muted/80"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
                {(me.username || 'S')[0].toUpperCase()}
              </span>
              <span className="hidden max-w-[120px] truncate text-xs font-semibold text-foreground sm:block">
                {me.username || 'Staff'}
              </span>
            </button>

            {profileOpen && (
              <div className="absolute right-0 z-50 mt-2.5 w-60 overflow-hidden rounded-2xl border border-border/80 bg-card p-1.5 shadow-float animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2.5 border-b border-border/50">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {me.username || 'Desk Officer'}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Municipal Library Staff</p>
                </div>
                <div className="p-1 space-y-0.5">
                  <button
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                    onClick={() => {
                      setProfileOpen(false);
                      nav('/profile');
                    }}
                  >
                    <UserRound className="h-4 w-4 text-muted-foreground" />
                    Profile Details
                  </button>
                  <button
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                    onClick={() => {
                      setProfileOpen(false);
                      nav('/settings');
                    }}
                  >
                    <SettingsIcon className="h-4 w-4 text-muted-foreground" />
                    System Settings
                  </button>
                </div>
                <div className="p-1 border-t border-border/50">
                  <button
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 transition-colors hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    onClick={() => {
                      setProfileOpen(false);
                      setLogoutConfirm(true);
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Search Dialog */}
      <Dialog open={searchOpen} onClose={() => setSearchOpen(false)}>
        <div className="flex items-center gap-3 border-b border-border/70 pb-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type page name to navigate…"
            className="w-full bg-transparent text-sm font-semibold outline-none placeholder:text-muted-foreground"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && results[0]) {
                setSearchOpen(false);
                nav(results[0].to);
              }
            }}
          />
        </div>
        <div className="max-h-[50vh] overflow-y-auto pt-2 space-y-1">
          {results.map((r) => (
            <button
              key={r.to}
              onClick={() => {
                setSearchOpen(false);
                nav(r.to);
              }}
              className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-primary/10 hover:text-primary group"
            >
              <div className="flex items-center gap-3">
                <r.Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="font-medium text-foreground group-hover:text-primary">
                  {r.label}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">{r.to}</span>
            </button>
          ))}
          {results.length === 0 && (
            <p className="py-8 text-center text-xs text-muted-foreground">
              No matching pages found.
            </p>
          )}
        </div>
      </Dialog>

      <Dialog open={logoutConfirm} onClose={() => setLogoutConfirm(false)}>
        <div className="space-y-4">
          <div className="border-b border-border/70 pb-3">
            <h3 className="text-base font-bold text-foreground">Sign out?</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">You will need to sign in again to use the circulation desk.</p>
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-1">
            <Button type="button" variant="outline" onClick={() => setLogoutConfirm(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={() => { setLogoutConfirm(false); onLogout(); }}
              className="rounded-xl bg-destructive text-white shadow-xs hover:bg-destructive/90"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </Dialog>
    </nav>
  );
}

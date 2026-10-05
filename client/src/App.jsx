import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, ClipboardList, LogOut, Moon, QrCode, ScanLine, Search as SearchIcon, Settings as SettingsIcon, Sun, UserRound, Users } from 'lucide-react';
import Login from './pages/Login.jsx';
import Desk from './pages/Desk.jsx';
import Scan from './pages/Scan.jsx';
import Catalog from './pages/Catalog.jsx';
import Patrons from './pages/Patrons.jsx';
import Loans from './pages/Loans.jsx';
import Lookup from './pages/Lookup.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import { api } from './api.js';
const gated = (el) => (localStorage.getItem('token') ? el : <Navigate to="/login" />);
const links = [
  { to: '/desk', label: 'Desk', Icon: ScanLine },
  { to: '/scan', label: 'Scan', Icon: QrCode },
  { to: '/catalog', label: 'Books', Icon: BookOpen },
  { to: '/patrons', label: 'Members', Icon: Users },
  { to: '/loans', label: 'Activity', Icon: ClipboardList },
  { to: '/lookup', label: 'Lookup', Icon: SearchIcon },
];
function logout(nav) {
  localStorage.removeItem('token');
  localStorage.removeItem('staff');
  if (nav) nav('/login'); else location.href = '/login';
}
function staff() {
  try { return JSON.parse(localStorage.getItem('staff') || '{}'); } catch { return {}; }
}
function UserChip() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const nav = useNavigate();
  const me = staff();
  const name = me.username || 'Staff';
  useEffect(() => {
    const outside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', outside);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', outside); document.removeEventListener('keydown', esc); };
  }, []);
  return (<span className="adminwrap" ref={ref}>
    <button className="adminchip" onClick={() => setOpen(!open)} aria-haspopup="menu" aria-expanded={open}>
      <span className="avatar">{me.avatar ? <img src={me.avatar} alt="" /> : name[0].toUpperCase()}</span>{name}
    </button>
    {open && (<div className="usermenu" role="menu">
      <div className="usermeta"><span className="avatar">{name[0].toUpperCase()}</span><span><strong>{name}</strong><br /><span className="subtle">{me.role || 'staff'}</span></span></div>
      <button className="menurow" onClick={() => { setOpen(false); nav('/profile'); }}><span className="ico"><UserRound size={18} /></span>Profile</button>
      <button className="menurow" onClick={() => { setOpen(false); nav('/settings'); }}><span className="ico"><SettingsIcon size={18} /></span>Settings</button>
      <div className="menudivider" />
      <button className="menurow danger" onClick={() => logout(nav)}><span className="ico"><LogOut size={18} /></span>Log out</button>
    </div>)}
  </span>);
}
function Search() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  return <input className="search" placeholder="Search anything" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') nav('/catalog'); }} />;
}
function Shell({ theme, setTheme }) {
  const loc = useLocation();
  useEffect(() => {
    if (loc.pathname === '/login') return;
    api('/api/profile').then((p) => { if (p.accent) document.documentElement.style.setProperty('--primary', p.accent); }).catch(() => {});
  }, [loc.pathname]);
  if (loc.pathname === '/login') return <Login key="login" theme={theme} setTheme={setTheme} />;
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">STO.TOMAS<span> LIBRARY</span></div>
        <div className="navlabel">Circulation</div>
        {links.map((l) => <NavLink key={l.to} to={l.to} className={({ isActive }) => 'sidelink' + (isActive ? ' active' : '')}><span className="ico"><l.Icon size={18} /></span><span className="lbl">{l.label}</span></NavLink>)}
      </aside>
      <div className="main">
        <header className="topbar">
          <Search />
          <button className="iconbtn" title="Toggle light / dark" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}</button>
          <UserChip />
        </header>
        <div className="container" key={loc.pathname}>
          <Routes location={loc}>
            <Route path="/desk" element={gated(<Desk />)} />
            <Route path="/scan" element={gated(<Scan />)} />
            <Route path="/catalog" element={gated(<Catalog />)} />
            <Route path="/patrons" element={gated(<Patrons />)} />
            <Route path="/loans" element={gated(<Loans />)} />
            <Route path="/lookup" element={<Lookup />} />
            <Route path="/profile" element={gated(<Profile />)} />
            <Route path="/settings" element={gated(<Settings />)} />
            <Route path="*" element={<Navigate to="/desk" />} />
          </Routes>
          <div className="footer">Sto. Tomas Municipal Library · Dual-QR Circulation System</div>
        </div>
      </div>
      <nav className="tabbar" aria-label="Primary">
        {links.map((l) => <NavLink key={l.to} to={l.to} className={({ isActive }) => isActive ? 'active' : ''}><l.Icon size={20} /><div>{l.label}</div></NavLink>)}
      </nav>
    </div>
  );
}
export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('theme', theme); }, [theme]);
  return (
    <BrowserRouter>
      <Shell theme={theme} setTheme={setTheme} />
    </BrowserRouter>
  );
}

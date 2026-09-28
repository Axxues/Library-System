import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './theme.css';
import Login from './pages/Login.jsx';
import Desk from './pages/Desk.jsx';
import Catalog from './pages/Catalog.jsx';
import Patrons from './pages/Patrons.jsx';
import Loans from './pages/Loans.jsx';
import Lookup from './pages/Lookup.jsx';
const gated = (el) => (localStorage.getItem('token') ? el : <Navigate to="/login" />);
const links = [
  { to: '/desk', label: 'Desk', ico: '◉' },
  { to: '/catalog', label: 'Books', ico: '▤' },
  { to: '/patrons', label: 'Members', ico: 'ⓟ' },
  { to: '/loans', label: 'Activity', ico: '≣' },
  { to: '/lookup', label: 'Lookup', ico: '⌕' },
];
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('staff');
  location.href = '/login';
}
function staff() {
  try { return JSON.parse(localStorage.getItem('staff') || '{}'); } catch { return {}; }
}
function UserChip() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
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
      <span className="avatar">{name[0].toUpperCase()}</span>{name}
    </button>
    {open && (<div className="usermenu" role="menu">
      <div className="usermeta"><span className="avatar">{name[0].toUpperCase()}</span><span><strong>{name}</strong><br /><span className="subtle">{me.role || 'staff'}</span></span></div>
      <button className="secondary danger" onClick={logout}>Log out</button>
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
  if (loc.pathname === '/login') return <Login key="login" theme={theme} setTheme={setTheme} />;
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">STO.TOMAS<span> LIBRARY</span></div>
        {links.map((l) => <NavLink key={l.to} to={l.to} className={({ isActive }) => 'sidelink' + (isActive ? ' active' : '')}><span className="ico">{l.ico}</span>{l.label}</NavLink>)}
        <button className="sidelink logout" onClick={logout}><span className="ico">⏻</span>Log out</button>
      </aside>
      <div className="main">
        <header className="topbar">
          <Search />
          <button className="iconbtn" title="Toggle light / dark" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? '◐' : '◑'}</button>
          <UserChip />
        </header>
        <div className="container" key={loc.pathname}>
          <Routes location={loc}>
            <Route path="/desk" element={gated(<Desk />)} />
            <Route path="/catalog" element={gated(<Catalog />)} />
            <Route path="/patrons" element={gated(<Patrons />)} />
            <Route path="/loans" element={gated(<Loans />)} />
            <Route path="/lookup" element={<Lookup />} />
            <Route path="*" element={<Navigate to="/desk" />} />
          </Routes>
          <div className="footer">Sto. Tomas Municipal Library · Dual-QR Circulation System</div>
        </div>
      </div>
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

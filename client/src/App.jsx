import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom';
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
function Search() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  return <input className="search" placeholder="Search anything" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') nav('/catalog'); }} />;
}
export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  useEffect(() => { document.documentElement.dataset.theme = theme; localStorage.setItem('theme', theme); }, [theme]);
  return (
    <BrowserRouter>
      <div className="shell">
        <aside className="sidebar">
          <div className="brand">STO.TOMAS<span> LIBRARY</span></div>
          {links.map((l) => <NavLink key={l.to} to={l.to} className={({ isActive }) => 'sidelink' + (isActive ? ' active' : '')}><span className="ico">{l.ico}</span>{l.label}</NavLink>)}
          <div className="sidepromo"><strong>Dual-QR circulation</strong>Scan patron + book in one step — receipt prints with picks.</div>
        </aside>
        <div className="main">
          <header className="topbar">
            <Search />
            <button className="iconbtn" title="Toggle light / dark" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? '◐' : '◑'}</button>
            <span className="adminchip"><span className="avatar">S</span>Staff</span>
          </header>
          <div className="container">
            <Routes>
              <Route path="/login" element={<Login />} />
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
    </BrowserRouter>
  );
}

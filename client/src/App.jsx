import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login.jsx';
import Desk from './pages/Desk.jsx';
import Scan from './pages/Scan.jsx';
import Catalog from './pages/Catalog.jsx';
import Patrons from './pages/Patrons.jsx';
import Loans from './pages/Loans.jsx';
import Lookup from './pages/Lookup.jsx';
import Profile from './pages/Profile.jsx';
import Settings from './pages/Settings.jsx';
import { Layout } from './layouts/Layout.jsx';
const gated = (el) => (localStorage.getItem('token') ? el : <Navigate to="/login" />);
function logout(nav) {
  localStorage.removeItem('token');
  localStorage.removeItem('staff');
  if (nav) nav('/login'); else location.href = '/login';
}
function Footer() {
  return <div className="pt-6 text-center text-xs font-semibold text-muted-foreground">Sto. Tomas Municipal Library · Dual-QR Circulation System</div>;
}
const page = (el) => gated(<>{el}<Footer /></>);
export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); localStorage.setItem('theme', theme); }, [theme]);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login theme={theme} setTheme={setTheme} />} />
        <Route element={<Layout theme={theme} setTheme={setTheme} onLogout={() => logout()} />}>
          <Route path="/desk" element={page(<Desk />)} />
          <Route path="/scan" element={page(<Scan />)} />
          <Route path="/catalog" element={page(<Catalog />)} />
          <Route path="/patrons" element={page(<Patrons />)} />
          <Route path="/loans" element={page(<Loans />)} />
          <Route path="/lookup" element={<><Lookup /><Footer /></>} />
          <Route path="/profile" element={page(<Profile />)} />
          <Route path="/settings" element={page(<Settings />)} />
          <Route path="*" element={<Navigate to="/desk" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

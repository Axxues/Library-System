import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import './theme.css';
import Login from './pages/Login.jsx';
import Desk from './pages/Desk.jsx';
import Catalog from './pages/Catalog.jsx';
import Patrons from './pages/Patrons.jsx';
import Loans from './pages/Loans.jsx';
import Lookup from './pages/Lookup.jsx';
const gated = (el) => (localStorage.getItem('token') ? el : <Navigate to="/login" />);
export default function App() {
  return (
    <BrowserRouter>
      <nav style={{ display: 'flex', gap: 16, padding: 16, borderBottom: '1px solid #23252a' }}>
        <Link to="/desk">Desk</Link><Link to="/catalog">Catalog</Link><Link to="/patrons">Patrons</Link><Link to="/loans">Loans</Link><Link to="/lookup">Lookup</Link>
      </nav>
      <div style={{ padding: 24, maxWidth: 1280, margin: '0 auto' }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/desk" element={gated(<Desk />)} />
          <Route path="/catalog" element={gated(<Catalog />)} />
          <Route path="/patrons" element={gated(<Patrons />)} />
          <Route path="/loans" element={gated(<Loans />)} />
          <Route path="/lookup" element={<Lookup />} />
          <Route path="*" element={<Navigate to="/desk" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

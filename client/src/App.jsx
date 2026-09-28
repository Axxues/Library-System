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
      <nav className="topnav">
        <span className="brand">Sto.Tomas<span> Library</span></span>
        <Link className="navlink" to="/desk">Desk</Link><Link className="navlink" to="/catalog">Catalog</Link><Link className="navlink" to="/patrons">Patrons</Link><Link className="navlink" to="/loans">Loans</Link><Link className="navlink" to="/lookup">Lookup</Link>
      </nav>
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
      </div>
    </BrowserRouter>
  );
}

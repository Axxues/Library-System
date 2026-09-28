import { useEffect, useState } from 'react';
import { ArrowLeftRight, LibraryBig, TriangleAlert } from 'lucide-react';
import { api } from '../api.js';
const fmt = (d) => (d ? new Date(d).toLocaleDateString() : '—');
export default function Desk() {
  const [stats, setStats] = useState({ books: '—', active: '—', overdue: '—' });
  const [recent, setRecent] = useState([]);
  useEffect(() => {
    Promise.all([
      api('/api/catalog'),
      api('/api/loans?status=active'),
      api('/api/loans?status=overdue'),
      api('/api/loans'),
    ]).then(([cat, active, overdue, all]) => {
      setStats({ books: new Set(cat.map((b) => b.id)).size, active: active.length, overdue: overdue.length });
      if (Array.isArray(all)) setRecent(all.slice(0, 5));
    }).catch(() => {});
  }, []);
  const tiles = [
    { Icon: LibraryBig, bg: '#5e6ad2', num: stats.books, lbl: 'Titles in catalog' },
    { Icon: ArrowLeftRight, bg: '#f97316', num: stats.active, lbl: 'Currently borrowed' },
    { Icon: TriangleAlert, bg: '#dc2626', num: stats.overdue, lbl: 'Overdue books' },
  ];
  return (<div>
    <div className="crumbs">Dashboard</div>
    <div className="page-head"><div className="row"><div className="grow"><h2>Front desk</h2><p>Today at a glance. Scanning lives on its own page.</p></div><button onClick={() => { location.href = '/scan'; }}>Go to scan</button></div></div>
    <div className="grid three" style={{ marginBottom: 16 }}>
      {tiles.map((s) => <div key={s.lbl} className="card stat"><span className="tile" style={{ background: s.bg, color: '#fff' }}><s.Icon size={22} /></span><span><span className="num">{s.num}</span><br /><span className="lbl">{s.lbl}</span></span></div>)}
    </div>
    <div className="card"><h3>Latest activity</h3><p className="desc">Five most recent loans.</p>
      <table><thead><tr><th>Patron</th><th>Copy</th><th>Checked out</th><th>Status</th></tr></thead><tbody>
        {recent.map((l) => <tr key={l.id}><td className="mono">{l.patronCode}</td><td className="mono">{l.copyCode}</td><td>{fmt(l.checkoutAt)}</td>
          <td>{l.returnAt ? <span className="pill ok">Returned</span> : <span className="pill busy">On loan</span>}</td></tr>)}
      </tbody></table>
      {recent.length === 0 && <p className="desc" style={{ marginTop: 12 }}>No loans yet.</p>}
    </div>
  </div>);
}

// client/src/pages/Catalog.jsx
import { useEffect, useState } from 'react';
import { Cover } from '../cover.jsx';
import { api } from '../api.js';
export default function Catalog() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  useEffect(() => { api('/api/catalog').then((d) => { if (Array.isArray(d)) setRows(d); }).catch(() => {}); }, []);
  const list = rows.filter((r) => (r.title + r.author + r.copyCode).toLowerCase().includes(q.toLowerCase()));
  return (<div>
    <div className="crumbs">Dashboard / Books</div>
    <div className="page-head"><div className="row"><div className="grow"><h2>All books</h2><p>Live availability — updates on every checkout and return.</p></div><div style={{ maxWidth: 260 }} className="grow"><input placeholder="Search by name or code" value={q} onChange={(e) => setQ(e.target.value)} /></div></div></div>
    <div className="card"><table><thead><tr><th>Book</th><th>Copy</th><th>Status</th><th>QR</th></tr></thead><tbody>
      {list.map((r, i) => <tr key={i}><td><span className="cellmain"><Cover title={r.title} /><span><span className="t">{r.title}</span><br /><span className="s">{r.author}</span></span></span></td><td className="mono">{r.copyCode}</td><td><span className={`pill ${r.status === 'Available' ? 'ok' : 'busy'}`}>{r.status}</span></td><td><a href={`http://localhost:4000/api/qr/${r.copyCode}`} target="_blank" rel="noreferrer">QR</a></td></tr>)}
    </tbody></table>
    {list.length === 0 && <p className="desc" style={{ marginTop: 12 }}>No books match.</p>}</div>
  </div>);
}

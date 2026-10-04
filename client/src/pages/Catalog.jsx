// client/src/pages/Catalog.jsx
import { useEffect, useState } from 'react';
import { Cover } from '../cover.jsx';
import { api } from '../api.js';
export default function Catalog() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [f, setF] = useState('');
  useEffect(() => { api('/api/catalog').then((d) => { if (Array.isArray(d)) setRows(d); }).catch(() => {}); }, []);
  // ponytail: backend statuses are 'Available'|'Borrowed' (schema CHECK); 'On loan' is a UI-only label, so match it as non-Available. Exact-equality predicate would show an empty shelf.
  const list = rows.filter((r) => (r.title + r.author + r.copyCode).toLowerCase().includes(q.toLowerCase()) && (!f || (f === 'Available' ? r.status === 'Available' : r.status !== 'Available')));
  return (<div>
    <div className="crumbs">Dashboard / Books</div>
    <div className="page-head"><div className="row"><div className="grow"><h2>All books</h2><p>Live availability — updates on every checkout and return.</p></div></div></div>
    <div className="toolbar"><div className="grow"><input placeholder="Search by name or code" value={q} onChange={(e) => setQ(e.target.value)} /></div><span className="pill">{list.length} shown</span></div>
    <div className="toolbar"><button className={'secondary' + (f === '' ? ' active' : '')} onClick={() => setF('')}>All</button><button className={'secondary' + (f === 'Available' ? ' active' : '')} onClick={() => setF('Available')}>Available</button><button className={'secondary' + (f === 'On loan' ? ' active' : '')} onClick={() => setF('On loan')}>On loan</button></div>
    <div className="shelf">{list.map((r, i) => <div key={i} className="shelfcard"><span className={'spine ' + (r.status === 'Available' ? 'ok' : 'busy')}><Cover title={r.title} size="lg" /></span><span className="t">{r.title}</span><span className="s">{r.author}</span><span className="mono subtle">{r.copyCode}</span><span><span className={'stamp ' + (r.status === 'Available' ? 'ok' : 'busy')}>{r.status}</span></span><a href={`http://localhost:4000/api/qr/${r.copyCode}`} target="_blank" rel="noreferrer">QR</a></div>)}</div>
    {list.length === 0 && <div className="empty">Empty shelf — try a different search.</div>}
  </div>);
}

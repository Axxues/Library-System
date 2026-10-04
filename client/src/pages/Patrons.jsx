// client/src/pages/Patrons.jsx
import { useEffect, useState } from 'react';
import { Cover } from '../cover.jsx';
import { api } from '../api.js';
export default function Patrons() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  useEffect(() => { api('/api/patrons').then((d) => { if (Array.isArray(d)) setRows(d); }).catch(() => {}); }, []);
  const list = rows.filter((p) => (p.code + p.name).toLowerCase().includes(q.toLowerCase()));
  return (<div>
    <div className="crumbs">Dashboard / Members</div>
    <div className="page-head"><div className="row"><div className="grow"><h2>Members</h2><p>Registered borrowers — print each QR once for their library card.</p></div></div></div>
    <div className="card"><div className="toolbar"><div className="grow"><input placeholder="Search by name or code" value={q} onChange={(e) => setQ(e.target.value)} /></div><span className="pill">{list.length} shown</span></div>
    <div className="ledger">{list.map((p) => <div key={p.code} className="loanrow"><Cover title={p.name} /><span className="grow"><span className="t">{p.name}</span><br /><span className="subtle mono">{p.code} · {p.contact || '—'}</span></span><a href={`http://localhost:4000/api/qr/${p.code}`} target="_blank" rel="noreferrer">QR</a></div>)}</div>
    {list.length === 0 && <div className="empty">No members match.</div>}</div>
  </div>);
}

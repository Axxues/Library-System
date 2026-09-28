// client/src/pages/Patrons.jsx
import { useEffect, useState } from 'react';
import { Cover } from '../cover.jsx';
export default function Patrons() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  useEffect(() => { fetch('http://localhost:4000/api/patrons', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }).then((r) => r.json()).then(setRows); }, []);
  const list = rows.filter((p) => (p.code + p.name).toLowerCase().includes(q.toLowerCase()));
  return (<div>
    <div className="crumbs">Dashboard / Members</div>
    <div className="page-head"><div className="row"><div className="grow"><h2>Members</h2><p>Registered borrowers — print each QR once for their library card.</p></div><div style={{ maxWidth: 260 }} className="grow"><input placeholder="Search by name or code" value={q} onChange={(e) => setQ(e.target.value)} /></div></div></div>
    <div className="card"><table><thead><tr><th>Member</th><th>Code</th><th>Contact</th><th>QR</th></tr></thead><tbody>
      {list.map((p) => <tr key={p.code}><td><span className="cellmain"><Cover title={p.name} /><span className="t">{p.name}</span></span></td><td className="mono">{p.code}</td><td>{p.contact || '—'}</td><td><a href={`http://localhost:4000/api/qr/${p.code}`} target="_blank" rel="noreferrer">QR</a></td></tr>)}
    </tbody></table>
    {list.length === 0 && <p className="desc" style={{ marginTop: 12 }}>No members match.</p>}</div>
  </div>);
}

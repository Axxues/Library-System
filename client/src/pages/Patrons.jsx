// client/src/pages/Patrons.jsx
import { useEffect, useState } from 'react';
export default function Patrons() {
  const [rows, setRows] = useState([]);
  useEffect(() => { fetch('http://localhost:4000/api/patrons', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }).then((r) => r.json()).then(setRows); }, []);
  return (<div>
    <div className="page-head"><p className="eyebrow">Readers</p><h2>Patrons</h2><p>Registered borrowers — print each QR once and stick it on their library card.</p></div>
    <div className="card"><table><thead><tr><th>Code</th><th>Name</th><th>Contact</th><th>QR</th></tr></thead><tbody>
      {rows.map((p) => <tr key={p.code}><td className="mono strong">{p.code}</td><td className="strong">{p.name}</td><td>{p.contact || '—'}</td><td><a href={`http://localhost:4000/api/qr/${p.code}`} target="_blank" rel="noreferrer">QR</a></td></tr>)}
    </tbody></table></div>
  </div>);
}

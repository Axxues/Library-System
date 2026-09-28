// client/src/pages/Catalog.jsx
import { useEffect, useState } from 'react';
export default function Catalog() {
  const [rows, setRows] = useState([]);
  useEffect(() => { fetch('http://localhost:4000/api/catalog', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }).then((r) => r.json()).then(setRows); }, []);
  return (<div>
    <div className="page-head"><p className="eyebrow">Collection</p><h2>Catalog</h2><p>Live availability — updates on every checkout and return.</p></div>
    <div className="card"><table><thead><tr><th>Title</th><th>Author</th><th>Copy</th><th>Status</th><th>QR</th></tr></thead><tbody>
      {rows.map((r, i) => <tr key={i}><td className="strong">{r.title}</td><td>{r.author}</td><td className="mono">{r.copyCode}</td><td><span className={`pill ${r.status === 'Available' ? 'ok' : 'busy'}`}>{r.status}</span></td><td><a href={`http://localhost:4000/api/qr/${r.copyCode}`} target="_blank" rel="noreferrer">QR</a></td></tr>)}
    </tbody></table></div>
  </div>);
}

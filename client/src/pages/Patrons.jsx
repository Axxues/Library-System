// client/src/pages/Patrons.jsx
import { useEffect, useState } from 'react';
export default function Patrons() {
  const [rows, setRows] = useState([]);
  useEffect(() => { fetch('http://localhost:4000/api/patrons', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }).then((r) => r.json()).then(setRows); }, []);
  return (<div className="card"><h3>Patrons + history entry</h3>{rows.map((p) => <div key={p.code}>{p.code} — {p.name} <a href={`http://localhost:4000/api/qr/${p.code}`} target="_blank" rel="noreferrer">QR</a></div>)}</div>);
}

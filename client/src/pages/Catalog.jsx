// client/src/pages/Catalog.jsx
import { useEffect, useState } from 'react';
export default function Catalog() {
  const [rows, setRows] = useState([]);
  useEffect(() => { fetch('http://localhost:4000/api/catalog', { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }).then((r) => r.json()).then(setRows); }, []);
  return (<div className="card"><h3>Catalog — real-time availability</h3><table><tbody>{rows.map((r, i) => <tr key={i}><td>{r.title}</td><td>{r.author}</td><td>{r.copyCode}</td><td>{r.status}</td><td><a href={`http://localhost:4000/api/qr/${r.copyCode}`} target="_blank" rel="noreferrer">QR</a></td></tr>)}</tbody></table></div>);
}

// client/src/pages/Loans.jsx
import { useEffect, useState } from 'react';
export default function Loans() {
  const [rows, setRows] = useState([]); const [f, setF] = useState('');
  const load = (s) => fetch('http://localhost:4000/api/loans' + (s ? `?status=${s}` : ''), { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }).then((r) => r.json()).then((d) => { setRows(d); setF(s); });
  useEffect(() => { load(''); }, []);
  return (<div className="card"><h3>Loans</h3><button className="secondary" onClick={() => load('')}>All</button> <button className="secondary" onClick={() => load('active')}>Active</button> <button className="secondary" onClick={() => load('overdue')}>Overdue</button><pre>{JSON.stringify(rows.slice(0, 20), null, 2)}</pre></div>);
}

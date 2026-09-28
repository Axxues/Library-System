// client/src/pages/Loans.jsx
import { useEffect, useState } from 'react';
const fmt = (d) => (d ? new Date(d).toLocaleDateString() : '—');
export default function Loans() {
  const [rows, setRows] = useState([]); const [f, setF] = useState('');
  const load = (s) => fetch('http://localhost:4000/api/loans' + (s ? `?status=${s}` : ''), { headers: { Authorization: 'Bearer ' + localStorage.getItem('token') } }).then((r) => r.json()).then((d) => { setRows(d); setF(s); });
  useEffect(() => { load(''); }, []);
  return (<div>
    <div className="crumbs">Dashboard / Activity</div>
    <div className="page-head"><h2>Borrowing activity</h2><p>Every checkout and return, with overdue flagged automatically.</p></div>
    <div className="card">
      <div className="row" style={{ marginBottom: 14 }}>
        <button className={'secondary' + (f === '' ? ' active' : '')} onClick={() => load('')}>All</button>
        <button className={'secondary' + (f === 'active' ? ' active' : '')} onClick={() => load('active')}>Active</button>
        <button className={'secondary' + (f === 'overdue' ? ' active' : '')} onClick={() => load('overdue')}>Overdue</button>
      </div>
      <table><thead><tr><th>Patron</th><th>Copy</th><th>Borrow – Due</th><th>Returned</th><th>Status</th></tr></thead><tbody>
        {rows.map((l) => <tr key={l.id}><td className="mono">{l.patronCode}</td><td className="mono">{l.copyCode}</td><td>{fmt(l.checkoutAt)} – {fmt(l.dueAt)}</td><td>{fmt(l.returnAt)}</td>
          <td>{l.returnAt ? <span className="pill ok">Returned</span> : new Date(l.dueAt) < new Date() ? <span className="pill late">Overdue</span> : <span className="pill busy">Borrowed</span>}</td></tr>)}
      </tbody></table>
      {rows.length === 0 && <p className="desc" style={{ marginTop: 12 }}>No loans in this view yet.</p>}
    </div>
  </div>);
}

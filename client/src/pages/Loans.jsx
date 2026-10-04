// client/src/pages/Loans.jsx
import { useEffect, useState } from 'react';
import { api } from '../api.js';
const fmt = (d) => (d ? new Date(d).toLocaleDateString() : '—');
export default function Loans() {
  const [rows, setRows] = useState([]); const [f, setF] = useState('');
  const [counts, setCounts] = useState({ all: 0, active: 0, overdue: 0 });
  const load = (s) => api('/api/loans' + (s ? `?status=${s}` : '')).then((d) => { if (Array.isArray(d)) setRows(d); setF(s); }).catch(() => {});
  useEffect(() => { load(''); }, []);
  useEffect(() => { Promise.all([api('/api/loans'), api('/api/loans?status=active'), api('/api/loans?status=overdue')]).then(([a, ac, od]) => setCounts({ all: a.length, active: ac.length, overdue: od.length })).catch(() => {}); }, []);
  const groups = {};
  rows.forEach((l) => { const k = fmt(l.checkoutAt); (groups[k] = groups[k] || []).push(l); });
  return (<div>
    <div className="crumbs">Dashboard / Activity</div>
    <div className="page-head"><h2>Borrowing activity</h2><p>Every checkout and return, with overdue flagged automatically.</p></div>
    <div className="card">
      <div className="toolbar">
        <button className={'secondary' + (f === '' ? ' active' : '')} onClick={() => load('')}>All ({counts.all})</button>
        <button className={'secondary' + (f === 'active' ? ' active' : '')} onClick={() => load('active')}>Active ({counts.active})</button>
        <button className={'secondary' + (f === 'overdue' ? ' active' : '')} onClick={() => load('overdue')}>Overdue ({counts.overdue})</button>
        <span className="pill">{rows.length} shown</span>
      </div>
      <div className="ledger">{Object.entries(groups).map(([day, ls]) => <div key={day}><div className="day">{day}</div>{ls.map((l) => <div key={l.id} className="loanrow"><span className="grow"><span className="mono">{l.patronCode}</span> → {l.title || l.copyCode}<br /><span className="subtle">{fmt(l.checkoutAt)} – {fmt(l.dueAt)} · returned {fmt(l.returnAt)}</span></span>{l.returnAt ? <span className="stamp ok">Returned</span> : new Date(l.dueAt) < new Date() ? <span className="stamp late">Overdue</span> : <span className="stamp busy">Borrowed</span>}</div>)}</div>)}</div>
      {rows.length === 0 && <div className="empty">No loans in this view yet.</div>}
    </div>
  </div>);
}

// client/src/pages/Loans.jsx
import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
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
    <p className="mb-1.5 text-xs text-muted-foreground">Dashboard / Activity</p>
    <div className="mb-5"><h2 className="heading-2">Borrowing activity</h2><p className="text-sm text-muted-foreground">Every checkout and return, with overdue flagged automatically.</p></div>
    <div className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover">
      <div className="mb-3 flex items-center gap-2">
        <Button variant="secondary" aria-pressed={f === ''} onClick={() => load('')}>All ({counts.all})</Button>
        <Button variant="secondary" aria-pressed={f === 'active'} onClick={() => load('active')}>Active ({counts.active})</Button>
        <Button variant="secondary" aria-pressed={f === 'overdue'} onClick={() => load('overdue')}>Overdue ({counts.overdue})</Button>
        <Badge variant="default">{rows.length} shown</Badge>
      </div>
      <div className="grid gap-4">{Object.entries(groups).map(([day, ls]) => <div key={day}><div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{day}</div>{ls.map((l) => <div key={l.id} className="flex items-center gap-2 border-t border-border py-2 text-sm"><span className="min-w-0 flex-1"><span className="font-mono text-xs">{l.patronCode}</span> → {l.title || l.copyCode}<br /><span className="text-xs text-muted-foreground">{fmt(l.checkoutAt)} – {fmt(l.dueAt)} · returned {fmt(l.returnAt)}</span></span>{l.returnAt ? <Badge variant="success">Returned</Badge> : new Date(l.dueAt) < new Date() ? <Badge variant="destructive">Overdue</Badge> : <Badge variant="default">Borrowed</Badge>}</div>)}</div>)}</div>
      {rows.length === 0 && <div className="py-7 text-center text-sm text-muted-foreground">No loans in this view yet.</div>}
    </div>
  </div>);
}

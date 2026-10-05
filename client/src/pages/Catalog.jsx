// client/src/pages/Catalog.jsx
import { useEffect, useState } from 'react';
import { Cover } from '../cover.jsx';
import { api } from '../api.js';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
export default function Catalog() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [f, setF] = useState('');
  useEffect(() => { api('/api/catalog').then((d) => { if (Array.isArray(d)) setRows(d); }).catch(() => {}); }, []);
  // ponytail: backend statuses are 'Available'|'Borrowed' (schema CHECK); 'On loan' is a UI-only label, so match it as non-Available. Exact-equality predicate would show an empty shelf.
  const list = rows.filter((r) => (r.title + r.author + r.copyCode).toLowerCase().includes(q.toLowerCase()) && (!f || (f === 'Available' ? r.status === 'Available' : r.status !== 'Available')));
  return (<div>
    <p className="mb-1.5 text-xs text-muted-foreground">Dashboard / Books</p>
    <div className="mb-5"><div className="flex items-center gap-2"><div className="min-w-0 flex-1"><h2 className="heading-2">All books</h2><p className="text-sm text-muted-foreground">Live availability — updates on every checkout and return.</p></div></div></div>
    <div className="mb-3 flex items-center gap-2"><div className="min-w-0 flex-1"><Input className="max-w-xs" placeholder="Search by name or code" value={q} onChange={(e) => setQ(e.target.value)} /></div><Badge variant="default">{list.length} shown</Badge></div>
    <div className="mb-3 flex items-center gap-2"><Button variant="secondary" aria-pressed={f === ''} onClick={() => setF('')}>All</Button><Button variant="secondary" aria-pressed={f === 'Available'} onClick={() => setF('Available')}>Available</Button><Button variant="secondary" aria-pressed={f === 'On loan'} onClick={() => setF('On loan')}>On loan</Button></div>
    <div className="grid gap-4 md:grid-cols-3">{list.map((r, i) => <div key={i} className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover"><span className="flex items-center gap-2.5"><Cover title={r.title} size="lg" /></span><span className="font-semibold">{r.title}</span><br /><span className="text-xs text-muted-foreground">{r.author}</span><br /><span className="font-mono text-xs text-muted-foreground">{r.copyCode}</span><br /><span><Badge variant={r.status === 'Available' ? 'success' : 'default'}>{r.status}</Badge></span> <a className="text-sm text-primary underline-offset-4 hover:underline" href={`http://localhost:4000/api/qr/${r.copyCode}`} target="_blank" rel="noreferrer">QR</a></div>)}</div>
    {list.length === 0 && <div className="py-7 text-center text-sm text-muted-foreground">Empty shelf — try a different search.</div>}
  </div>);
}

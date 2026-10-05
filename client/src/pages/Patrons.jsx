// client/src/pages/Patrons.jsx
import { useEffect, useState } from 'react';
import { Cover } from '../cover.jsx';
import { api } from '../api.js';
import { Badge } from '../components/ui/badge.jsx';
import { Input } from '../components/ui/input.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
export default function Patrons() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  useEffect(() => { api('/api/patrons').then((d) => { if (Array.isArray(d)) setRows(d); }).catch(() => {}); }, []);
  const list = rows.filter((p) => (p.code + p.name).toLowerCase().includes(q.toLowerCase()));
  return (<div>
    <p className="mb-1.5 text-xs text-muted-foreground">Dashboard / Members</p>
    <div className="mb-5"><div className="flex items-center gap-2"><div className="min-w-0 flex-1"><h2 className="heading-2">Members</h2><p className="text-sm text-muted-foreground">Registered borrowers — print each QR once for their library card.</p></div></div></div>
    <div className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover"><div className="mb-3 flex items-center gap-2"><div className="min-w-0 flex-1"><Input className="max-w-xs" placeholder="Search by name or code" value={q} onChange={(e) => setQ(e.target.value)} /></div><Badge variant="default">{list.length} shown</Badge></div>
    <Table><TableHeader><TableRow><TableHead>Member</TableHead><TableHead>Code</TableHead><TableHead>Contact</TableHead><TableHead>Card QR</TableHead></TableRow></TableHeader><TableBody>
      {list.map((p) => <TableRow key={p.code}><TableCell><span className="flex items-center gap-2.5"><Cover title={p.name} /><span className="font-semibold">{p.name}</span></span></TableCell><TableCell className="font-mono text-xs">{p.code}</TableCell><TableCell>{p.contact || '—'}</TableCell><TableCell><a className="text-sm text-primary underline-offset-4 hover:underline" href={`http://localhost:4000/api/qr/${p.code}`} target="_blank" rel="noreferrer">QR</a></TableCell></TableRow>)}
    </TableBody></Table>
    {list.length === 0 && <div className="py-7 text-center text-sm text-muted-foreground">No members match.</div>}</div>
  </div>);
}

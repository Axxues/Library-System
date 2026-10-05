// client/src/pages/Lookup.jsx — public, no login: type ID or camera
import { useState } from 'react';
import { Cover } from '../cover.jsx';
import { api } from '../api.js';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
export default function Lookup() {
  const [code, setCode] = useState('P-0001'); const [out, setOut] = useState(null);
  const go = async () => {
    try {
      setOut(await api(`/api/patrons/${code}/recommendations`));
    } catch (e) {
      setOut({ error: e.message === 'unreachable' ? 'Cannot reach the server at localhost:4000.' : e.message });
    }
  };
  return (<div>
    <p className="mb-1.5 text-xs text-muted-foreground">Lookup</p>
    <div className="mb-5"><h2 className="heading-2">Find my books</h2><p className="text-sm text-muted-foreground">Type your patron ID or scan your QR — see your loans and personal picks.</p></div>
    <div className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover mb-4">
      <div className="flex items-center gap-2"><div className="min-w-0 flex-1"><Input className="font-mono" value={code} onChange={(e) => setCode(e.target.value)} placeholder="P-0001 or scan" /></div><Button onClick={go}>View</Button></div>
      {out && out.error && <div className="mt-3 rounded-lg border border-destructive bg-destructive/10 p-2 px-3 text-sm text-destructive">{out.error}</div>}
    </div>
    {out && !out.error && (<div className="grid gap-4 md:grid-cols-2">
      <div className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover"><div className="flex items-center gap-2.5"><Cover title={out.patron.name} size="lg" /><span className="min-w-0 flex-1"><h3 className="font-semibold" style={{margin:0}}>{out.patron.name}</h3><span className="font-mono text-xs text-muted-foreground">{out.patron.code}</span></span></div>
        {out.activeLoans.length === 0 && <p className="mt-2 text-sm text-muted-foreground">No books on loan right now.</p>}
        {out.activeLoans.length > 0 && (<Table><TableHeader><TableRow><TableHead>Book</TableHead><TableHead>Due</TableHead></TableRow></TableHeader><TableBody>
          {out.activeLoans.map((l) => <TableRow key={l.id}><TableCell><span className="flex items-center gap-2.5"><Cover title={l.title} /><span className="font-semibold">{l.title}</span></span></TableCell><TableCell><Badge variant="warning">Due {l.dueAt ? new Date(l.dueAt).toLocaleDateString() : '—'}</Badge></TableCell></TableRow>)}
        </TableBody></Table>)}
      </div>
      <div className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover"><h3 className="font-semibold">Picked for you</h3><p className="text-sm text-muted-foreground">Based on what you and similar readers borrow.</p>
        <div className="mt-3 flex gap-3">{out.recommendations.map((r) => <div key={r.id} className="w-28 shrink-0 rounded-lg border border-border bg-secondary p-2 text-center"><Cover title={r.title} size="lg" /><span className="mt-1 block text-xs font-semibold leading-tight">{r.title}</span></div>)}</div>
      </div>
    </div>)}
  </div>);
}

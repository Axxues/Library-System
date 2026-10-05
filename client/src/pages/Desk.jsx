import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Cover } from '../cover.jsx';
import { Card, CardDescription } from '../components/ui/card.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';
const fmt = (d) => (d ? new Date(d).toLocaleDateString() : '—');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function last8() {
  const out = [];
  const now = new Date();
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTHS[d.getMonth()] });
  }
  return out;
}
export default function Desk() {
  const nav = useNavigate();
  const [stats, setStats] = useState({ books: '—', active: '—', overdue: '—' });
  const [recent, setRecent] = useState([]);
  const [trend, setTrend] = useState([]);
  const [insights, setInsights] = useState({ genre: '—', title: '—', reader: '—' });
  const [overdue, setOverdue] = useState([]);
  const [popular, setPopular] = useState([]);
  useEffect(() => {
    Promise.all([
      api('/api/catalog'),
      api('/api/loans?status=active'),
      api('/api/loans?status=overdue'),
      api('/api/loans'),
    ]).then(([cat, active, od, all]) => {
      setStats({ books: new Set(cat.map((b) => b.id)).size, active: active.length, overdue: od.length, copies: cat.length, avail: cat.filter((bb) => bb.status === 'Available').length, odPatrons: new Set((Array.isArray(od) ? od : []).map((l) => l.patronCode)).size });
      const loans = Array.isArray(all) ? all : [];
      setRecent(loans.slice(0, 5));
      const buckets = Object.fromEntries(last8().map((m) => [m.key, 0]));
      const genreCount = {};
      const titleCount = {};
      const readerCount = {};
      loans.forEach((l) => {
        const d = new Date(l.checkoutAt);
        const k = `${d.getFullYear()}-${d.getMonth()}`;
        if (k in buckets) buckets[k]++;
        if (l.genre) genreCount[l.genre] = (genreCount[l.genre] || 0) + 1;
        if (l.title) titleCount[l.title] = (titleCount[l.title] || 0) + 1;
        if (l.patronCode) readerCount[l.patronCode] = (readerCount[l.patronCode] || 0) + 1;
      });
      const top = (m) => Object.entries(m).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
      setTrend(last8().map((m) => ({ ...m, n: buckets[m.key] })));
      setInsights({ genre: top(genreCount), title: top(titleCount), reader: top(readerCount) });
      setOverdue(Array.isArray(od) ? od.slice(0, 4) : []);
      setPopular(Object.entries(titleCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([title, n]) => ({ title, n })));
    }).catch(() => {});
  }, []);
  const max = Math.max(1, ...trend.map((t) => t.n));
  const tiles = [
    { num: stats.books, lbl: 'Titles in catalog', tip: `${stats.avail ?? '—'} of ${stats.copies ?? '—'} copies on shelf` },
    { num: stats.active, lbl: 'Currently borrowed', tip: insights.title !== '—' ? `Most borrowed: ${insights.title}` : 'No checkouts yet' },
    { num: stats.overdue, lbl: 'Overdue books', tip: `${stats.odPatrons ?? '—'} patron(s) holding overdue` },
  ];
  const notes = [
    { t: 'Top genre', v: insights.genre },
    { t: 'Most borrowed', v: insights.title },
    { t: 'Top reader', v: insights.reader },
  ];
  return (<div>
    <p className="mb-1.5 text-xs text-muted-foreground">Dashboard</p>
    <div className="mb-5 flex flex-wrap items-end gap-4"><div className="min-w-0 flex-1"><h2 className="heading-2">Front desk</h2><p className="text-sm text-muted-foreground">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} — the library at a glance.</p></div><Button onClick={() => nav('/scan')}>Go to scan</Button></div>
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_300px]">
      <div className="grid content-start gap-4">
        <div className="grid gap-4 md:grid-cols-3">
          {tiles.map((s) => <div key={s.lbl} className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover" data-tip={s.tip} tabIndex={0}><span className="text-2xl font-extrabold tracking-tight">{s.num}</span><span className="text-xs text-muted-foreground"> {s.lbl}</span></div>)}
        </div>
        <div className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover"><div className="flex items-center gap-2"><div className="min-w-0 flex-1"><h3 className="font-semibold">Borrowing trend</h3><p className="text-sm text-muted-foreground">Checkouts per month, last 8 months.</p></div></div>
          <div className="flex items-end gap-2 pt-3">{trend.map((t) => <div key={t.key} className="flex flex-1 flex-col items-center gap-1 text-xs text-muted-foreground" data-tip={`${t.label} — ${t.n} checkout${t.n === 1 ? '' : 's'}`} tabIndex={0}><div className="w-6 rounded-t bg-primary" style={{ height: `${Math.max(6, (t.n / max) * 120)}px` }} /><span>{t.label}</span></div>)}</div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {notes.map((n) => <div key={n.t} className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{n.t}</p><h3 className="font-semibold" style={{ margin: 0 }}>{n.v}</h3></div>)}
        </div>
        <div className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover"><h3 className="font-semibold">Latest activity</h3><p className="text-sm text-muted-foreground">Five most recent loans.</p>
          <Table><TableHeader><TableRow><TableHead>Patron</TableHead><TableHead>Book</TableHead><TableHead>Checked out</TableHead><TableHead>Status</TableHead></TableRow></TableHeader><TableBody>
            {recent.map((l) => <TableRow key={l.id}><TableCell className="font-mono text-xs">{l.patronCode}</TableCell><TableCell><span className="flex items-center gap-2.5"><Cover title={l.title} /><span className="font-semibold">{l.title || l.copyCode}</span></span></TableCell><TableCell>{fmt(l.checkoutAt)}</TableCell>
              <TableCell>{l.returnAt ? <Badge variant="success">Returned</Badge> : <Badge variant="default">On loan</Badge>}</TableCell></TableRow>)}
          </TableBody></Table>
          {recent.length === 0 && <div className="py-7 text-center text-sm text-muted-foreground">No loans yet.</div>}
        </div>
      </div>
      <div className="grid content-start gap-4">
        <div className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover"><h3 className="font-semibold">Overdue</h3><p className="text-sm text-muted-foreground">Needs a follow-up call.</p>
          {overdue.length === 0 && <p className="text-sm text-muted-foreground">Nothing overdue. Quiet shelves.</p>}
          {overdue.map((l) => <div key={l.id} className="flex items-center gap-2 border-t border-border py-2 text-sm"><Cover title={l.title} /><span className="min-w-0 flex-1">{l.title}<br /><span className="font-mono text-xs text-muted-foreground">{l.patronCode} · due {fmt(l.dueAt)}</span></span><Badge variant="destructive">Late</Badge></div>)}
        </div>
        <div className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover"><h3 className="font-semibold">Popular now</h3><p className="text-sm text-muted-foreground">Most borrowed titles of all time.</p>
          {popular.length === 0 && <p className="text-sm text-muted-foreground">No circulation yet.</p>}
          {popular.map((p, i) => <div key={p.title} className="flex items-center gap-2 border-t border-border py-2 text-sm"><span className="text-lg font-bold">{i + 1}</span><Cover title={p.title} size="lg" /><span className="min-w-0 flex-1">{p.title}</span><Badge variant="default">{p.n}×</Badge></div>)}
        </div>
      </div>
    </div>
  </div>);
}

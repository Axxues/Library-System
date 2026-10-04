import { useEffect, useState } from 'react';
import { ArrowLeftRight, LibraryBig, TriangleAlert } from 'lucide-react';
import { api } from '../api.js';
import { Cover } from '../cover.jsx';
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
    { Icon: LibraryBig, bg: '#5e6ad2', num: stats.books, lbl: 'Titles in catalog', tip: `${stats.avail ?? '—'} of ${stats.copies ?? '—'} copies on shelf` },
    { Icon: ArrowLeftRight, bg: '#f97316', num: stats.active, lbl: 'Currently borrowed', tip: insights.title !== '—' ? `Most borrowed: ${insights.title}` : 'No checkouts yet' },
    { Icon: TriangleAlert, bg: '#dc2626', num: stats.overdue, lbl: 'Overdue books', tip: `${stats.odPatrons ?? '—'} patron(s) holding overdue` },
  ];
  const notes = [
    { t: 'Top genre', v: insights.genre },
    { t: 'Most borrowed', v: insights.title },
    { t: 'Top reader', v: insights.reader },
  ];
  return (<div>
    <div className="crumbs">Dashboard</div>
    <div className="page-head"><div className="row"><div className="grow"><h2>Front desk</h2><p>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })} — the library at a glance.</p></div><button onClick={() => { location.href = '/scan'; }}>Go to scan</button></div></div>
    <div className="dash">
      <div className="dash-main">
        <div className="grid three">
          {tiles.map((s) => <div key={s.lbl} className="card stat" data-tip={s.tip} tabIndex={0}><span className="tile" style={{ background: s.bg, color: '#fff' }}><s.Icon size={22} /></span><span><span className="num">{s.num}</span><br /><span className="lbl">{s.lbl}</span></span></div>)}
        </div>
        <div className="card"><div className="row"><div className="grow"><h3>Borrowing trend</h3><p className="desc">Checkouts per month, last 8 months.</p></div></div>
          <div className="bars">{trend.map((t) => <div key={t.key} className="barcol" data-tip={`${t.label} — ${t.n} checkout${t.n === 1 ? '' : 's'}`} tabIndex={0}><div className="bar" style={{ height: `${Math.max(6, (t.n / max) * 120)}px` }} /><span>{t.label}</span></div>)}</div>
        </div>
        <div className="grid three">
          {notes.map((n) => <div key={n.t} className="card"><p className="eyebrow">{n.t}</p><h3 style={{ margin: 0 }}>{n.v}</h3></div>)}
        </div>
        <div className="card"><h3>Latest activity</h3><p className="desc">Five most recent loans.</p>
          <table><thead><tr><th>Patron</th><th>Book</th><th>Checked out</th><th>Status</th></tr></thead><tbody>
            {recent.map((l) => <tr key={l.id}><td className="mono">{l.patronCode}</td><td><span className="cellmain"><Cover title={l.title} /><span className="t">{l.title || l.copyCode}</span></span></td><td>{fmt(l.checkoutAt)}</td>
              <td>{l.returnAt ? <span className="pill ok">Returned</span> : <span className="pill busy">On loan</span>}</td></tr>)}
          </tbody></table>
          {recent.length === 0 && <div className="empty">No loans yet.</div>}
        </div>
      </div>
      <div className="dash-side">
        <div className="card"><h3>Overdue</h3><p className="desc">Needs a follow-up call.</p>
          {overdue.length === 0 && <p className="desc">Nothing overdue. Quiet shelves.</p>}
          {overdue.map((l) => <div key={l.id} className="loanrow"><Cover title={l.title} /><span className="grow">{l.title}<br /><span className="subtle mono">{l.patronCode} · due {fmt(l.dueAt)}</span></span><span className="pill late">Late</span></div>)}
        </div>
        <div className="card"><h3>Popular now</h3><p className="desc">Most borrowed titles of all time.</p>
          {popular.length === 0 && <p className="desc">No circulation yet.</p>}
          {popular.map((p) => <div key={p.title} className="loanrow"><Cover title={p.title} /><span className="grow">{p.title}</span><span className="pill busy">{p.n}×</span></div>)}
        </div>
      </div>
    </div>
  </div>);
}

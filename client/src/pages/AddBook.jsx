import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Button } from '../components/ui/button.jsx';
import { Card } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';
export default function AddBook() {
  const nav = useNavigate();
  const [f, setF] = useState({ title: '', author: '', genre: '', classification: '', copies: '1' });
  const [err, setErr] = useState('');
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const go = async () => {
    setErr('');
    const n = Number(f.copies);
    if (!f.title.trim() || !f.author.trim() || !f.genre.trim()) { setErr('Title, author, and genre are required.'); return; }
    if (!Number.isInteger(n) || n < 1 || n > 50) { setErr('Copies must be 1-50.'); return; }
    try {
      const d = await api('/api/catalog', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: f.title.trim(), author: f.author.trim(), genre: f.genre.trim(), classification: f.classification.trim() || undefined, copies: n }) });
      setDone(d);
    } catch (e) { setErr(e.message === 'unreachable' ? 'Cannot reach the server at localhost:4000.' : e.message); }
  };
  if (done) return (<div>
    <div className="mb-5"><h2 className="heading-2">Added “{done.book.title}”</h2><p className="text-sm text-muted-foreground">{done.copies.length} copies ready — print a QR label for each spine.</p></div>
    <div className="grid gap-4 md:grid-cols-2">{done.copies.map((c) => <Card key={c.copyCode} className="flex-row items-center gap-4"><img src={'http://localhost:4000' + c.qrUrl} alt={'QR for ' + c.copyCode} className="h-24 w-24 rounded-lg border border-border" /><div><p className="font-mono text-sm font-bold">{c.copyCode}</p><p className="text-xs text-muted-foreground">{done.book.title}</p></div></Card>)}</div>
    <div className="mt-3.5 flex gap-2"><Button variant="secondary" onClick={() => window.print()} type="button">Print labels</Button><span className="min-w-0 flex-1" /><Button onClick={() => nav('/catalog')} type="button">Back to Books</Button></div>
  </div>);
  return (<div>
    <div className="mb-5"><h2 className="heading-2">Add books</h2><p className="text-sm text-muted-foreground">New title in, labelled copies out — one QR per copy.</p></div>
    <Card className="max-w-xl">
      <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Title</label><Input value={f.title} onChange={set('title')} placeholder="Noli Me Tangere" /></div>
      <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Author</label><Input value={f.author} onChange={set('author')} placeholder="Jose Rizal" /></div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Genre</label><Input value={f.genre} onChange={set('genre')} placeholder="Fiction" /></div>
        <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Classification (optional)</label><Input value={f.classification} onChange={set('classification')} placeholder="PH-FIC" /></div>
      </div>
      <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Copies (1–50)</label><Input type="number" min="1" max="50" value={f.copies} onChange={set('copies')} /></div>
      <div className="mt-3.5 flex gap-2"><Button onClick={go} type="button">Add books</Button><span className="min-w-0 flex-1" /><Button variant="secondary" onClick={() => nav('/catalog')} type="button">Cancel</Button></div>
      {err && <div className="mt-3 rounded-lg border border-destructive bg-destructive/10 p-2 px-3 text-sm text-destructive" role="alert">{err}</div>}
    </Card>
  </div>);
}

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Printer, QrCode, Wrench } from 'lucide-react';
import { api, API_BASE } from '../api.js';
import { Cover } from '../cover.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Dialog } from '../components/ui/dialog.jsx';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table.jsx';

export default function BookDetail() {
  const { id } = useParams();
  const [rows, setRows] = useState(null);
  const [qrCopy, setQrCopy] = useState(null);
  const [condOpen, setCondOpen] = useState(false);
  const [condBusy, setCondBusy] = useState(false);
  const [condErr, setCondErr] = useState('');
  const [selectedCopy, setSelectedCopy] = useState(null);
  const [condValue, setCondValue] = useState('Good');
  const [condNote, setCondNote] = useState('');

  // ponytail: one page per title family — same name (case-insensitive) shares the page
  const normKey = (t) => (t || '').trim().toLowerCase();
  const pickFamily = (d) => {
    if (!Array.isArray(d)) return [];
    const anchor = d.find((r) => String(r.id) === String(id));
    if (!anchor) return [];
    const key = normKey(anchor.title);
    return d.filter((r) => normKey(r.title) === key);
  };
  const fetchBook = () => {
    api('/api/catalog')
      .then((d) => setRows(pickFamily(d)))
      .catch(() => setRows([]));
  };

  useEffect(() => {
    let live = true;
    api('/api/catalog')
      .then((d) => { if (live) setRows(pickFamily(d)); })
      .catch(() => { if (live) setRows([]); });
    return () => { live = false; };
  }, [id]);

  const openCond = (c) => {
    setSelectedCopy(c);
    setCondValue(c.condition || 'Good');
    setCondNote(c.conditionNote || '');
    setCondErr('');
    setCondOpen(true);
  };

  const handleSaveCondition = async () => {
    if (!selectedCopy?.copyCode) return;
    const note = condNote.trim();
    if (note.length > 500) { setCondErr('Note must be 500 characters or less.'); return; }
    setCondBusy(true);
    setCondErr('');
    try {
      await api(`/api/copies/${selectedCopy.copyCode}/condition`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition: condValue, note: note || null }),
      });
      setCondBusy(false);
      setCondOpen(false);
      fetchBook();
    } catch (e) {
      setCondBusy(false);
      setCondErr(e.message === 'unreachable' ? 'Cannot reach the server at localhost:4000.' : e.message || 'Could not save condition.');
    }
  };

  if (rows === null) return <p className="py-10 text-center text-sm text-muted-foreground">Loading book…</p>;
  if (rows.length === 0) return (<div className="py-10 text-center">
    <p className="font-semibold">Book not found.</p>
    <p className="mt-1 text-sm text-muted-foreground">It may have been removed from the catalog.</p>
    <Link to="/catalog" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">Back to Library Catalog</Link>
  </div>);

  const book = rows[0];
  const copies = rows.filter((r) => r.copyCode);
  const avail = copies.filter((r) => r.status === 'Available').length;

  return (<div className="space-y-6">
    <Link to="/catalog" className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">
      <ArrowLeft className="h-3.5 w-3.5" /> Back to Library Catalog
    </Link>

    <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card p-6 shadow-card sm:flex-row sm:items-center">
      <Cover title={book.title} size="lg" src={book.cover} />
      <div className="min-w-0 flex-1">
        <h2 className="heading-2">{book.title}</h2>
        <p className="text-sm text-muted-foreground">{book.author}{book.classification ? ` · ${book.classification}` : ''}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant="default">{book.genre || 'General'}</Badge>
          <span className="text-xs text-muted-foreground">{copies.length} {copies.length === 1 ? 'copy' : 'copies'} · {avail} available · {copies.length - avail} on loan</span>
        </div>
      </div>
    </div>

    <div className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-card">
      <Table>
        <TableHeader><TableRow><TableHead>Copy Code</TableHead><TableHead>Status</TableHead><TableHead>Condition</TableHead><TableHead className="text-right">QR Label</TableHead></TableRow></TableHeader>
        <TableBody>
          {copies.map((c) => (
            <TableRow key={c.copyCode}>
              <TableCell className="font-mono text-xs font-semibold">{c.copyCode}</TableCell>
              <TableCell><Badge variant={c.status === 'Available' ? 'success' : 'default'} >{c.status || 'Available'}</Badge></TableCell>
              <TableCell>
                <button
                  type="button"
                  onClick={() => openCond(c)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-2 py-0.5 text-xs font-medium transition-colors hover:bg-muted"
                  title={c.conditionNote ? `${c.condition || 'Good'} — ${c.conditionNote}` : `Update condition for ${c.copyCode}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${c.condition === 'Damaged' ? 'bg-rose-500' : c.condition === 'Worn' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                  <span>{c.condition || 'Good'}</span>
                  <Wrench className="ml-0.5 h-3 w-3 text-muted-foreground/60" />
                </button>
                {c.conditionNote && <p className="mt-1 max-w-[220px] truncate text-xs text-muted-foreground" title={c.conditionNote}>{c.conditionNote}</p>}
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" variant="outline" onClick={() => setQrCopy(c)} className="h-8 rounded-lg px-2.5 text-xs">
                  <QrCode className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" /> QR
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {copies.length === 0 && <p className="py-7 text-center text-sm text-muted-foreground">No physical copies registered yet.</p>}
    </div>

    <Dialog open={condOpen} onClose={() => setCondOpen(false)}>
      <div className="space-y-4">
        <div className="flex items-center gap-2.5 border-b border-border/70 pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <Wrench className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Update Physical Condition</h3>
            <p className="font-mono text-xs text-muted-foreground">{selectedCopy?.copyCode} · {book.title}</p>
          </div>
        </div>

        {condErr && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300" role="alert">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{condErr}</span>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Select physical grading for this copy:</p>
          <div className="grid grid-cols-3 gap-2">
            {['Good', 'Worn', 'Damaged'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCondValue(c)}
                className={`flex flex-col items-center justify-center rounded-xl border p-3 text-xs font-semibold transition-all ${
                  condValue === c
                    ? 'border-primary bg-primary/10 text-primary shadow-xs'
                    : 'border-border/70 hover:bg-muted text-muted-foreground'
                }`}
              >
                <span className={`mb-1.5 h-2.5 w-2.5 rounded-full ${c === 'Damaged' ? 'bg-rose-500' : c === 'Worn' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Describe specific issues for this copy:</p>
          <textarea
            value={condNote}
            onChange={(e) => setCondNote(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="e.g. torn page 42, loose spine, pen marks on back cover…"
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-border/50 pt-3">
          <Button type="button" variant="outline" onClick={() => setCondOpen(false)} className="rounded-xl">
            Cancel
          </Button>
          <Button onClick={handleSaveCondition} disabled={condBusy} className="rounded-xl shadow-primary-sm">
            {condBusy ? 'Updating…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </Dialog>

    <Dialog open={!!qrCopy} onClose={() => setQrCopy(null)}>
      {qrCopy && (
        <div className="space-y-4 text-center">
          <div className="border-b border-border/70 pb-3">
            <h3 className="text-base font-bold text-foreground">{book.title}</h3>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">{qrCopy.copyCode}</p>
          </div>
          <div className="mx-auto inline-block rounded-2xl border border-border/80 bg-white p-4 shadow-xs">
            <img src={`${API_BASE}/api/qr/${qrCopy.copyCode}`} alt={`QR code for ${qrCopy.copyCode}`} className="h-48 w-48 object-contain" />
            <p className="mt-2 font-mono text-xs font-bold text-slate-800">{qrCopy.copyCode}</p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="rounded-xl">
              <Printer className="mr-1.5 h-4 w-4" /> Print Label
            </Button>
            <Button size="sm" onClick={() => setQrCopy(null)} className="rounded-xl">Done</Button>
          </div>
        </div>
      )}
    </Dialog>
  </div>);
}

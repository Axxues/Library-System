import { useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Filter,
  Plus,
  Printer,
  QrCode,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Wrench,
  X,
} from 'lucide-react';
import { api } from '../api.js';
import { Cover } from '../cover.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { Dialog } from '../components/ui/dialog.jsx';
import { EmptyState } from '../components/ui/empty-state.jsx';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/table.jsx';

export default function Catalog() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [addOpen, setAddOpen] = useState(false);
  const [addBusy, setAddBusy] = useState(false);
  const [addErr, setAddErr] = useState('');
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    genre: 'General',
    classification: '',
    copies: 1,
  });

  const [condOpen, setCondOpen] = useState(false);
  const [condBusy, setCondBusy] = useState(false);
  const [selectedCopy, setSelectedCopy] = useState(null);
  const [condValue, setCondValue] = useState('Good');

  const [qrOpen, setQrOpen] = useState(false);
  const [qrCopy, setQrCopy] = useState(null);

  const fetchCatalog = () => {
    setLoading(true);
    api('/api/catalog')
      .then((d) => {
        if (Array.isArray(d)) setRows(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const genres = Array.from(new Set(rows.map((r) => r.genre).filter(Boolean))).sort();

  const list = rows.filter((r) => {
    const matchQuery = (r.title + ' ' + r.author + ' ' + (r.copyCode || '')).toLowerCase().includes(q.toLowerCase());
    const matchStatus =
      !statusFilter ||
      (statusFilter === 'Available' ? r.status === 'Available' : r.status !== 'Available');
    const matchGenre = !genreFilter || r.genre === genreFilter;
    return matchQuery && matchStatus && matchGenre;
  });

  const handleAddBook = async (e) => {
    e.preventDefault();
    setAddBusy(true);
    setAddErr('');
    try {
      await api('/api/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBook),
      });
      setAddBusy(false);
      setAddOpen(false);
      setNewBook({ title: '', author: '', genre: 'General', classification: '', copies: 1 });
      fetchCatalog();
    } catch (err) {
      setAddErr(err.message || 'Failed to add book');
      setAddBusy(false);
    }
  };

  const handleSaveCondition = async () => {
    if (!selectedCopy?.copyCode) return;
    setCondBusy(true);
    try {
      await api(`/api/copies/${selectedCopy.copyCode}/condition`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ condition: condValue }),
      });
      setCondBusy(false);
      setCondOpen(false);
      fetchCatalog();
    } catch {
      setCondBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-border/70 bg-gradient-to-r from-card via-card to-primary/5 p-6 shadow-card sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Inventory & Copies
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Book Catalog
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage titles, copy barcodes, physical conditions, and shelf availability
          </p>
        </div>

        <Button
          onClick={() => setAddOpen(true)}
          className="rounded-xl shadow-primary-sm"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Book
        </Button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-card md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search by title, author, or copy code…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9 text-sm"
          />
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Pills */}
          <div className="flex items-center rounded-xl border border-border/70 bg-muted/40 p-1">
            <button
              onClick={() => setStatusFilter('')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === '' ? 'bg-card text-foreground shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({rows.length})
            </button>
            <button
              onClick={() => setStatusFilter('Available')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === 'Available' ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setStatusFilter('On loan')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === 'On loan' ? 'bg-card text-primary shadow-xs font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              On Loan
            </button>
          </div>

          {/* Genre filter selector */}
          {genres.length > 0 && (
            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              className="rounded-xl border border-border/70 bg-card px-3 py-1.5 text-xs font-medium text-foreground outline-none shadow-xs"
            >
              <option value="">All Genres</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          )}

          <Badge variant="neutral">
            {list.length} showing
          </Badge>
        </div>
      </div>

      {/* Main Table */}
      <div className="rounded-3xl border border-border/70 bg-card shadow-card overflow-hidden">
        {list.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book Title & Author</TableHead>
                <TableHead>Copy Code</TableHead>
                <TableHead>Genre</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((r, i) => (
                <TableRow key={r.copyCode || i} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Cover title={r.title} size="md" />
                      <div className="min-w-0 max-w-[320px]">
                        <p className="truncate font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                          {r.title}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {r.author}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-2 py-1 font-mono text-xs font-medium text-foreground">
                      {r.copyCode || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="rounded-full border border-border/60 bg-muted/30 px-2.5 py-0.5 text-xs text-muted-foreground">
                      {r.genre || 'General'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => {
                        setSelectedCopy(r);
                        setCondValue(r.condition || 'Good');
                        setCondOpen(true);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 px-2 py-0.5 text-xs font-medium transition-colors hover:bg-muted"
                      title="Click to update condition"
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          r.condition === 'Damaged'
                            ? 'bg-rose-500'
                            : r.condition === 'Worn'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      />
                      <span>{r.condition || 'Good'}</span>
                      <Wrench className="h-3 w-3 text-muted-foreground/60 ml-0.5" />
                    </button>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={r.status === 'Available' ? 'success' : 'default'}
                      statusDot={true}
                    >
                      {r.status || 'Available'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setQrCopy(r);
                          setQrOpen(true);
                        }}
                        className="h-8 rounded-lg px-2.5 text-xs shadow-xs"
                      >
                        <QrCode className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                        QR
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={BookOpen}
              title="No books found"
              description="No titles match your current search query or filter selection."
              actionText="Reset Search"
              onAction={() => {
                setQ('');
                setStatusFilter('');
                setGenreFilter('');
              }}
            />
          </div>
        )}
      </div>

      {/* Add Book Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)}>
        <form onSubmit={handleAddBook} className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-border/70 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Plus className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Add New Book</h3>
              <p className="text-xs text-muted-foreground">Register title into library catalog</p>
            </div>
          </div>

          {addErr && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-50 p-3 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{addErr}</span>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Book Title *</label>
              <Input
                required
                value={newBook.title}
                onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                placeholder="e.g. Introduction to Algorithms"
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Author(s) *</label>
              <Input
                required
                value={newBook.author}
                onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                placeholder="e.g. Thomas H. Cormen"
                className="mt-1 text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Genre / Category *</label>
                <Input
                  required
                  value={newBook.genre}
                  onChange={(e) => setNewBook({ ...newBook, genre: e.target.value })}
                  placeholder="e.g. Computer Science"
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Physical Copies *</label>
                <Input
                  type="number"
                  min="1"
                  max="50"
                  required
                  value={newBook.copies}
                  onChange={(e) => setNewBook({ ...newBook, copies: Number(e.target.value) })}
                  className="mt-1 text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Shelf / Classification</label>
              <Input
                value={newBook.classification}
                onChange={(e) => setNewBook({ ...newBook, classification: e.target.value })}
                placeholder="e.g. QA76.6 .C66 2009"
                className="mt-1 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAddOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={addBusy}
              className="rounded-xl shadow-primary-sm"
            >
              {addBusy ? 'Adding…' : 'Save Book'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Copy Condition Dialog */}
      <Dialog open={condOpen} onClose={() => setCondOpen(false)}>
        <div className="space-y-4">
          <div className="flex items-center gap-2.5 border-b border-border/70 pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Wrench className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Update Physical Condition</h3>
              <p className="text-xs text-muted-foreground font-mono">{selectedCopy?.copyCode} · {selectedCopy?.title}</p>
            </div>
          </div>

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
                  <span
                    className={`h-2.5 w-2.5 rounded-full mb-1.5 ${
                      c === 'Damaged' ? 'bg-rose-500' : c === 'Worn' ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                  />
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border/50">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCondOpen(false)}
              className="rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveCondition}
              disabled={condBusy}
              className="rounded-xl shadow-primary-sm"
            >
              {condBusy ? 'Updating…' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* QR Code Preview Dialog */}
      <Dialog open={qrOpen} onClose={() => setQrOpen(false)}>
        {qrCopy && (
          <div className="space-y-4 text-center">
            <div className="border-b border-border/70 pb-3">
              <h3 className="text-base font-bold text-foreground">{qrCopy.title}</h3>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">{qrCopy.copyCode}</p>
            </div>

            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-border/80 shadow-xs inline-block mx-auto">
              <img
                src={`http://localhost:4000/api/qr/${qrCopy.copyCode}`}
                alt={`QR code for ${qrCopy.copyCode}`}
                className="h-48 w-48 object-contain"
              />
              <p className="mt-2 font-mono text-xs font-bold text-slate-800">
                {qrCopy.copyCode}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="rounded-xl"
              >
                <Printer className="mr-1.5 h-4 w-4" />
                Print Label
              </Button>
              <Button
                size="sm"
                onClick={() => setQrOpen(false)}
                className="rounded-xl"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

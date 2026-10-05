import { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Filter,
  Layers,
  Library,
  MapPin,
  QrCode,
  Search,
  Sparkles,
  User,
  X,
  ChevronRight,
  Info,
  LayoutGrid,
  List,
} from 'lucide-react';
import { Cover } from '../cover.jsx';
import { api } from '../api.js';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
import { EmptyState } from '../components/ui/empty-state.jsx';
import { Skeleton, SkeletonCover } from '../components/ui/skeleton.jsx';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/table.jsx';

const fmt = (d) =>
  d
    ? new Date(d).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

function getDueStatus(dueAt) {
  if (!dueAt) return { label: 'No due date', variant: 'neutral' };
  const now = new Date();
  const due = new Date(dueAt);
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `${Math.abs(diffDays)}d overdue`,
      variant: 'danger',
    };
  }
  if (diffDays === 0) {
    return { label: 'Due today', variant: 'warning' };
  }
  if (diffDays <= 3) {
    return { label: `Due in ${diffDays}d`, variant: 'warning' };
  }
  return { label: `Due in ${diffDays}d`, variant: 'neutral' };
}

function LookupCatalogGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col justify-between rounded-3xl border border-border/70 bg-card p-4 shadow-card space-y-4"
        >
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <Skeleton className="h-4 w-16 rounded-full" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
            <div className="flex items-start gap-3">
              <SkeletonCover size="md" className="shrink-0" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton className="h-4 w-full rounded" />
                <Skeleton className="h-3 w-3/4 rounded" />
                <Skeleton className="h-4 w-20 rounded" />
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-border/50 flex items-center justify-between">
            <Skeleton className="h-3 w-16 rounded" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

function LookupCatalogTableSkeleton() {
  return (
    <div className="rounded-3xl border border-border/70 bg-card shadow-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Book & Author</TableHead>
            <TableHead>Genre</TableHead>
            <TableHead>Shelf Location</TableHead>
            <TableHead>Availability</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 6 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <SkeletonCover size="sm" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-36 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20 rounded font-mono" /></TableCell>
              <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-8 w-20 rounded-xl ml-auto" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function LookupPatronPassSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      {/* Active Loans Card Skeleton */}
      <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-3 w-24 rounded font-mono" />
            </div>
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-40 rounded" />
          <div className="rounded-2xl border border-border/60 p-4 space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <SkeletonCover size="sm" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-36 rounded" />
                    <Skeleton className="h-3 w-16 rounded font-mono" />
                  </div>
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recommended for You Skeleton */}
      <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card space-y-5">
        <div className="flex items-center gap-2 pb-4 border-b border-border/50">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32 rounded" />
            <Skeleton className="h-3 w-48 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center rounded-2xl border border-border/70 bg-muted/20 p-3.5 space-y-3">
              <SkeletonCover size="md" />
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-2.5 w-16 rounded" />
              <Skeleton className="h-6 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Lookup() {
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'patron'

  // --- Public Catalog Explorer State ---
  const [catalogRows, setCatalogRows] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [catalogQuery, setCatalogQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('');
  const [availFilter, setAvailFilter] = useState('all'); // 'all' | 'available' | 'borrowed'
  const [catalogView, setCatalogView] = useState('grid'); // 'grid' | 'table'
  const [selectedBookForCopies, setSelectedBookForCopies] = useState(null);

  // --- Patron Account State ---
  const [patronCode, setPatronCode] = useState('P-0001');
  const [patronData, setPatronData] = useState(null);
  const [patronBusy, setPatronBusy] = useState(false);

  // Fetch catalog on mount
  useEffect(() => {
    setLoadingCatalog(true);
    api('/api/catalog')
      .then((data) => {
        if (Array.isArray(data)) setCatalogRows(data);
      })
      .catch(() => {})
      .finally(() => setLoadingCatalog(false));
  }, []);

  // Group catalog items by title to present title-level availability
  const groupedTitles = useMemo(() => {
    const map = new Map();
    for (const item of catalogRows) {
      const key = `${item.title}___${item.author || ''}`;
      if (!map.has(key)) {
        map.set(key, {
          title: item.title,
          author: item.author || 'Unknown Author',
          genre: item.genre || 'General',
          classification: item.classification || 'GEN',
          copies: [],
        });
      }
      map.get(key).copies.push(item);
    }
    return Array.from(map.values());
  }, [catalogRows]);

  const genres = useMemo(() => {
    return Array.from(new Set(catalogRows.map((r) => r.genre).filter(Boolean))).sort();
  }, [catalogRows]);

  const filteredTitles = useMemo(() => {
    return groupedTitles.filter((book) => {
      const matchText =
        !catalogQuery.trim() ||
        (book.title + ' ' + book.author + ' ' + book.genre + ' ' + book.classification)
          .toLowerCase()
          .includes(catalogQuery.toLowerCase().trim());

      const matchGenre = !selectedGenre || book.genre === selectedGenre;

      const availableCopies = book.copies.filter(
        (c) => (c.status || '').toLowerCase() === 'available'
      ).length;

      let matchAvail = true;
      if (availFilter === 'available') {
        matchAvail = availableCopies > 0;
      } else if (availFilter === 'borrowed') {
        matchAvail = availableCopies === 0;
      }

      return matchText && matchGenre && matchAvail;
    });
  }, [groupedTitles, catalogQuery, selectedGenre, availFilter]);

  // Lookup Patron Account
  const handlePatronLookup = async (codeToUse) => {
    const code = (codeToUse || patronCode).trim();
    if (!code) return;
    setPatronBusy(true);
    try {
      const data = await api(`/api/patrons/${code}/recommendations`);
      setPatronData(data);
    } catch (e) {
      setPatronData({
        error:
          e.message === 'unreachable'
            ? 'Cannot reach the library server at localhost:4000.'
            : e.message,
      });
    }
    setPatronBusy(false);
  };

  const jumpToCatalogSearch = (title) => {
    setCatalogQuery(title);
    setSelectedGenre('');
    setAvailFilter('all');
    setActiveTab('catalog');
  };

  return (
    <div className="space-y-6">
      {/* Top Kiosk Header / Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-r from-card via-card to-primary/10 p-6 shadow-card">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Sto. Tomas Municipal Library · Self-Service Discovery Kiosk
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Library Public Portal
            </h1>
            <p className="mt-1 text-xs text-muted-foreground max-w-xl">
              Search physical shelf holdings, locate book classifications, or scan your patron card to
              review active loans and personalized reading recommendations.
            </p>
          </div>

          {/* Dual Navigation Switcher */}
          <div className="inline-flex rounded-2xl border border-border/70 bg-muted/40 p-1">
            <button
              onClick={() => setActiveTab('catalog')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'catalog'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Library className="h-4 w-4 text-primary" />
              <span>Catalog Explorer</span>
            </button>
            <button
              onClick={() => setActiveTab('patron')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                activeTab === 'patron'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <User className="h-4 w-4 text-primary" />
              <span>My Borrower Pass</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CATALOG EXPLORER                                                  */}
      {/* ========================================================================= */}
      {activeTab === 'catalog' && (
        <div className="space-y-6">
          {/* Search & Filtering Console */}
          <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-card space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Main Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="h-11 rounded-2xl pl-10 pr-9 text-sm"
                  placeholder="Search books by title, author, genre, or call number…"
                  value={catalogQuery}
                  onChange={(e) => setCatalogQuery(e.target.value)}
                />
                {catalogQuery && (
                  <button
                    onClick={() => setCatalogQuery('')}
                    className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* View Mode Switcher */}
              <div className="inline-flex rounded-xl border border-border/60 bg-muted/30 p-1">
                <button
                  onClick={() => setCatalogView('grid')}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                    catalogView === 'grid'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Grid cards"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Cards</span>
                </button>
                <button
                  onClick={() => setCatalogView('table')}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                    catalogView === 'table'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title="Table view"
                >
                  <List className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Table</span>
                </button>
              </div>
            </div>

            {/* Quick Filter Strip */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/40 text-xs">
              <span className="font-semibold text-muted-foreground flex items-center gap-1 mr-1">
                <Filter className="h-3.5 w-3.5" /> Filter:
              </span>

              {/* Availability Filter Chips */}
              <button
                onClick={() => setAvailFilter('all')}
                className={`rounded-full px-3 py-1 font-medium transition-all ${
                  availFilter === 'all'
                    ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                All Availability
              </button>
              <button
                onClick={() => setAvailFilter('available')}
                className={`rounded-full px-3 py-1 font-medium transition-all ${
                  availFilter === 'available'
                    ? 'bg-emerald-500 text-white font-semibold shadow-xs'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                Available On Shelf
              </button>
              <button
                onClick={() => setAvailFilter('borrowed')}
                className={`rounded-full px-3 py-1 font-medium transition-all ${
                  availFilter === 'borrowed'
                    ? 'bg-amber-500 text-white font-semibold shadow-xs'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                Checked Out
              </button>

              <span className="text-border mx-1">|</span>

              {/* Genre Chips */}
              <button
                onClick={() => setSelectedGenre('')}
                className={`rounded-full px-3 py-1 font-medium transition-all ${
                  !selectedGenre
                    ? 'bg-foreground text-background font-semibold shadow-xs'
                    : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                }`}
              >
                All Genres
              </button>
              {genres.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGenre(selectedGenre === g ? '' : g)}
                  className={`rounded-full px-3 py-1 font-medium transition-all ${
                    selectedGenre === g
                      ? 'bg-foreground text-background font-semibold shadow-xs'
                      : 'bg-muted/40 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              Showing <strong className="text-foreground">{filteredTitles.length}</strong> title
              {filteredTitles.length === 1 ? '' : 's'} (from {catalogRows.length} total copies in
              stacks)
            </span>
            {(catalogQuery || selectedGenre || availFilter !== 'all') && (
              <button
                onClick={() => {
                  setCatalogQuery('');
                  setSelectedGenre('');
                  setAvailFilter('all');
                }}
                className="font-medium text-primary hover:underline"
              >
                Reset all filters
              </button>
            )}
          </div>

          {/* Results Display */}
          {loadingCatalog ? (
            catalogView === 'grid' ? (
              <LookupCatalogGridSkeleton />
            ) : (
              <LookupCatalogTableSkeleton />
            )
          ) : filteredTitles.length === 0 ? (
            <div className="rounded-3xl border border-border/70 bg-card p-12 text-center shadow-card">
              <EmptyState
                icon={BookOpen}
                title="No matching books found"
                description="Try broadening your search keywords or clearing active genre and availability filters."
              />
            </div>
          ) : catalogView === 'grid' ? (
            /* GRID VIEW */
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredTitles.map((book) => {
                const totalCopies = book.copies.length;
                const availableCopies = book.copies.filter(
                  (c) => (c.status || '').toLowerCase() === 'available'
                ).length;
                const isAvailable = availableCopies > 0;

                return (
                  <div
                    key={`${book.title}-${book.author}`}
                    className="group relative flex flex-col justify-between rounded-3xl border border-border/70 bg-card p-4 shadow-card transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-card-hover"
                  >
                    <div>
                      {/* Top badge bar */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <Badge variant="neutral" className="text-[10px]">
                          {book.genre}
                        </Badge>
                        <Badge
                          variant={isAvailable ? 'success' : 'warning'}
                          statusDot={true}
                          className="text-[10px]"
                        >
                          {isAvailable ? `${availableCopies}/${totalCopies} Available` : 'All On Loan'}
                        </Badge>
                      </div>

                      {/* Cover & Title */}
                      <div className="flex items-start gap-3">
                        <Cover title={book.title} size="md" className="shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                            {book.title}
                          </h3>
                          <p className="mt-0.5 text-xs text-muted-foreground truncate">{book.author}</p>
                          <div className="mt-2 inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                            <MapPin className="h-3 w-3 text-primary" />
                            <span>{book.classification || 'Section General'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        {totalCopies} physical {totalCopies === 1 ? 'copy' : 'copies'}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedBookForCopies(book)}
                        className="h-8 rounded-xl text-xs font-semibold px-3"
                      >
                        Inspect Copies
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="rounded-3xl border border-border/70 bg-card shadow-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book & Author</TableHead>
                    <TableHead>Genre</TableHead>
                    <TableHead>Shelf Location</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTitles.map((book) => {
                    const totalCopies = book.copies.length;
                    const availableCopies = book.copies.filter(
                      (c) => (c.status || '').toLowerCase() === 'available'
                    ).length;
                    const isAvailable = availableCopies > 0;

                    return (
                      <TableRow key={`${book.title}-${book.author}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Cover title={book.title} size="sm" />
                            <div>
                              <div className="font-semibold text-foreground text-sm">{book.title}</div>
                              <div className="text-xs text-muted-foreground">{book.author}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="neutral" className="text-[11px]">
                            {book.genre}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="font-mono text-xs text-muted-foreground">
                            {book.classification || 'Main Stacks'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={isAvailable ? 'success' : 'warning'} statusDot={true}>
                            {isAvailable
                              ? `${availableCopies} of ${totalCopies} On Shelf`
                              : 'All Copies Borrowed'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setSelectedBookForCopies(book)}
                            className="rounded-xl text-xs font-medium"
                          >
                            Copies ({totalCopies})
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Copy Inspection Modal */}
          {selectedBookForCopies && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
              onClick={() => setSelectedBookForCopies(null)}
            >
              <div
                className="w-full max-w-xl rounded-3xl border border-border/80 bg-card p-6 shadow-2xl space-y-5"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Cover title={selectedBookForCopies.title} size="md" />
                    <div>
                      <h3 className="text-lg font-bold text-foreground leading-tight">
                        {selectedBookForCopies.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">{selectedBookForCopies.author}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="neutral" className="text-[10px]">
                          {selectedBookForCopies.genre}
                        </Badge>
                        <span className="font-mono text-xs text-muted-foreground">
                          Shelf: {selectedBookForCopies.classification || 'Main Stacks'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedBookForCopies(null)}
                    className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                    Physical Copies in Library ({selectedBookForCopies.copies.length})
                  </h4>
                  <div className="rounded-2xl border border-border/60 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Copy Barcode</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Condition</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedBookForCopies.copies.map((c, idx) => {
                          const isAvail = (c.status || '').toLowerCase() === 'available';
                          return (
                            <TableRow key={c.id || c.copyCode || idx}>
                              <TableCell className="font-mono text-xs font-bold text-foreground">
                                {c.copyCode || `COPY-${idx + 1}`}
                              </TableCell>
                              <TableCell>
                                <Badge variant={isAvail ? 'success' : 'warning'} statusDot={true}>
                                  {c.status || 'Available'}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="neutral" className="capitalize text-xs">
                                  {c.condition || 'Good'}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs text-muted-foreground">
                  <span>To borrow, take this book to the Dual-QR Circulation station.</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl"
                    onClick={() => setSelectedBookForCopies(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PATRON SELF-SERVICE BORROWER PASS                                 */}
      {/* ========================================================================= */}
      {activeTab === 'patron' && (
        <div className="space-y-6">
          {/* Kiosk Input Bar */}
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card space-y-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Patron Member Barcode or Card ID
              </label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Scan your card or enter your patron identification code (e.g. P-0001, P-0002)
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Input
                  className="font-mono text-base pl-10 h-12 rounded-2xl"
                  value={patronCode}
                  onChange={(e) => setPatronCode(e.target.value)}
                  placeholder="e.g. P-0001"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handlePatronLookup();
                  }}
                />
                <User className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
                {patronCode && (
                  <button
                    onClick={() => setPatronCode('')}
                    className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              <Button
                onClick={() => handlePatronLookup()}
                disabled={patronBusy || !patronCode.trim()}
                className="h-12 px-6 rounded-2xl shadow-primary-sm text-sm font-semibold"
              >
                <Search className="mr-2 h-4 w-4" />
                {patronBusy ? 'Verifying Account…' : 'Access My Borrower Pass'}
              </Button>
            </div>

            {/* Quick Suggestions for Demo */}
            <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
              <span>Quick demo accounts:</span>
              {['P-0001', 'P-0002', 'P-0003'].map((demo) => (
                <button
                  key={demo}
                  onClick={() => {
                    setPatronCode(demo);
                    handlePatronLookup(demo);
                  }}
                  className="font-mono rounded-lg border border-border/60 bg-muted/30 px-2 py-0.5 hover:bg-muted text-foreground transition-colors"
                >
                  {demo}
                </button>
              ))}
            </div>

            {patronData && patronData.error && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-50 p-3.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{patronData.error}</span>
              </div>
            )}
          </div>

          {/* Results View */}
          {patronBusy ? (
            <LookupPatronPassSkeleton />
          ) : patronData && !patronData.error ? (
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              {/* Active Loans Card */}
              <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-border/50">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-base shadow-xs">
                      {patronData.patron.name[0]}
                    </span>
                    <div>
                      <h3 className="text-base font-bold text-foreground">
                        {patronData.patron.name}
                      </h3>
                      <p className="text-xs font-mono text-muted-foreground">
                        {patronData.patron.code} · Active Member
                      </p>
                    </div>
                  </div>
                  <Badge variant="success" statusDot={true}>
                    Verified Pass
                  </Badge>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Currently Borrowed Titles ({patronData.activeLoans.length})
                    </h4>
                    {patronData.activeLoans.length > 0 && (
                      <span className="text-[11px] text-muted-foreground">
                        Due dates are enforced automatically
                      </span>
                    )}
                  </div>

                  {patronData.activeLoans.length > 0 ? (
                    <div className="rounded-2xl border border-border/60 overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Book Title</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead className="text-right">Timeline</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {patronData.activeLoans.map((l) => {
                            const status = getDueStatus(l.dueAt);
                            return (
                              <TableRow key={l.id}>
                                <TableCell>
                                  <div className="flex items-center gap-2.5">
                                    <Cover title={l.title} size="sm" />
                                    <div>
                                      <span className="font-semibold text-foreground text-sm block">
                                        {l.title}
                                      </span>
                                      <span className="text-[11px] text-muted-foreground font-mono">
                                        {l.copyCode || 'Copy Assigned'}
                                      </span>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {fmt(l.dueAt)}
                                </TableCell>
                                <TableCell className="text-right">
                                  <Badge variant={status.variant} statusDot={true}>
                                    {status.label}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="py-8 text-center rounded-2xl border border-dashed border-border/70">
                      <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                      <h4 className="text-sm font-semibold text-foreground">No active loans</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        You have no books currently checked out. Ready to borrow a new title!
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recommended for You */}
              <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card space-y-5">
                <div className="flex items-center gap-2 pb-4 border-b border-border/50">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Picked for You</h3>
                    <p className="text-xs text-muted-foreground">
                      Personalized recommendations based on your circulation habits
                    </p>
                  </div>
                </div>

                {Array.isArray(patronData.recommendations) &&
                patronData.recommendations.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3.5">
                    {patronData.recommendations.map((r) => (
                      <div
                        key={r.id}
                        className="group flex flex-col items-center justify-between rounded-2xl border border-border/70 bg-muted/20 p-3.5 text-center transition-all hover:bg-muted/40 hover:border-primary/40 hover:-translate-y-0.5"
                      >
                        <div className="flex flex-col items-center">
                          <Cover title={r.title} size="md" className="group-hover:scale-105 transition-transform" />
                          <p className="mt-2.5 text-xs font-bold text-foreground line-clamp-2 leading-tight">
                            {r.title}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                            {r.author || r.genre || 'Staff Pick'}
                          </p>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => jumpToCatalogSearch(r.title)}
                          className="mt-3 w-full h-7 rounded-lg text-[10px] font-semibold text-primary hover:bg-primary/10"
                        >
                          Find on Shelf
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-muted-foreground rounded-2xl border border-dashed border-border/70">
                    <Compass className="mx-auto h-7 w-7 text-muted-foreground/60 mb-2" />
                    <span>No personalized recommendations generated yet.</span>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

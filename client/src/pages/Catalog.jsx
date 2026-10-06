import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Check,
  Copy,
  Filter,
  Grid,
  Layers,
  LayoutGrid,
  List,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  X,
} from 'lucide-react';
import { api } from '../api.js';
import { Cover } from '../cover.jsx';
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

function CatalogGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col justify-between rounded-3xl border border-border/70 bg-card p-5 shadow-card space-y-4"
        >
          <div className="space-y-3.5">
            <div className="flex items-start justify-between gap-3">
              <SkeletonCover size="lg" />
              <div className="flex flex-col items-end gap-1.5">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-20 rounded-md" />
              </div>
            </div>
            <div className="space-y-2 pt-1">
              <Skeleton className="h-4 w-4/5 rounded-md" />
              <Skeleton className="h-3 w-1/2 rounded-md" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
            <Skeleton className="h-7 w-20 rounded-lg" />
            <Skeleton className="h-7 w-12 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function CatalogTableSkeleton() {
  return (
    <div className="rounded-3xl border border-border/70 bg-card shadow-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Book & Details</TableHead>
            <TableHead>Genre</TableHead>
            <TableHead>Copy Code</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead className="text-right">Actions</TableHead>
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
                    <Skeleton className="h-3 w-24 rounded" />
                  </div>
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-20 rounded font-mono" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-6 w-20 rounded-lg" /></TableCell>
              <TableCell className="text-right"><Skeleton className="h-7 w-14 rounded-lg ml-auto" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function Catalog() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('catalog_view') || 'grid');

  const fetchCatalog = () => {
    api('/api/catalog')
      .then((d) => {
        if (Array.isArray(d)) setRows(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const setAndSaveView = (mode) => {
    setViewMode(mode);
    localStorage.setItem('catalog_view', mode);
  };

  const genres = Array.from(new Set(rows.map((r) => r.genre).filter(Boolean))).sort();

  const list = rows.filter((r) => {
    const matchQuery = (r.title + ' ' + r.author + ' ' + (r.copyCode || '')).toLowerCase().includes(q.toLowerCase());
    const matchStatus =
      !statusFilter ||
      (statusFilter === 'Available' ? r.status === 'Available' : r.status !== 'Available');
    const matchGenre = !genreFilter || r.genre === genreFilter;
    return matchQuery && matchStatus && matchGenre;
  });

  // ponytail: one card/row per title family (case-insensitive); copies live on the detail page
  const normTitle = (t) => (t || '').trim().toLowerCase();
  const groups = [];
  const byTitle = new Map();
  list.forEach((r) => {
    const key = normTitle(r.title);
    let g = byTitle.get(key);
    if (!g) {
      g = { key, id: r.id, title: r.title, author: r.author, genre: r.genre, cover: r.cover, copies: [] };
      byTitle.set(key, g);
      groups.push(g);
    }
    g.copies.push(r);
  });

  const availCount = (copies) => copies.filter((c) => c.status === 'Available').length;

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-border/70 bg-gradient-to-r from-card via-card to-primary/5 p-6 shadow-card sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Book Inventory & Physical Copies
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Library Catalog
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Explore book titles, inspect copy barcodes, condition ratings, and shelf availability
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => navigate('/catalog/new')}
            className="rounded-xl shadow-primary-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Book
          </Button>
        </div>
      </div>

      {/* Control Toolbar with View Switcher */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-card lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search by title, author, or copy barcode…"
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

        {/* Right: Filters & View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center rounded-xl border border-border/70 bg-muted/40 p-1">
            <button
              onClick={() => setStatusFilter('')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === '' ? 'bg-card text-foreground shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({groups.length})
            </button>
            <button
              onClick={() => setStatusFilter('Available')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === 'Available' ? 'bg-card text-emerald-600 dark:text-emerald-400 shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Available
            </button>
            <button
              onClick={() => setStatusFilter('On loan')}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                statusFilter === 'On loan' ? 'bg-card text-primary shadow-xs font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              On Loan
            </button>
          </div>

          {/* Genre Dropdown */}
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

          {/* View Mode Toggle: Grid vs Table */}
          <div className="flex items-center rounded-xl border border-border/70 bg-muted/40 p-1">
            <button
              onClick={() => setAndSaveView('grid')}
              title="Grid Cards View"
              aria-label="Grid Cards View"
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-card text-primary shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setAndSaveView('table')}
              title="Data Table View"
              aria-label="Data Table View"
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-card text-primary shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <Badge variant="neutral">
            {groups.length} showing
          </Badge>
        </div>
      </div>

      {/* Main Content: Grid vs Table */}
      {loading ? (
        viewMode === 'grid' ? <CatalogGridSkeleton /> : <CatalogTableSkeleton />
      ) : list.length > 0 ? (
        viewMode === 'grid' ? (
          /* Visual Card Grid View */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in duration-200">
            {groups.map((g) => (
              <div
                key={g.key}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/catalog/book/${g.id}`)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/catalog/book/${g.id}`); } }}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/70 bg-card p-5 shadow-card transition-all duration-200 ease-out hover:border-primary/50 hover:shadow-card-hover hover:-translate-y-1 cursor-pointer"
              >
                <div className="space-y-3.5">
                  {/* Top Cover and Badges */}
                  <div className="flex items-start justify-between gap-3">
                    <Cover title={g.title} size="lg" src={g.cover} className="transition-transform duration-200 group-hover:scale-105" />
                    <div className="flex flex-col items-end gap-1.5">
                      <Badge
                        variant={availCount(g.copies) > 0 ? 'success' : 'default'}
                        
                      >
                        {availCount(g.copies) > 0 ? 'Available' : 'Borrowed'}
                      </Badge>
                      <span className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold text-foreground">
                        {g.copies.length} {g.copies.length === 1 ? 'copy' : 'copies'}
                      </span>
                    </div>
                  </div>

                  {/* Book Metadata */}
                  <div>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); navigate(`/catalog/book/${g.id}`); }}
                      title={g.title}
                      className="block max-w-full cursor-pointer text-left"
                    >
                      <h3 className="text-sm font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {g.title}
                      </h3>
                    </button>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {g.author}
                    </p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="rounded-full border border-border/60 bg-muted/30 px-2 py-0.5 text-[10px] text-muted-foreground">
                        {g.genre || 'General'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                      onClick={(e) => { e.stopPropagation(); navigate(`/catalog/book/${g.id}`); }}
                    className="h-7 text-xs rounded-lg shadow-xs"
                  >
                    <BookOpen className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Dense Data Table View */
          <div className="rounded-3xl border border-border/70 bg-card shadow-card overflow-hidden animate-in fade-in duration-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Book Title & Author</TableHead>
                  <TableHead>Copies</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((g) => (
                  <TableRow key={g.key} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Cover title={g.title} size="md" src={g.cover} />
                        <div className="min-w-0 max-w-[320px]">
                          <button
                            type="button"
                            onClick={() => navigate(`/catalog/book/${g.id}`)}
                            title={g.title}
                            className="block max-w-full cursor-pointer truncate text-left font-semibold text-foreground text-sm group-hover:text-primary transition-colors"
                          >
                            {g.title}
                          </button>
                          <p className="truncate text-xs text-muted-foreground">
                            {g.author}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-xs font-semibold text-foreground">
                        {g.copies.length} {g.copies.length === 1 ? 'copy' : 'copies'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="rounded-full border border-border/60 bg-muted/30 px-2.5 py-0.5 text-xs text-muted-foreground">
                        {g.genre || 'General'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={availCount(g.copies) > 0 ? 'success' : 'default'}
                        
                      >
                        {availCount(g.copies) > 0 ? 'Available' : 'Borrowed'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/catalog/book/${g.id}`)}
                          className="h-8 rounded-lg px-2.5 text-xs shadow-xs"
                        >
                          <BookOpen className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )
      ) : (
        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card">
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
  );
}

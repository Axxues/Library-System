import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Eye,
  Filter,
  History,
  RotateCcw,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { api } from '../api.js';
import { Cover } from '../cover.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Dialog } from '../components/ui/dialog.jsx';
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

const fmt = (d) => (d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '—');

function getDueInfo(dueAt, returnAt) {
  if (returnAt) {
    return { text: `Returned ${fmt(returnAt)}`, variant: 'success', status: 'Returned' };
  }
  if (!dueAt) return { text: '—', variant: 'neutral', status: 'Borrowed' };

  const now = new Date();
  const due = new Date(dueAt);
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysLate = Math.abs(diffDays);
    return {
      text: `${daysLate} day${daysLate === 1 ? '' : 's'} overdue`,
      variant: 'destructive',
      status: 'Overdue',
    };
  }
  if (diffDays === 0) {
    return { text: 'Due today', variant: 'warning', status: 'Due Today' };
  }
  if (diffDays <= 3) {
    return { text: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`, variant: 'warning', status: 'Borrowed' };
  }
  return { text: `Due in ${diffDays} days`, variant: 'neutral', status: 'Borrowed' };
}

function LoansTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Borrower</TableHead>
          <TableHead>Book Title & Copy</TableHead>
          <TableHead>Checkout Date</TableHead>
          <TableHead>Due Date / Timeline</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-28 rounded" />
                  <Skeleton className="h-3 w-16 rounded font-mono" />
                </div>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <SkeletonCover size="sm" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40 rounded" />
                  <Skeleton className="h-3 w-20 rounded font-mono" />
                </div>
              </div>
            </TableCell>
            <TableCell><Skeleton className="h-4 w-24 rounded" /></TableCell>
            <TableCell>
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
            </TableCell>
            <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-8 w-20 rounded-xl ml-auto" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default function Loans() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [f, setF] = useState('');
  const [q, setQ] = useState('');
  const [counts, setCounts] = useState({ all: 0, active: 0, overdue: 0, returned: 0 });
  const [actionBusy, setActionBusy] = useState(null);
  const [confirmLoan, setConfirmLoan] = useState(null);
  const [detailLoan, setDetailLoan] = useState(null); // ponytail: selected loan for details dialog
  const [patronMap, setPatronMap] = useState({}); // ponytail: code->name fallback if loans payload lacks patronName
  const nameFor = (l) => l?.patronName || patronMap[l?.patronCode] || l?.patronCode;

  const load = (status) => {
    setLoading(true);
    let url = '/api/loans';
    if (status === 'active') url = '/api/loans?status=active';
    else if (status === 'overdue') url = '/api/loans?status=overdue';

    api(url)
      .then((d) => {
        if (Array.isArray(d)) {
          if (status === 'returned') {
            setRows(d.filter((l) => Boolean(l.returnAt)));
          } else {
            setRows(d);
          }
        }
        setF(status);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const refreshCounts = () => {
    Promise.all([
      api('/api/loans'),
      api('/api/loans?status=active'),
      api('/api/loans?status=overdue'),
    ])
      .then(([all, active, od]) => {
        const allList = Array.isArray(all) ? all : [];
        const activeList = Array.isArray(active) ? active : [];
        const odList = Array.isArray(od) ? od : [];
        const returnedList = allList.filter((l) => Boolean(l.returnAt));

        setCounts({
          all: allList.length,
          active: activeList.length,
          overdue: odList.length,
          returned: returnedList.length,
        });
      })
      .catch(() => {});
  };

  useEffect(() => {
    load('');
    refreshCounts();
    api('/api/patrons').then((d) => {
      if (Array.isArray(d)) setPatronMap(Object.fromEntries(d.map((p) => [p.code, p.name])));
    }).catch(() => {});
  }, []);

  const handleReturn = async (loan) => {
    if (!loan.patronCode || !loan.copyCode) return;
    setActionBusy(loan.id);
    try {
      await api('/api/circulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patronCode: loan.patronCode,
          copyCode: loan.copyCode,
          action: 'return',
        }),
      });
      setActionBusy(null);
      setConfirmLoan(null);
      load(f);
      refreshCounts();
    } catch {
      setActionBusy(null);
    }
  };

  const list = rows.filter((l) => {
    const searchString = `${l.patronCode || ''} ${l.patronName || ''} ${l.title || ''} ${l.copyCode || ''}`.toLowerCase();
    return searchString.includes(q.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-border/70 bg-gradient-to-r from-card via-card to-primary/5 p-6 shadow-card sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Circulation Activity & Tracking
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Borrowing Activity Log
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Monitor circulation records, track upcoming due dates, and process fast check-ins
          </p>
        </div>
      </div>

      {/* Filter Tabs and Search Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-card md:flex-row md:items-center md:justify-between">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/70 bg-muted/40 p-1">
          <button
            onClick={() => load('')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 active:scale-[0.97] ${
              f === '' ? 'bg-card text-foreground font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Loans ({counts.all})
          </button>
          <button
            onClick={() => load('active')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 active:scale-[0.97] ${
              f === 'active' ? 'bg-card text-primary font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Active ({counts.active})
          </button>
          <button
            onClick={() => load('overdue')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 active:scale-[0.97] ${
              f === 'overdue' ? 'bg-card text-rose-600 dark:text-rose-400 font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Overdue ({counts.overdue})
          </button>
          <button
            onClick={() => load('returned')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 active:scale-[0.97] ${
              f === 'returned' ? 'bg-card text-emerald-600 dark:text-emerald-400 font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Returned ({counts.returned})
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-sm">
          <Input
            placeholder="Search by patron code, title, or barcode…"
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
      </div>

      {/* Main Loans Activity Table */}
      <div className="rounded-3xl border border-border/70 bg-card shadow-card overflow-hidden animate-in fade-in duration-200">
        {loading ? (
          <LoansTableSkeleton />
        ) : list.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Borrower</TableHead>
                <TableHead>Book Title & Copy</TableHead>
                <TableHead>Checkout Date</TableHead>
                <TableHead>Due Date / Timeline</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((l) => {
                const dueInfo = getDueInfo(l.dueAt, l.returnAt);
                const isOverdue = !l.returnAt && new Date(l.dueAt) < new Date();
                return (
                  <TableRow key={l.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary font-mono text-xs font-bold">
                          {(l.patronCode || 'P').slice(-2)}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-foreground">
                            {nameFor(l)}
                          </p>
                          <p className="font-mono text-[11px] text-muted-foreground">{l.patronCode}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 max-w-[320px]">
                        <Cover title={l.title} size="md" />
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                            {l.title || l.copyCode}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {l.copyCode}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {fmt(l.checkoutAt)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-foreground whitespace-nowrap">
                          {fmt(l.dueAt)}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            dueInfo.variant === 'destructive'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : dueInfo.variant === 'warning'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : dueInfo.variant === 'success'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {dueInfo.text}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          l.returnAt
                            ? 'success'
                            : isOverdue
                            ? 'destructive'
                            : 'default'
                        }
                        
                      >
                        {l.returnAt ? 'Returned' : isOverdue ? 'Overdue' : 'On Loan'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDetailLoan(l)}
                          className="h-8 rounded-lg px-2.5 text-xs shadow-xs"
                        >
                          <Eye className="mr-1.5 h-3.5 w-3.5" />
                          Details
                        </Button>
                        {!l.returnAt && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actionBusy === l.id}
                            onClick={() => setConfirmLoan(l)}
                            className="h-8 rounded-lg px-2.5 text-xs shadow-xs hover:border-emerald-500 hover:text-emerald-600"
                          >
                            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                            {actionBusy === l.id ? 'Returning…' : 'Check In'}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={History}
              title="No circulation records found"
              description="No active loans match the selected filter criteria."
              actionText="Reset Filter"
              onAction={() => {
                load('');
                setQ('');
              }}
            />
          </div>
        )}
      </div>

      <Dialog open={!!confirmLoan} onClose={() => setConfirmLoan(null)}>
        {confirmLoan && (
          <div className="space-y-4">
            <div className="border-b border-border/70 pb-3">
              <h3 className="text-base font-bold text-foreground">Check in this book?</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">The loan closes now and the copy returns to Available.</p>
            </div>
            <dl className="grid grid-cols-[130px_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">Book</dt><dd className="font-semibold">{confirmLoan.title || confirmLoan.copyCode}</dd>
              <dt className="text-muted-foreground">Copy</dt><dd className="font-mono text-xs">{confirmLoan.copyCode}</dd>
              <dt className="text-muted-foreground">Patron</dt><dd className="font-mono text-xs">{confirmLoan.patronCode}</dd>
            </dl>
            <div className="flex items-center justify-end gap-2.5 border-t border-border/50 pt-3">
              <Button type="button" variant="outline" onClick={() => setConfirmLoan(null)} className="rounded-xl">
                Cancel
              </Button>
              <Button onClick={() => handleReturn(confirmLoan)} disabled={actionBusy === confirmLoan.id} className="rounded-xl shadow-primary-sm">
                {actionBusy === confirmLoan.id ? 'Returning…' : 'Confirm Check In'}
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      <Dialog open={!!detailLoan} onClose={() => setDetailLoan(null)}>
        {detailLoan && (
          <div className="space-y-4">
            <div className="border-b border-border/70 pb-3">
              <h3 className="text-base font-bold text-foreground">Circulation Details</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">Borrowed book, borrower, and loan dates.</p>
            </div>
            <div className="flex items-center gap-3">
              <Cover title={detailLoan.title} size="md" />
              <div className="min-w-0">
                <p className="truncate font-semibold text-foreground">{detailLoan.title || detailLoan.copyCode}</p>
                <p className="font-mono text-xs text-muted-foreground">{detailLoan.copyCode}</p>
              </div>
              <span className="ml-auto">
                <Badge variant={detailLoan.returnAt ? 'success' : 'default'}>
                  {detailLoan.returnAt ? 'Returned' : 'On Loan'}
                </Badge>
              </span>
            </div>
            <dl className="grid grid-cols-[130px_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">Borrower</dt><dd className="font-semibold">{nameFor(detailLoan)}</dd>
              <dt className="text-muted-foreground">Borrowed</dt><dd>{fmt(detailLoan.checkoutAt)}</dd>
              <dt className="text-muted-foreground">Due</dt><dd>{fmt(detailLoan.dueAt)}</dd>
              <dt className="text-muted-foreground">Returned</dt><dd>{detailLoan.returnAt ? fmt(detailLoan.returnAt) : 'Not yet returned'}</dd>
            </dl>
            <div className="flex items-center justify-end border-t border-border/50 pt-3">
              <Button type="button" variant="outline" onClick={() => setDetailLoan(null)} className="rounded-xl">
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
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
import { Input } from '../components/ui/input.jsx';
import { EmptyState } from '../components/ui/empty-state.jsx';
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

export default function Loans() {
  const [rows, setRows] = useState([]);
  const [f, setF] = useState('');
  const [q, setQ] = useState('');
  const [counts, setCounts] = useState({ all: 0, active: 0, overdue: 0, returned: 0 });
  const [actionBusy, setActionBusy] = useState(null);

  const load = (status) => {
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
      .catch(() => {});
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
      load(f);
      refreshCounts();
    } catch {
      setActionBusy(null);
    }
  };

  const list = rows.filter((l) => {
    const searchString = `${l.patronCode || ''} ${l.title || ''} ${l.copyCode || ''}`.toLowerCase();
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

        <div className="flex items-center gap-2">
          <Badge
            variant={counts.overdue > 0 ? "destructive" : "success"}
            statusDot={true}
          >
            {counts.overdue > 0 ? `${counts.overdue} Overdue Attention Required` : 'Shelves in Good Standing'}
          </Badge>
        </div>
      </div>

      {/* Filter Tabs and Search Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-card md:flex-row md:items-center md:justify-between">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/70 bg-muted/40 p-1">
          <button
            onClick={() => load('')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              f === '' ? 'bg-card text-foreground font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All Loans ({counts.all})
          </button>
          <button
            onClick={() => load('active')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              f === 'active' ? 'bg-card text-primary font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Active ({counts.active})
          </button>
          <button
            onClick={() => load('overdue')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              f === 'overdue' ? 'bg-card text-rose-600 dark:text-rose-400 font-bold shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Overdue ({counts.overdue})
          </button>
          <button
            onClick={() => load('returned')}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
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
      <div className="rounded-3xl border border-border/70 bg-card shadow-card overflow-hidden">
        {list.length > 0 ? (
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
                          <p className="font-mono text-xs font-bold text-foreground">
                            {l.patronCode}
                          </p>
                          <p className="text-[11px] text-muted-foreground">Borrower</p>
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
                        statusDot={true}
                      >
                        {l.returnAt ? 'Returned' : isOverdue ? 'Overdue' : 'On Loan'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {!l.returnAt && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionBusy === l.id}
                          onClick={() => handleReturn(l)}
                          className="h-8 rounded-lg px-2.5 text-xs shadow-xs hover:border-emerald-500 hover:text-emerald-600"
                        >
                          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                          {actionBusy === l.id ? 'Returning…' : 'Check In'}
                        </Button>
                      )}
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
    </div>
  );
}

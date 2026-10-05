import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Bookmark,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Flame,
  Plus,
  QrCode,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import { api } from '../api.js';
import { Cover } from '../cover.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { MetricCard } from '../components/ui/metric-card.jsx';
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
  const [stats, setStats] = useState({ books: '—', active: '—', overdue: '—', copies: 0, avail: 0, odPatrons: 0 });
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
    ])
      .then(([cat, active, od, all]) => {
        const copies = Array.isArray(cat) ? cat.length : 0;
        const avail = Array.isArray(cat) ? cat.filter((bb) => bb.status === 'Available').length : 0;
        const titles = new Set((Array.isArray(cat) ? cat : []).map((b) => b.id)).size;
        const odList = Array.isArray(od) ? od : [];
        const activeList = Array.isArray(active) ? active : [];
        const loans = Array.isArray(all) ? all : [];

        setStats({
          books: titles,
          active: activeList.length,
          overdue: odList.length,
          copies,
          avail,
          odPatrons: new Set(odList.map((l) => l.patronCode)).size,
        });

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
        setInsights({
          genre: top(genreCount),
          title: top(titleCount),
          reader: top(readerCount),
        });

        setOverdue(odList.slice(0, 4));
        setPopular(
          Object.entries(titleCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([title, n]) => ({ title, n }))
        );
      })
      .catch(() => {});
  }, []);

  const max = Math.max(1, ...trend.map((t) => t.n));
  const totalTrendCheckouts = trend.reduce((sum, t) => sum + t.n, 0);

  return (
    <div className="space-y-6">
      {/* Top Welcome Header */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-border/70 bg-gradient-to-r from-card via-card to-primary/5 p-6 shadow-card sm:flex-row sm:items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Sto. Tomas Circulation Operations
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Front Desk Overview
          </h1>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-0.5">
            <Calendar className="h-3.5 w-3.5" />
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}{' '}
            · Live terminal shift
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => nav('/catalog')}
            variant="outline"
            size="sm"
            className="rounded-xl border-border/80 shadow-xs"
          >
            <BookOpen className="mr-2 h-4 w-4 text-muted-foreground" />
            Catalog
          </Button>
          <Button
            onClick={() => nav('/scan')}
            size="sm"
            className="rounded-xl shadow-primary-sm"
          >
            <QrCode className="mr-2 h-4 w-4" />
            Dual-QR Station
          </Button>
        </div>
      </div>

      {/* Metric Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Catalog Titles"
          value={stats.books}
          icon={BookOpen}
          iconColor="blue"
          subtitle={`${stats.avail ?? 0} of ${stats.copies ?? 0} copies on shelf`}
          progress={{
            percent: stats.copies > 0 ? (stats.avail / stats.copies) * 100 : 0,
            label: 'Shelf Availability',
            colorClass: 'bg-blue-600',
          }}
          onClick={() => nav('/catalog')}
        />
        <MetricCard
          title="Active Borrowings"
          value={stats.active}
          icon={ClipboardList}
          iconColor="emerald"
          subtitle={
            insights.title !== '—'
              ? `Most requested: "${insights.title}"`
              : 'No active checkouts currently'
          }
          trend={{
            positive: true,
            text: 'Active Circulation',
          }}
          onClick={() => nav('/loans')}
        />
        <MetricCard
          title="Overdue Alerts"
          value={stats.overdue}
          icon={AlertTriangle}
          iconColor={stats.overdue > 0 ? "rose" : "amber"}
          subtitle={`${stats.odPatrons ?? 0} patron(s) with items past due`}
          trend={{
            positive: stats.overdue === 0,
            text: stats.overdue > 0 ? 'Requires attention' : 'Shelves in good standing',
          }}
          onClick={() => nav('/loans')}
        />
      </div>

      {/* Main Grid: Left analytics + tables, Right operational alerts */}
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Borrowing Trend Visualizer */}
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-semibold text-foreground tracking-tight">
                    Circulation Trends
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Monthly loans activity for the last 8 months
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="neutral">
                  {totalTrendCheckouts} Total Checkouts
                </Badge>
              </div>
            </div>

            {/* Bars container */}
            <div className="mt-8 flex items-end gap-3 sm:gap-4 pt-4 border-t border-border/40 min-h-[160px]">
              {trend.map((t) => {
                const isPeak = t.n === max && max > 0;
                const barHeight = Math.max(12, Math.round((t.n / max) * 120));
                return (
                  <div
                    key={t.key}
                    className="group relative flex flex-1 flex-col items-center gap-2"
                  >
                    {/* Hover count tooltip */}
                    <div className="absolute -top-7 opacity-0 transition-opacity duration-150 group-hover:opacity-100 pointer-events-none">
                      <span className="rounded-md bg-foreground px-1.5 py-0.5 text-[10px] font-bold text-background shadow-xs whitespace-nowrap">
                        {t.n} loans
                      </span>
                    </div>

                    {/* Gradient Bar */}
                    <div className="relative w-full flex items-end justify-center">
                      <div
                        className={`w-full max-w-[42px] rounded-t-xl transition-all duration-300 group-hover:opacity-90 ${
                          isPeak
                            ? 'bg-gradient-to-t from-primary to-blue-400 shadow-primary-sm'
                            : 'bg-muted/70 hover:bg-muted'
                        }`}
                        style={{ height: `${barHeight}px` }}
                      />
                    </div>

                    <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                      {t.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Insights Row */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-card">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Bookmark className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold uppercase tracking-wider">Top Genre</span>
              </div>
              <p className="mt-2 text-sm font-bold text-foreground truncate">{insights.genre}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-card">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-semibold uppercase tracking-wider">Most Borrowed</span>
              </div>
              <p className="mt-2 text-sm font-bold text-foreground truncate">{insights.title}</p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-card p-4 shadow-card">
              <div className="flex items-center gap-2 text-muted-foreground">
                <UserCheck className="h-4 w-4 text-purple-500" />
                <span className="text-xs font-semibold uppercase tracking-wider">Top Reader</span>
              </div>
              <p className="mt-2 text-sm font-bold text-foreground truncate">{insights.reader}</p>
            </div>
          </div>

          {/* Latest Activity Table */}
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold text-foreground tracking-tight">
                  Recent Circulation Activity
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Latest 5 loan transactions processed at the desk
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => nav('/loans')}
                className="text-xs rounded-xl"
              >
                View all loans
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Button>
            </div>

            {recent.length > 0 ? (
              <div className="rounded-2xl border border-border/60 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patron</TableHead>
                      <TableHead>Book Title</TableHead>
                      <TableHead>Checkout Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recent.map((l) => (
                      <TableRow key={l.id}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold font-mono">
                              {(l.patronCode || 'P').slice(-2)}
                            </span>
                            <span className="font-mono text-xs font-semibold text-foreground">
                              {l.patronCode}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5 max-w-[280px]">
                            <Cover title={l.title} />
                            <span className="truncate font-medium text-foreground text-sm">
                              {l.title || l.copyCode}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {fmt(l.checkoutAt)}
                        </TableCell>
                        <TableCell>
                          {l.returnAt ? (
                            <Badge variant="success" statusDot={true}>
                              Returned
                            </Badge>
                          ) : (
                            <Badge variant="default" statusDot={true}>
                              On Loan
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <EmptyState
                icon={ClipboardList}
                title="No recent loans"
                description="Circulation transactions will appear here once books are checked out."
                actionText="Scan Patron & Book"
                onAction={() => nav('/scan')}
              />
            )}
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          {/* Overdue Attention Panel */}
          <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-card">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
                <h3 className="text-sm font-semibold text-foreground">Requires Attention</h3>
              </div>
              <Badge variant={overdue.length > 0 ? "destructive" : "success"} statusDot={true}>
                {overdue.length} overdue
              </Badge>
            </div>

            <div className="mt-3 divide-y divide-border/40">
              {overdue.length === 0 ? (
                <div className="py-6 text-center">
                  <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500/80 mb-2" />
                  <p className="text-xs font-semibold text-foreground">All books on schedule</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    No overdue borrowings right now.
                  </p>
                </div>
              ) : (
                overdue.map((l) => (
                  <div key={l.id} className="py-3 first:pt-1 last:pb-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Cover title={l.title} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {l.title}
                          </p>
                          <p className="text-[11px] font-mono text-muted-foreground">
                            {l.patronCode}
                          </p>
                        </div>
                      </div>
                      <Badge variant="destructive" className="shrink-0 text-[10px]">
                        Late
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-rose-600 dark:text-rose-400">
                      <span>Due: {fmt(l.dueAt)}</span>
                      <button
                        onClick={() => nav('/loans')}
                        className="font-medium underline hover:text-rose-700"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Popular Titles of All Time */}
          <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-card">
            <div className="flex items-center gap-2 pb-3 border-b border-border/50">
              <Flame className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-semibold text-foreground">Most Borrowed Titles</h3>
            </div>

            <div className="mt-3 divide-y divide-border/40">
              {popular.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  No circulation data recorded yet.
                </p>
              ) : (
                popular.map((p, i) => (
                  <div
                    key={p.title}
                    className="flex items-center gap-3 py-3 first:pt-1 last:pb-1 group"
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                        i === 0
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {i + 1}
                    </span>
                    <Cover title={p.title} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {p.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.n} checkout{p.n === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

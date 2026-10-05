import { useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  QrCode,
  Search,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { Cover } from '../cover.jsx';
import { api } from '../api.js';
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

export default function Lookup() {
  const [code, setCode] = useState('P-0001');
  const [out, setOut] = useState(null);
  const [busy, setBusy] = useState(false);

  const go = async () => {
    if (!code.trim()) return;
    setBusy(true);
    try {
      const data = await api(`/api/patrons/${code.trim()}/recommendations`);
      setOut(data);
    } catch (e) {
      setOut({ error: e.message === 'unreachable' ? 'Cannot reach the server at localhost:4000.' : e.message });
    }
    setBusy(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-border/70 bg-gradient-to-r from-card via-card to-primary/5 p-6 shadow-card sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Patron Self-Service Kiosk
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Find My Library Books
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Type your patron code or scan your library card to check your active loans and recommendations
          </p>
        </div>
      </div>

      {/* Kiosk Input Bar */}
      <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card space-y-4">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Enter Patron Code or Scan Card
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Input
              className="font-mono text-base pl-10 h-12 rounded-2xl"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. P-0001"
              onKeyDown={(e) => {
                if (e.key === 'Enter') go();
              }}
            />
            <User className="absolute left-3.5 top-3.5 h-5 w-5 text-muted-foreground" />
            {code && (
              <button
                onClick={() => setCode('')}
                className="absolute right-3.5 top-3.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
          <Button
            onClick={go}
            disabled={busy || !code.trim()}
            className="h-12 px-6 rounded-2xl shadow-primary-sm text-sm font-semibold"
          >
            <Search className="mr-2 h-4 w-4" />
            {busy ? 'Looking up…' : 'Check My Account'}
          </Button>
        </div>

        {out && out.error && (
          <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-50 p-3.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{out.error}</span>
          </div>
        )}
      </div>

      {/* Results View */}
      {out && !out.error && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Active Loans Card */}
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                  {out.patron.name[0]}
                </span>
                <div>
                  <h3 className="text-base font-bold text-foreground">{out.patron.name}</h3>
                  <p className="text-xs font-mono text-muted-foreground">{out.patron.code}</p>
                </div>
              </div>
              <Badge variant="success" statusDot={true}>Member Account</Badge>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Currently Borrowed Titles ({out.activeLoans.length})
              </h4>
              {out.activeLoans.length > 0 ? (
                <div className="rounded-2xl border border-border/60 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Book Title</TableHead>
                        <TableHead>Due Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {out.activeLoans.map((l) => (
                        <TableRow key={l.id}>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Cover title={l.title} size="md" />
                              <span className="font-semibold text-foreground text-sm">{l.title}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="warning">
                              Due {fmt(l.dueAt)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <EmptyState
                  icon={CheckCircle2}
                  title="No active loans"
                  description="You have no books currently checked out. Ready to borrow a new title!"
                />
              )}
            </div>
          </div>

          {/* Recommended for You */}
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border/50">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <div>
                <h3 className="text-base font-bold text-foreground">Picked for You</h3>
                <p className="text-xs text-muted-foreground">Based on your reading history & preferences</p>
              </div>
            </div>

            {Array.isArray(out.recommendations) && out.recommendations.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {out.recommendations.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-col items-center rounded-2xl border border-border/70 bg-muted/20 p-3 text-center transition-all hover:bg-muted/40"
                  >
                    <Cover title={r.title} size="lg" />
                    <p className="mt-2 text-xs font-semibold text-foreground line-clamp-2">
                      {r.title}
                    </p>
                    <Badge variant="neutral" className="mt-1 text-[10px]">
                      Recommended
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-xs text-muted-foreground">
                No personalized recommendations yet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

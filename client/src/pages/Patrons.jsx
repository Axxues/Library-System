import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  CreditCard,
  Download,
  ExternalLink,
  Library,
  Mail,
  MoreHorizontal,
  Phone,
  Printer,
  QrCode,
  Search,
  ShieldCheck,
  User,
  UserCheck,
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
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/table.jsx';

export default function Patrons() {
  const [rows, setRows] = useState([]);
  const [q, setQ] = useState('');
  const [qr, setQr] = useState(null);
  const [prof, setProf] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api('/api/patrons')
      .then((d) => {
        if (Array.isArray(d)) setRows(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const list = rows.filter((p) =>
    (p.code + ' ' + p.name + ' ' + (p.contact || '')).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-border/70 bg-gradient-to-r from-card via-card to-primary/5 p-6 shadow-card sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Borrower Directory
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Library Members
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Registered patrons, student/faculty IDs, and printable Dual-QR library passes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="neutral">
            {rows.length} Registered Members
          </Badge>
        </div>
      </div>

      {/* Search & Actions Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-card md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 max-w-md">
          <Input
            placeholder="Search by patron name, code, or contact…"
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

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Showing {list.length} patrons</span>
        </div>
      </div>

      {/* Patrons Directory Table */}
      <div className="rounded-3xl border border-border/70 bg-card shadow-card overflow-hidden">
        {list.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member Name & ID</TableHead>
                <TableHead>Patron Code</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map((p) => (
                <TableRow key={p.code} className="group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                        {(p.name || 'P')[0].toUpperCase()}
                      </span>
                      <div className="min-w-0 max-w-[280px]">
                        <p className="truncate font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
                          {p.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {p.role || 'General Patron'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-md border border-border/60 bg-muted/30 px-2 py-1 font-mono text-xs font-semibold text-foreground">
                      {p.code}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {p.contact || 'No contact on file'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="success" statusDot={true}>
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setQr(p)}
                        className="h-8 rounded-lg px-2.5 text-xs shadow-xs"
                      >
                        <QrCode className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                        Library Card
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setProf(p)}
                        className="h-8 rounded-lg px-2.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <User className="h-3.5 w-3.5" />
                        <span className="sr-only">Details</span>
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
              icon={Users}
              title="No patrons found"
              description="No registered members match your search query."
              actionText="Reset Search"
              onAction={() => setQ('')}
            />
          </div>
        )}
      </div>

      {/* Printable Municipal Library Card Modal */}
      <Dialog open={!!qr} onClose={() => setQr(null)}>
        {qr && (
          <div className="space-y-4">
            <div className="text-center pb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                Sto. Tomas Municipal Library
              </span>
              <h3 className="text-base font-bold text-foreground">Patron Membership Card</h3>
            </div>

            {/* High-fidelity Library Card Preview */}
            <div className="mx-auto max-w-sm overflow-hidden rounded-2xl border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-5 shadow-float text-foreground">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Library className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold tracking-tight">STO. TOMAS LIBRARY</p>
                    <p className="text-[9px] uppercase tracking-wider text-muted-foreground">Official Patron Pass</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono">
                  {qr.code}
                </Badge>
              </div>

              {/* QR and Member Profile */}
              <div className="my-4 flex items-center gap-4">
                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-white border border-border/80 shadow-xs">
                  <img
                    src={`http://localhost:4000/api/qr/${qr.code}`}
                    alt={`Library card QR for ${qr.name}`}
                    className="h-28 w-28 object-contain"
                  />
                  <p className="font-mono text-[9px] font-bold text-slate-800 mt-1">
                    {qr.code}
                  </p>
                </div>
                <div className="min-w-0 space-y-1.5 text-left">
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">Member Name</p>
                    <p className="text-sm font-bold text-foreground truncate">{qr.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">Membership Type</p>
                    <p className="text-xs font-semibold text-primary">{qr.role || 'Circulation Borrower'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-semibold text-muted-foreground">Contact</p>
                    <p className="text-[11px] text-muted-foreground truncate">{qr.contact || 'Registered Resident'}</p>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border/50 flex justify-between text-[10px] text-muted-foreground">
                <span>Authorized Card</span>
                <span>Dual-QR System</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.print()}
                className="rounded-xl"
              >
                <Printer className="mr-1.5 h-4 w-4" />
                Print Card
              </Button>
              <Button
                size="sm"
                onClick={() => setQr(null)}
                className="rounded-xl shadow-primary-sm"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Patron Profile Dialog */}
      <Dialog open={!!prof} onClose={() => setProf(null)}>
        {prof && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 border-b border-border/70 pb-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary font-bold text-lg">
                {(prof.name || 'P')[0].toUpperCase()}
              </span>
              <div>
                <h3 className="text-base font-bold text-foreground">{prof.name}</h3>
                <p className="text-xs font-mono text-muted-foreground">{prof.code}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Member Status</span>
                <Badge variant="success" statusDot={true}>Active Good Standing</Badge>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Contact Phone / Email</span>
                <span className="font-medium text-foreground">{prof.contact || 'None registered'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/40">
                <span className="text-muted-foreground">Borrowing Privilege</span>
                <span className="font-semibold text-primary">Standard (Up to 3 concurrent titles)</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setProf(null)}
                className="rounded-xl"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}

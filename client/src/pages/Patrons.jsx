import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  CreditCard,
  Download,
  ExternalLink,
  LayoutGrid,
  Library,
  List,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  Printer,
  QrCode,
  Search,
  ShieldCheck,
  User,
  UserCheck,
  UserPlus,
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
import { Skeleton } from '../components/ui/skeleton.jsx';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/table.jsx';

function downscale(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      const s = 128 / Math.max(img.width, img.height);
      c.width = Math.round(img.width * s);
      c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function PatronsCardSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col justify-between rounded-3xl border border-border/70 bg-card p-5 shadow-card space-y-4"
        >
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36 rounded-md" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-16 rounded-md" />
                <Skeleton className="h-3 w-14 rounded-md" />
              </div>
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between gap-2">
            <Skeleton className="h-8 flex-1 rounded-xl" />
            <Skeleton className="h-8 flex-1 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

function PatronsTableSkeleton() {
  return (
    <div className="rounded-3xl border border-border/70 bg-card shadow-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member & Identity</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Contact / Notes</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 6 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-2xl" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-4 w-32 rounded" />
                    <Skeleton className="h-3 w-20 rounded" />
                  </div>
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
              <TableCell><Skeleton className="h-4 w-40 rounded" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Skeleton className="h-8 w-16 rounded-xl" />
                  <Skeleton className="h-8 w-16 rounded-xl" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function Patrons() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [qr, setQr] = useState(null);
  const [prof, setProf] = useState(null);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('patrons_view') || 'cards');
  const [editing, setEditing] = useState(null);
  const [editError, setEditError] = useState('');
  const [saving, setSaving] = useState(false);
  const setEdit = (k) => (e) => setEditing({ ...editing, [k]: e.target.value });

  const openEdit = (p) => {
    setEditError('');
    setEditing({
      code: p.code,
      name: p.name || '',
      firstName: p.firstName || '',
      middleName: p.middleName || '',
      lastName: p.lastName || '',
      email: p.email || '',
      contact: p.contact || '',
      contact2: p.contact2 || '',
      addrStreet: p.addrStreet || '',
      addrBarangay: p.addrBarangay || '',
      addrCity: p.addrCity || '',
      addrProvince: p.addrProvince || '',
      addrPostal: p.addrPostal || '',
      avatar: p.avatar || null,
    });
  };

  const pickEdit = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await downscale(file);
      if (dataUrl.length > 50000) { setEditError('Picture still too large after shrink.'); return; }
      setEditing({ ...editing, avatar: dataUrl });
    } catch { setEditError('Could not read that image.'); }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setEditError('');
    if (!String(editing.firstName || '').trim() || !String(editing.lastName || '').trim()) {
      setEditError('First and last name are required.');
      return;
    }
    setSaving(true);
    try {
      const body = {};
      for (const [k, v] of Object.entries(editing)) body[k] = k === 'avatar' ? v : String(v || '').trim();
      await api('/api/patrons/' + editing.code, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      setEditing(null);
      setEditError('');
      const d = await api('/api/patrons');
      if (Array.isArray(d)) setRows(d);
    } catch (err) {
      setEditError(err.message || 'Failed to save member.');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    api('/api/patrons')
      .then((d) => {
        if (Array.isArray(d)) setRows(d);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const setAndSaveView = (mode) => {
    setViewMode(mode);
    localStorage.setItem('patrons_view', mode);
  };

  const list = rows.filter((p) =>
    (p.code + ' ' + p.name + ' ' + (p.contact || '') + ' ' + (p.contact2 || '') + ' ' + (p.email || '') + ' ' + (p.firstName || '') + ' ' + (p.lastName || '')).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-border/70 bg-gradient-to-r from-card via-card to-primary/5 p-6 shadow-card sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Borrower Membership Directory
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Library Members
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Registered resident and student borrowers with printable Dual-QR library passes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="neutral">
            {rows.length} Total Members
          </Badge>
          <Button
            onClick={() => navigate('/patrons/new')}
            className="rounded-xl shadow-primary-sm"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>
      </div>

      {/* Control Toolbar with View Switcher */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
        {/* Search Input */}
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

        {/* View Toggle and Count */}
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-xl border border-border/70 bg-muted/40 p-1">
            <button
              onClick={() => setAndSaveView('cards')}
              title="Membership Cards View"
              aria-label="Membership Cards View"
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                viewMode === 'cards'
                  ? 'bg-card text-primary shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setAndSaveView('table')}
              title="Directory Table View"
              aria-label="Directory Table View"
              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-card text-primary shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <span className="text-xs text-muted-foreground">Showing {list.length} patrons</span>
        </div>
      </div>

      {/* Main Content: Cards Grid vs Table */}
      {loading ? (
        viewMode === 'cards' ? <PatronsCardSkeleton /> : <PatronsTableSkeleton />
      ) : list.length > 0 ? (
        viewMode === 'cards' ? (
          /* Member Pass Cards Grid View */
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 animate-in fade-in duration-200">
            {list.map((p) => (
              <div
                key={p.code}
                className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/70 bg-card p-5 shadow-card transition-all duration-200 ease-out hover:border-primary/50 hover:shadow-card-hover hover:-translate-y-1"
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent text-primary font-bold text-base shadow-xs transition-transform duration-200 group-hover:scale-105">
                      {(p.name || 'P')[0].toUpperCase()}
                    </span>
                    <Badge variant="success"  className="text-[10px]">
                      Active
                    </Badge>
                  </div>

                  {/* Patron Details */}
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {p.name}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 font-mono text-[11px] font-bold text-foreground">
                        {p.code}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {p.role || 'Member'}
                      </span>
                    </div>
                  </div>

                  {/* Contact Snippet */}
                  <div className="rounded-xl border border-border/50 bg-muted/20 p-2.5 text-[11px] text-muted-foreground">
                    <p className="truncate">{p.contact || 'Registered municipal resident'}</p>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setProf(p)}
                    className="h-8 flex-1 text-xs rounded-xl shadow-xs"
                  >
                    <User className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                    Profile
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setQr(p)}
                    className="h-8 flex-1 text-xs rounded-xl shadow-primary-sm"
                  >
                    <QrCode className="mr-1.5 h-3.5 w-3.5" />
                    Library Pass
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Dense Directory Table View */
          <div className="rounded-3xl border border-border/70 bg-card shadow-card overflow-hidden animate-in fade-in duration-200">
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
                        {p.avatar ? (
                          <img src={p.avatar} alt={`${p.name} photo`} className="h-10 w-10 shrink-0 rounded-xl object-cover" />
                        ) : (
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm transition-transform duration-200 group-hover:scale-105">
                          {(p.name || 'P')[0].toUpperCase()}
                        </span>
                        )}
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
                      <span className="block text-xs text-muted-foreground">{p.contact || 'No contact on file'}</span>
                      {p.contact2 && <span className="block text-xs text-muted-foreground">{p.contact2}</span>}
                      {p.email && <span className="block text-xs text-muted-foreground">{p.email}</span>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="success" >
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
                        <Button size="sm" variant="outline" onClick={() => openEdit(p)}>Edit</Button>
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
          </div>
        )
      ) : (
        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card">
          <EmptyState
            icon={Users}
            title="No patrons found"
            description="No registered members match your search query."
            actionText="Reset Search"
            onAction={() => setQ('')}
          />
        </div>
      )}

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
                <Badge variant="success" >Active Good Standing</Badge>
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

      {/* Edit Member Dialog */}
      <Dialog open={!!editing} onClose={() => { setEditing(null); setEditError(''); }}>
        {editing && (
          <form onSubmit={saveEdit} className="space-y-5">
            <h3 className="text-base font-bold text-foreground">Edit Member {editing.code}</h3>
            {editError && (
              <div
                className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-50 p-3.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Juan"
                  value={editing.firstName}
                  onChange={setEdit('firstName')}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Middle Name
                </label>
                <Input
                  placeholder="e.g. Santos"
                  value={editing.middleName}
                  onChange={setEdit('middleName')}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="e.g. Dela Cruz"
                  value={editing.lastName}
                  onChange={setEdit('lastName')}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Email
              </label>
              <Input
                type="email"
                placeholder="e.g. juan@example.com"
                value={editing.email}
                onChange={setEdit('email')}
                className="text-sm"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Contact
                </label>
                <Input
                  placeholder="e.g. +63 900 000 0000"
                  value={editing.contact}
                  onChange={setEdit('contact')}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Secondary Contact
                </label>
                <Input
                  placeholder="e.g. +63 900 000 0001"
                  value={editing.contact2}
                  onChange={setEdit('contact2')}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Street / House No.
              </label>
              <Input
                placeholder="e.g. 123 Rizal St."
                value={editing.addrStreet}
                onChange={setEdit('addrStreet')}
                className="text-sm"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Barangay
                </label>
                <Input
                  value={editing.addrBarangay}
                  onChange={setEdit('addrBarangay')}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  City / Municipality
                </label>
                <Input
                  value={editing.addrCity}
                  onChange={setEdit('addrCity')}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Province
                </label>
                <Input
                  value={editing.addrProvince}
                  onChange={setEdit('addrProvince')}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Postal Code
                </label>
                <Input
                  value={editing.addrPostal}
                  onChange={setEdit('addrPostal')}
                  className="text-sm font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Photo
              </label>
              <div className="flex items-center gap-4">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-border/80 bg-muted/40">
                  {editing.avatar ? (
                    <img src={editing.avatar} alt="Member photo preview" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-muted-foreground">?</span>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={pickEdit} className="text-sm file:mr-3 file:rounded-lg file:border file:border-input file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-foreground hover:file:bg-accent focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-ring/40" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-border/50 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setEditing(null); setEditError(''); }}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="rounded-xl shadow-primary-sm"
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}

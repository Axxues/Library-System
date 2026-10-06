import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Printer,
  UserPlus,
  Users,
} from 'lucide-react';
import { api, API_BASE } from '../api.js';
import { Cover } from '../cover.jsx';
import { Button } from '../components/ui/button.jsx';
import { Card } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';

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

export default function AddPatron() {
  const navigate = useNavigate();
  const [f, setF] = useState({ firstName: '', middleName: '', lastName: '', email: '', contact: '', contact2: '', addrStreet: '', addrBarangay: '', addrCity: '', addrProvince: '', addrPostal: '', avatar: null });
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const pick = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await downscale(file);
      if (dataUrl.length > 50000) { setError('Picture still too large after shrink.'); return; }
      setF({ ...f, avatar: dataUrl });
    } catch { setError('Could not read that image.'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!f.firstName.trim() || !f.lastName.trim()) {
      setError('First and last name are required.');
      return;
    }
    setSubmitting(true);
    try {
      const body = {};
      for (const [k, v] of Object.entries(f)) body[k] = k === 'avatar' ? v : String(v || '').trim();
      const data = await api('/api/patrons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      setResult(data);
    } catch (err) {
      setError(
        err.message === 'unreachable'
          ? 'Cannot reach the API server at localhost:4000. Please ensure the backend is running.'
          : err.message || 'Failed to register member.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setF({ firstName: '', middleName: '', lastName: '', email: '', contact: '', contact2: '', addrStreet: '', addrBarangay: '', addrCity: '', addrProvince: '', addrPostal: '', avatar: null });
    setError('');
    setResult(null);
  };

  // Success view with library pass QR
  if (result) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-card via-card to-emerald-500/5 p-6 shadow-card sm:flex-row sm:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                Registration Successful
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {result.name} is a member
            </h1>
            <p className="font-mono text-xs text-muted-foreground">
              {result.code} · print the pass once for their library card
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="rounded-xl"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Library Pass
            </Button>
            <Button
              variant="outline"
              onClick={resetForm}
              className="rounded-xl"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add Another
            </Button>
            <Button
              onClick={() => navigate('/patrons')}
              className="rounded-xl shadow-primary-sm"
            >
              <Users className="mr-2 h-4 w-4" />
              View Members
            </Button>
          </div>
        </div>

        <Card className="mx-auto flex max-w-sm flex-col items-center border-border/70 p-6 text-center">
          {result.avatar ? (
            <img src={result.avatar} alt={`${result.name} photo`} className="h-32 w-32 rounded-full border-2 border-border/80 object-cover" />
          ) : (
            <Cover title={result.name} size="lg" />
          )}
          <h3 className="mt-3 font-semibold text-foreground">{result.name}</h3>
          <p className="font-mono text-xs text-muted-foreground">{result.code}</p>
          <img
            src={`${API_BASE}/api/qr/${result.code}`}
            alt={`Library card QR for ${result.name}`}
            className="mt-4 h-48 w-48 rounded-2xl border border-border/80 bg-white object-contain p-2"
          />
          <p className="mt-2 font-mono text-xs font-bold text-foreground">{result.code}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-border/70 bg-gradient-to-r from-card via-card to-primary/5 p-6 shadow-card sm:flex-row sm:items-center">
        <div>
          <button
            onClick={() => navigate('/patrons')}
            className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Library Members
          </button>
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Borrower Membership Intake
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Add New Member
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Register a borrower and automatically issue their library pass QR code
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="mx-auto max-w-2xl">
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div
                className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-50 p-3.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300"
                role="alert"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
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
                  value={f.firstName}
                  onChange={set('firstName')}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Middle Name
                </label>
                <Input
                  placeholder="e.g. Santos"
                  value={f.middleName}
                  onChange={set('middleName')}
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
                  value={f.lastName}
                  onChange={set('lastName')}
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
                value={f.email}
                onChange={set('email')}
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
                  value={f.contact}
                  onChange={set('contact')}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Secondary Contact
                </label>
                <Input
                  placeholder="e.g. +63 900 000 0001"
                  value={f.contact2}
                  onChange={set('contact2')}
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
                value={f.addrStreet}
                onChange={set('addrStreet')}
                className="text-sm"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Barangay
                </label>
                <Input
                  value={f.addrBarangay}
                  onChange={set('addrBarangay')}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  City / Municipality
                </label>
                <Input
                  value={f.addrCity}
                  onChange={set('addrCity')}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Province
                </label>
                <Input
                  value={f.addrProvince}
                  onChange={set('addrProvince')}
                  className="text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Postal Code
                </label>
                <Input
                  value={f.addrPostal}
                  onChange={set('addrPostal')}
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
                  {f.avatar ? (
                    <img src={f.avatar} alt="Member photo preview" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl font-bold text-muted-foreground">?</span>
                  )}
                </div>
                <input type="file" accept="image/*" onChange={pick} className="text-sm file:mr-3 file:rounded-lg file:border file:border-input file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-foreground hover:file:bg-accent focus-visible:rounded-lg focus-visible:ring-2 focus-visible:ring-ring/40" />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 border-t border-border/50 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/patrons')}
                className="rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl shadow-primary-sm"
              >
                {submitting ? 'Registering…' : 'Save Member'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

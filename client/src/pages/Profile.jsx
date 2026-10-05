import { useEffect, useState } from 'react';
import {
  AlertCircle,
  Building,
  Calendar,
  Camera,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Save,
  Shield,
  User,
} from 'lucide-react';
import { api } from '../api.js';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';

const empty = {
  firstName: '',
  middleName: '',
  lastName: '',
  dob: '',
  email: '',
  phone: '',
  addrStreet: '',
  addrBarangay: '',
  addrCity: '',
  addrProvince: '',
  addrPostal: '',
  avatar: null,
};

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

export default function Profile() {
  const [form, setForm] = useState(empty);
  const [role, setRole] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  useEffect(() => {
    api('/api/profile')
      .then((p) => {
        setRole(p.role || '');
        const f = { ...empty };
        for (const key of Object.keys(empty)) {
          if (p[key] !== null && p[key] !== undefined) {
            f[key] = key === 'dob' && p.dob ? String(p.dob).slice(0, 10) : p[key];
          }
        }
        setForm(f);
      })
      .catch((e) => setMsg(e.message === 'unreachable' ? 'Cannot reach the server.' : e.message));
  }, []);

  const pick = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await downscale(file);
      if (dataUrl.length > 50000) {
        setMsg('Picture still too large after shrink.');
        return;
      }
      setForm({ ...form, avatar: dataUrl });
    } catch {
      setMsg('Could not read that image.');
    }
  };

  const save = async () => {
    setMsg('');
    if (!form.firstName || !form.lastName) {
      setMsg('First and last name are required.');
      return;
    }
    setBusy(true);
    try {
      await api('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      localStorage.setItem(
        'staff',
        JSON.stringify({ ...(JSON.parse(localStorage.getItem('staff') || '{}')), avatar: form.avatar || null })
      );
      setBusy(false);
      setMsg('Saved successfully.');
    } catch (e) {
      setBusy(false);
      setMsg(e.message === 'unreachable' ? 'Cannot reach the server.' : e.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-border/70 bg-gradient-to-r from-card via-card to-primary/5 p-6 shadow-card sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Account Management
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Staff Profile
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your municipal circulation desk credentials and personnel records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="neutral" className="uppercase font-semibold text-[11px]">
            {role || 'Desk Staff'}
          </Badge>
        </div>
      </div>

      {msg && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl border p-4 text-xs ${
            msg.includes('success') || msg === 'Saved.'
              ? 'border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-rose-500/40 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
          }`}
        >
          {msg.includes('success') || msg === 'Saved.' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{msg}</span>
        </div>
      )}

      {/* Main Form Grid */}
      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        {/* Left Column: Avatar & Role */}
        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card text-center space-y-4">
          <div className="relative mx-auto h-28 w-28 overflow-hidden rounded-full border-2 border-border/80 bg-muted/40 shadow-subtle flex items-center justify-center">
            {form.avatar ? (
              <img src={form.avatar} alt="Staff avatar preview" className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl font-bold text-muted-foreground">
                {(form.firstName || 'S')[0]?.toUpperCase()}
              </span>
            )}
          </div>

          <div>
            <h3 className="text-base font-bold text-foreground">
              {form.firstName ? `${form.firstName} ${form.lastName}` : 'Staff Member'}
            </h3>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">{form.email || 'No email registered'}</p>
          </div>

          <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-border/80 bg-muted/40 px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted transition-colors shadow-xs">
            <Camera className="mr-2 h-4 w-4 text-muted-foreground" />
            Upload New Photo
            <input type="file" accept="image/*" onChange={pick} className="hidden" />
          </label>
        </div>

        {/* Right Column: Personal & Contact Information */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border/50">
              <Shield className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Identity & Contact</h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">First Name *</label>
                <Input value={form.firstName} onChange={set('firstName')} className="mt-1 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Middle Name</label>
                <Input value={form.middleName} onChange={set('middleName')} className="mt-1 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Last Name *</label>
                <Input value={form.lastName} onChange={set('lastName')} className="mt-1 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Date of Birth</label>
                <Input type="date" value={form.dob} onChange={set('dob')} className="mt-1 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Work Email</label>
                <Input value={form.email} onChange={set('email')} placeholder="staff@stotomas.gov.ph" className="mt-1 text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Phone Number</label>
                <Input value={form.phone} onChange={set('phone')} placeholder="+63 900 000 0000" className="mt-1 text-sm" />
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-border/50">
              <MapPin className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Address Details</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground">Street / House No.</label>
                <Input value={form.addrStreet} onChange={set('addrStreet')} className="mt-1 text-sm" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Barangay</label>
                  <Input value={form.addrBarangay} onChange={set('addrBarangay')} className="mt-1 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">City / Municipality</label>
                  <Input value={form.addrCity} onChange={set('addrCity')} className="mt-1 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Province</label>
                  <Input value={form.addrProvince} onChange={set('addrProvince')} className="mt-1 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">Postal Code</label>
                  <Input value={form.addrPostal} onChange={set('addrPostal')} className="mt-1 text-sm font-mono" />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-border/50">
              <Button onClick={save} disabled={busy} className="rounded-xl shadow-primary-sm">
                <Save className="mr-2 h-4 w-4" />
                {busy ? 'Saving…' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

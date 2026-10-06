import { useState } from 'react';
import { API_BASE } from '../api';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  KeyRound,
  Library,
  Lock,
  Moon,
  Shield,
  ShieldCheck,
  Sun,
  User,
  Users,
} from 'lucide-react';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';

export default function Login({ theme, setTheme }) {
  const [f, setF] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState('');
  const [step, setStep] = useState('pw');
  const [userId, setUserId] = useState(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  const go = async (creds = f) => {
    setBusy(true);
    setErr('');
    let r;
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds),
      });
      r = await res.json();
    } catch {
      setErr('Cannot reach the server — ensure the circulation backend is active.');
      setBusy(false);
      return;
    }
    setBusy(false);

    if (r.totpRequired) {
      setUserId(r.userId);
      setStep('totp');
      return;
    }
    if (r.token) {
      localStorage.setItem('token', r.token);
      localStorage.setItem('staff', JSON.stringify({ username: creds.username, role: r.role || 'staff' }));
      location.href = '/desk';
    } else {
      setErr(r.error || 'Invalid username or password.');
    }
  };

  const goTotp = async () => {
    setBusy(true);
    setErr('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/totp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, code }),
      });
      const r = await res.json();
      setBusy(false);
      if (r.token) {
        localStorage.setItem('token', r.token);
        localStorage.setItem('staff', JSON.stringify({ username: f.username, role: r.role || 'staff' }));
        location.href = '/desk';
      } else {
        setErr('Invalid two-factor authentication code.');
      }
    } catch {
      setBusy(false);
      setErr('Cannot reach the server.');
    }
  };

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[1.2fr_1fr]">
      {/* Left Civic & Archival Brand Panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[#091122] p-10 text-slate-100 lg:flex lg:p-14 border-r border-slate-800/80">
        {/* Subtle Archival Blueprint / Atmospheric Glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.12),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(30,58,138,0.12),transparent_40%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

        {/* Top Header: Official Municipality Seal & Details */}
        <div className="relative z-10 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-gradient-to-b from-amber-500/10 to-blue-500/10 text-amber-300 shadow-inner">
            <Library className="h-6 w-6 stroke-[1.8]" />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-amber-300/80">
              Republic of the Philippines · Province of La Union
            </p>
            <h2 className="text-lg font-bold tracking-tight text-white">
              MUNICIPALITY OF STO. TOMAS
            </h2>
            <p className="text-xs font-medium text-slate-400">
              Public Library & Archival Information Services
            </p>
          </div>
        </div>

        {/* Center Institutional Narrative & Workstation Facets */}
        <div className="relative z-10 my-auto max-w-xl space-y-7 py-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-md border border-slate-700/70 bg-slate-800/60 px-3 py-1 text-[11px] font-medium text-slate-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span>Circulation Workstation · ILMS v2.4</span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-50 sm:text-4xl leading-tight">
              Official Library Circulation & Patron Records Terminal
            </h1>

            <p className="text-sm leading-relaxed text-slate-300">
              Authorized municipal workstation dedicated to the custody, catalog circulation, and community lending management of the Sto. Tomas Public Library.
            </p>
          </div>

          {/* Institutional Workstation Facets */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-xs">
              <BookOpen className="h-4 w-4 text-blue-400 mb-2 stroke-[1.8]" />
              <h3 className="text-xs font-semibold text-slate-200">Optical Circulation</h3>
              <p className="mt-1 text-[11px] text-slate-400 leading-snug">
                Dual patron & accession barcode tracking for instant checkout verification.
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-xs">
              <Users className="h-4 w-4 text-blue-400 mb-2 stroke-[1.8]" />
              <h3 className="text-xs font-semibold text-slate-200">Patron Registry</h3>
              <p className="mt-1 text-[11px] text-slate-400 leading-snug">
                Resident cardholder privileges, lending clearance, and loan history.
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3.5 backdrop-blur-xs">
              <ShieldCheck className="h-4 w-4 text-amber-400 mb-2 stroke-[1.8]" />
              <h3 className="text-xs font-semibold text-slate-200">Secure Audit</h3>
              <p className="mt-1 text-[11px] text-slate-400 leading-snug">
                Role-based staff credentials and audit-logged circulation sessions.
              </p>
            </div>
          </div>

          {/* Municipal Creed Note */}
          <div className="border-l-2 border-amber-400/50 pl-4 py-1">
            <p className="text-xs italic text-slate-300">
              &ldquo;Ang karunungan ay sandigan ng maunlad at mayabong na pamayanan.&rdquo;
            </p>
            <p className="mt-1 text-[10px] font-semibold tracking-wider uppercase text-slate-500">
              Sto. Tomas Municipal Library Charter
            </p>
          </div>
        </div>

        {/* Footer: Legal Notice & Jurisdiction */}
        <div className="relative z-10 border-t border-slate-800/80 pt-4 text-[11px] text-slate-400 space-y-1">
          <p className="font-medium text-slate-300">
            NOTICE OF SYSTEM USE & DATA PRIVACY COMPLIANCE
          </p>
          <p className="text-slate-500 leading-normal">
            This system processes official public library records under Republic Act No. 10173 (Data Privacy Act of 2012). Access is restricted exclusively to authorized library staff and municipal personnel. All transactions are digitally recorded.
          </p>
        </div>
      </div>

      {/* Right Staff Authentication Panel */}
      <div className="relative flex flex-col justify-between bg-background p-6 sm:p-12 lg:p-14">
        {/* Top Header bar with Theme Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
              <Library className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">STO. TOMAS PUBLIC LIBRARY</p>
              <p className="text-[10px] text-muted-foreground">Circulation Desk Terminal</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
          </button>
        </div>

        {/* Center Login Form Container */}
        <div className="mx-auto my-auto w-full max-w-sm py-8 space-y-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 rounded border border-border/80 bg-muted/60 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <Shield className="h-3 w-3 text-primary" />
              Staff Authentication
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Sign in to Workstation
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Enter your assigned municipal staff credentials to open the circulation console.
            </p>
          </div>

          {err && (
            <div className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-semibold">Authentication Notice</p>
                <p className="text-destructive/90">{err}</p>
              </div>
            </div>
          )}

          {step === 'pw' ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                go();
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">
                  Staff Username
                </label>
                <div className="relative">
                  <Input
                    required
                    autoFocus
                    placeholder="e.g. staff1"
                    value={f.username}
                    onChange={(e) => setF({ ...f, username: e.target.value })}
                    className="pl-9 text-sm"
                  />
                  <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80">
                  Password
                </label>
                <div className="relative">
                  <Input
                    required
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter account password"
                    value={f.password}
                    onChange={(e) => setF({ ...f, password: e.target.value })}
                    className="pl-9 pr-9 text-sm"
                  />
                  <Lock className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={busy}
                className="w-full font-semibold shadow-xs"
              >
                {busy ? 'Authenticating…' : 'Authenticate & Enter Terminal'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              {/* Discreet Evaluation Access Helper */}
              <div className="mt-6 rounded-lg border border-dashed border-border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                  <span>Development & Evaluation Mode</span>
                  <span className="font-mono text-[10px] text-muted-foreground/80">TEST DESK</span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => go({ username: 'staff1', password: 'staff123' })}
                  disabled={busy}
                  className="w-full text-xs font-medium border-border/80 hover:bg-muted hover:text-foreground"
                >
                  <KeyRound className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                  Fill & Sign in with test staff account
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-5">
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-center space-y-2">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-6 w-6 stroke-[1.8]" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Two-Factor Authentication</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Security protocol requires code verification for staff ID: <span className="font-medium text-foreground">{f.username}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground/80 block text-center">
                  6-Digit Verification Code
                </label>
                <Input
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="000000"
                  className="text-center font-mono text-xl tracking-[0.35em] h-11"
                  maxLength={6}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') goTotp();
                  }}
                />
                <p className="text-[11px] text-muted-foreground text-center">
                  Enter the time-based code from your configured authenticator app
                </p>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={goTotp}
                  disabled={busy || code.length < 6}
                  className="w-full font-semibold"
                >
                  {busy ? 'Verifying Code…' : 'Confirm & Open Circulation Desk'}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStep('pw');
                    setErr('');
                    setCode('');
                  }}
                  className="w-full text-xs text-muted-foreground hover:text-foreground"
                >
                  Back to credentials
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Sub-footer */}
        <div className="text-center text-[11px] text-muted-foreground">
          Sto. Tomas Municipal Library Management System · All rights reserved
        </div>
      </div>
    </div>
  );
}

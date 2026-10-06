import { useState } from 'react';
import { API_BASE } from '../api';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  KeyRound,
  Library,
  Lock,
  Moon,
  QrCode,
  Shield,
  Sparkles,
  Sun,
  User,
} from 'lucide-react';
import { Cover } from '../cover.jsx';
import { Button } from '../components/ui/button.jsx';
import { Card } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';
import { Badge } from '../components/ui/badge.jsx';

export default function Login({ theme, setTheme }) {
  const [f, setF] = useState({ username: '', password: '' });
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
      setErr('Cannot reach the server — ensure backend is running.');
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

  const featuredBooks = ['Dune', 'The Hobbit', 'Clean Code', 'El Filibusterismo'];

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.15fr_1fr]">
      {/* Left Brand Banner */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-indigo-800 p-10 text-white lg:flex lg:p-14">
        {/* Subtle decorative circles */}
        <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md shadow-inner text-white">
            <Library className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight">STO. TOMAS MUNICIPAL LIBRARY</h2>
            <p className="text-xs text-white/80">Public Library & Automated Circulation System</p>
          </div>
        </div>

        {/* Hero Pitch */}
        <div className="relative my-auto max-w-lg space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            <span>Dual-QR Instant Circulation</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight leading-tight sm:text-5xl">
            Circulate books in seconds, not ledgers.
          </h1>

          <p className="text-sm text-white/85 leading-relaxed">
            Staff scan patron passes and book barcodes with optical precision. Automatic due dates, real-time inventory synchronization, and reading recommendations land on the receipt.
          </p>

          <div className="flex flex-wrap gap-2 pt-2">
            <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-md">
              ⚡ Instant Dual-QR Scan
            </span>
            <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-md">
              📚 Condition & Copy Tracking
            </span>
            <span className="rounded-xl border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-medium backdrop-blur-md">
              🔒 Two-Factor Security
            </span>
          </div>

          {/* Featured Books Mini Carousel */}
          <div className="pt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-white/70 mb-2.5">
              Popular in Circulation
            </p>
            <div className="flex items-center gap-3">
              {featuredBooks.map((t) => (
                <div
                  key={t}
                  className="w-24 shrink-0 rounded-xl border border-white/20 bg-white/10 p-2 text-center backdrop-blur-sm shadow-xs transition-transform duration-200 hover:-translate-y-1"
                >
                  <Cover title={t} size="md" />
                  <span className="mt-1.5 block truncate text-[11px] font-semibold text-white">
                    {t}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative border-t border-white/20 pt-4 text-xs text-white/70">
          Sto. Tomas, La Union · Library Automation Prototype
        </div>
      </div>

      {/* Right Login Form */}
      <div className="relative flex flex-col items-center justify-center bg-background p-6 sm:p-12">
        <button
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          className="absolute right-6 top-6 flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title="Toggle light / dark mode"
        >
          {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
        </button>

        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="inline-flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary mb-1">
              STAFF PORTAL
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Sign in to your desk
            </h2>
            <p className="text-xs text-muted-foreground">
              Enter your credentials to access the circulation console
            </p>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card p-6 shadow-card space-y-4">
            {err && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-50 p-3.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{err}</span>
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
                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Staff Username
                  </label>
                  <div className="relative mt-1">
                    <Input
                      required
                      placeholder="e.g. staff1"
                      value={f.username}
                      onChange={(e) => setF({ ...f, username: e.target.value })}
                      className="pl-9 text-sm"
                    />
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground">
                    Password
                  </label>
                  <div className="relative mt-1">
                    <Input
                      required
                      type="password"
                      placeholder="••••••••"
                      value={f.password}
                      onChange={(e) => setF({ ...f, password: e.target.value })}
                      className="pl-9 text-sm"
                    />
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-xl shadow-primary-sm"
                >
                  {busy ? 'Signing in…' : 'Sign in to Terminal'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                {/* Quick 1-click Test Account Chip */}
                <div className="pt-2 border-t border-border/50">
                  <p className="text-[11px] text-muted-foreground text-center mb-2">
                    Evaluation & Development Mode
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => go({ username: 'staff1', password: 'staff123' })}
                    disabled={busy}
                    className="w-full rounded-xl text-xs hover:border-primary/40 hover:bg-primary/5"
                  >
                    <KeyRound className="mr-2 h-3.5 w-3.5 text-primary" />
                    Quick sign-in with test staff account
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="text-center py-2">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-2">
                    <Shield className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-bold text-foreground">Two-Factor Verification</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>

                <div>
                  <Input
                    autoFocus
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                    className="text-center font-mono text-lg tracking-widest"
                    maxLength={6}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') goTotp();
                    }}
                  />
                </div>

                <Button
                  onClick={goTotp}
                  disabled={busy || code.length < 6}
                  className="w-full rounded-xl shadow-primary-sm"
                >
                  {busy ? 'Verifying…' : 'Confirm & Enter'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

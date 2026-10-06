import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Lock,
  QrCode,
  Shield,
  ShieldCheck,
  ShieldOff,
  Sliders,
} from 'lucide-react';
import { api } from '../api.js';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';

export default function Settings() {
  const [msg, setMsg] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [totp, setTotp] = useState({ enabled: false, qr: '', code: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api('/api/profile')
      .then((p) => {
        setTotp((t) => ({ ...t, enabled: !!p.totpEnabled }));
      })
      .catch(() => {});
  }, []);

  const savePw = async (e) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) {
      setMsg('New passwords do not match.');
      setIsSuccess(false);
      return;
    }
    if (pw.next.length < 6) {
      setMsg('New password must be at least 6 characters.');
      setIsSuccess(false);
      return;
    }
    setBusy(true);
    setMsg('');
    try {
      await api('/api/settings/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current: pw.current, next: pw.next }),
      });
      setPw({ current: '', next: '', confirm: '' });
      setMsg('Password updated successfully.');
      setIsSuccess(true);
      setBusy(false);
    } catch (e) {
      setBusy(false);
      setIsSuccess(false);
      setMsg(
        e.message === 'unreachable'
          ? 'Cannot reach the server.'
          : e.message === 'unauthorized'
          ? 'Session expired.'
          : 'Current password incorrect.'
      );
    }
  };

  const setupTotp = async () => {
    setMsg('');
    try {
      const s = await api('/api/settings/totp/setup', { method: 'POST' });
      setTotp((t) => ({ ...t, qr: s.qr, secret: s.secret }));
    } catch (e) {
      setMsg(e.message);
      setIsSuccess(false);
    }
  };

  const verifyTotp = async () => {
    setMsg('');
    try {
      await api('/api/settings/totp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: totp.code }),
      });
      setTotp({ enabled: true, qr: '', code: '' });
      setMsg('Two-factor authentication enabled successfully.');
      setIsSuccess(true);
    } catch {
      setMsg('Invalid authentication code. Please check your app.');
      setIsSuccess(false);
    }
  };

  const disableTotp = async () => {
    const password = prompt('Enter your password to confirm disabling 2FA:');
    if (!password) return;
    setMsg('');
    try {
      await api('/api/settings/totp/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      setTotp({ enabled: false, qr: '', code: '' });
      setMsg('Two-factor authentication has been disabled.');
      setIsSuccess(true);
    } catch {
      setMsg('Password incorrect. Could not disable 2FA.');
      setIsSuccess(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-border/70 bg-gradient-to-r from-card via-card to-primary/5 p-6 shadow-card sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Security & Preferences
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            System Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage your login password and two-factor authenticator app
          </p>
        </div>
      </div>

      {msg && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl border p-4 text-xs ${
            isSuccess
              ? 'border-emerald-500/40 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-rose-500/40 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          )}
          <span>{msg}</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Password Management Card */}
        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border/50">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Lock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Change Password</h3>
              <p className="text-xs text-muted-foreground">Minimum 6 characters required</p>
            </div>
          </div>

          <form onSubmit={savePw} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Current Password</label>
              <Input
                required
                type="password"
                value={pw.current}
                onChange={(e) => setPw({ ...pw, current: e.target.value })}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">New Password</label>
              <Input
                required
                type="password"
                value={pw.next}
                onChange={(e) => setPw({ ...pw, next: e.target.value })}
                className="mt-1 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Confirm New Password</label>
              <Input
                required
                type="password"
                value={pw.confirm}
                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                className="mt-1 text-sm"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" disabled={busy} className="w-full rounded-xl shadow-primary-sm">
                <KeyRound className="mr-2 h-4 w-4" />
                {busy ? 'Updating…' : 'Update Password'}
              </Button>
            </div>
          </form>
        </div>

        {/* Two-Factor Authentication Card */}
        <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Two-Factor Auth</h3>
                <p className="text-xs text-muted-foreground">Authenticator app verification</p>
              </div>
            </div>
            <Badge variant={totp.enabled ? "success" : "neutral"} >
              {totp.enabled ? "Active" : "Disabled"}
            </Badge>
          </div>

          {!totp.enabled && !totp.qr && (
            <div className="space-y-4 py-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Add an extra layer of security to your library circulation account using Google Authenticator, Microsoft Authenticator, or 1Password.
              </p>
              <Button onClick={setupTotp} variant="outline" className="w-full rounded-xl">
                <ShieldCheck className="mr-2 h-4 w-4 text-emerald-500" />
                Configure Two-Factor Auth
              </Button>
            </div>
          )}

          {!totp.enabled && totp.qr && (
            <div className="space-y-4 text-center">
              <p className="text-xs text-muted-foreground">
                Scan this barcode with your authenticator app, then type the 6-digit confirmation code below:
              </p>
              <div className="inline-block p-2 bg-white rounded-2xl border border-border shadow-xs">
                <img src={totp.qr} alt="2FA QR Code" className="h-40 w-40 object-contain mx-auto" />
              </div>

              <div className="flex items-center gap-2">
                <Input
                  value={totp.code}
                  onChange={(e) => setTotp({ ...totp, code: e.target.value })}
                  placeholder="123456"
                  className="font-mono text-center text-sm"
                  maxLength={6}
                />
                <Button onClick={verifyTotp} className="rounded-xl shadow-primary-sm">
                  Verify & Enable
                </Button>
              </div>
            </div>
          )}

          {totp.enabled && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
                <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <p className="font-bold text-foreground">2FA Protection Enabled</p>
                  <p className="text-muted-foreground mt-0.5">Your staff login requires a time-based verification code.</p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={disableTotp}
                className="w-full rounded-xl text-rose-600 hover:bg-rose-50 hover:border-rose-300 dark:hover:bg-rose-950/40"
              >
                <ShieldOff className="mr-2 h-4 w-4" />
                Disable Two-Factor Auth
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

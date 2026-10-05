import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
const swatches = ['#175E3C', '#f97316', '#5e6ad2', '#0284c7'];
export default function Settings() {
  const [accent, setAccent] = useState(localStorage.getItem('accent') || '');
  const [msg, setMsg] = useState('');
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [totp, setTotp] = useState({ enabled: false, qr: '', code: '' });
  const apply = (a) => { setAccent(a); if (a) document.documentElement.style.setProperty('--primary', a); else document.documentElement.style.removeProperty('--primary'); };
  useEffect(() => {
    api('/api/profile').then((p) => {
      if (p.accent) apply(p.accent);
      setTotp((t) => ({ ...t, enabled: !!p.totpEnabled }));
    }).catch(() => {});
  }, []);
  const saveAccent = async () => {
    try {
      await api('/api/settings/accent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accent: accent || null }) });
      localStorage.setItem('accent', accent);
      setMsg('Appearance saved.');
    } catch (e) { setMsg(e.message); }
  };
  const savePw = async () => {
    if (pw.next !== pw.confirm) { setMsg('New passwords do not match.'); return; }
    try {
      await api('/api/settings/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ current: pw.current, next: pw.next }) });
      setPw({ current: '', next: '', confirm: '' });
      setMsg('Password changed.');
    } catch (e) { setMsg(e.message === 'unreachable' ? 'Cannot reach the server.' : (e.message === 'unauthorized' ? 'Session expired.' : 'Current password wrong.')); }
  };
  const setupTotp = async () => {
    try {
      const s = await api('/api/settings/totp/setup', { method: 'POST' });
      setTotp((t) => ({ ...t, qr: s.qr, secret: s.secret }));
    } catch (e) { setMsg(e.message); }
  };
  const verifyTotp = async () => {
    try {
      await api('/api/settings/totp/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: totp.code }) });
      setTotp({ enabled: true, qr: '', code: '' });
      setMsg('Two-factor enabled.');
    } catch { setMsg('Bad code — try the current one from your app.'); }
  };
  const disableTotp = async () => {
    const password = prompt('Confirm with your current password:');
    if (!password) return;
    try {
      await api('/api/settings/totp/disable', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
      setTotp({ enabled: false, qr: '', code: '' });
      setMsg('Two-factor disabled.');
    } catch { setMsg('Password wrong.'); }
  };
  return (<div>
    <p className="mb-1.5 text-xs text-muted-foreground">Dashboard / Settings</p>
    <div className="mb-5"><h2 className="heading-2">Settings</h2><p className="text-sm text-muted-foreground">Appearance, password, and two-factor sign-in.</p></div>
    {msg && <div className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover mb-4 text-sm">{msg}</div>}
    <div className="grid gap-4 md:grid-cols-2">
      <div className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover"><h3 className="font-semibold">Appearance</h3><p className="text-sm text-muted-foreground">System accent. Applies instantly.</p>
        <div className="mb-3 flex items-center gap-2">
          {swatches.map((s) => <button key={s} title={s} onClick={() => apply(s)} style={{ width: 36, height: 36, borderRadius: '50%', padding: 0, background: s, border: accent === s ? '3px solid var(--ink)' : '1px solid var(--line)' }} />)}
          <input type="color" value={accent || '#175E3C'} onChange={(e) => apply(e.target.value)} style={{ width: 44, height: 36, padding: 2 }} />
        </div>
        <div className="mt-3.5 flex gap-2"><Button onClick={saveAccent}>Save appearance</Button><Button variant="secondary" onClick={async () => { apply(''); localStorage.removeItem('accent'); try { await api('/api/settings/accent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accent: null }) }); } catch {} }}>Reset</Button></div>
      </div>
      <div className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover"><h3 className="font-semibold">Password</h3><p className="text-sm text-muted-foreground">Min 6 characters.</p>
        <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Current</label><Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></div>
        <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">New</label><Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
        <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Confirm new</label><Input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></div>
        <div className="mt-3.5 flex gap-2"><Button onClick={savePw}>Change password</Button></div>
      </div>
    </div>
    <div className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover mt-4"><h3 className="font-semibold">Two-factor authentication</h3>
      <p className="text-sm text-muted-foreground">Status: {totp.enabled ? <Badge variant="success">On</Badge> : <Badge variant="default">Off</Badge>}</p>
      {!totp.enabled && !totp.qr && <div className="mt-3.5 flex gap-2"><Button onClick={setupTotp}>Enable with authenticator app</Button></div>}
      {!totp.enabled && totp.qr && (<div>
        <p className="text-sm text-muted-foreground">Scan with Google/Microsoft Authenticator, then enter the 6-digit code.</p>
        <img src={totp.qr} alt="totp qr" style={{ width: 180, height: 180 }} />
        <div className="mt-2 flex items-center gap-2"><div className="w-40"><Input value={totp.code} onChange={(e) => setTotp({ ...totp, code: e.target.value })} placeholder="123456" /></div><Button onClick={verifyTotp}>Verify</Button></div>
      </div>)}
      {totp.enabled && <div className="mt-3.5 flex gap-2"><Button variant="secondary" onClick={disableTotp}>Disable</Button></div>}
    </div>
  </div>);
}

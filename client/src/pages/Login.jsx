import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Cover } from '../cover.jsx';
import { Button } from '../components/ui/button.jsx';
import { Card } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';
export default function Login({ theme, setTheme }) {
  const [f, setF] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  const [step, setStep] = useState('pw');
  const [userId, setUserId] = useState(null);
  const [code, setCode] = useState('');
  const go = async (creds = f) => {
    setErr('');
    let r;
    try {
      r = await (await fetch('http://localhost:4000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(creds) })).json();
    } catch {
      setErr('Cannot reach the server at localhost:4000 — start it with node server/index.js first.');
      return;
    }
    if (r.totpRequired) { setUserId(r.userId); setStep('totp'); return; }
    if (r.token) { localStorage.setItem('token', r.token); localStorage.setItem('staff', JSON.stringify({ username: creds.username, role: r.role || 'staff' })); location.href = '/desk'; } else setErr(r.error || 'Sign in failed.');
  };
  const goTotp = async () => {
    setErr('');
    try {
      const r = await (await fetch('http://localhost:4000/api/auth/totp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, code }) })).json();
      if (r.token) { localStorage.setItem('token', r.token); localStorage.setItem('staff', JSON.stringify({ username: f.username, role: r.role || 'staff' })); location.href = '/desk'; } else setErr('Bad code — try the current one.');
    } catch { setErr('Cannot reach the server at localhost:4000.'); }
  };
  return (<div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
    <div className="relative flex flex-col justify-center overflow-hidden bg-primary p-14 text-white">
      <div className="relative mx-auto w-full max-w-lg">
        <img className="mb-6 h-24 w-auto" src="/STLU-Logo-PNG-1024x1536.png" alt="Santo Tomas, La Union seal" />
        <div className="text-sm font-bold tracking-[0.25em]">STO.TOMAS<span> LIBRARY</span></div>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight">Borrow in one scan.</h1>
        <p className="mt-3 text-white/80">Staff scan a patron and a book. The loan, the inventory, and the next recommendation land on the receipt — no ledgers, no queues.</p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-[13px] font-medium">Dual-QR checkout</span>
          <span className="rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-[13px] font-medium">Live availability</span>
          <span className="rounded-full border border-white/30 bg-white/10 px-3.5 py-1.5 text-[13px] font-medium">Personal picks</span>
        </div>
        <div className="mt-5 flex gap-3">{['Dune', 'The Hobbit', 'Clean Code', 'El Filibusterismo'].map((t) => <div key={t} className="w-28 shrink-0 rounded-lg border p-2 text-center" style={{background:'rgba(255,255,255,.12)',borderColor:'rgba(255,255,255,.35)'}}><Cover title={t} size="lg" /><span className="mt-1 block text-xs font-medium" style={{color:'#fff'}}>{t}</span></div>)}</div>
      </div>
    </div>
    <div className="relative flex items-center justify-center bg-background p-6">
      <Button variant="ghost" size="icon" className="absolute right-4 top-4" title="Toggle light / dark" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}</Button>
      <Card className="w-full max-w-[380px]">
        <div><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Staff only</p>
        <h2 className="heading-2">Sign in</h2>
        <p className="text-sm text-muted-foreground">Front desk of the Sto. Tomas Municipal Library.</p></div>
        {step === 'pw' ? (<div>
          <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Username</label><Input placeholder="staff1" onChange={(e) => setF({ ...f, username: e.target.value })} /></div>
          <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Password</label><Input type="password" placeholder="••••••••" onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
          <Button className="w-full" onClick={() => go()}>Sign in</Button>
          <div className="mt-2"><Button variant="secondary" className="w-full" onClick={() => go({ username: 'staff1', password: 'staff123' })}>Use test staff account</Button></div>
        </div>) : (<div>
          <p className="text-sm text-muted-foreground">Enter the 6-digit code from your authenticator app.</p>
          <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Code</label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" /></div>
          <Button className="w-full" onClick={goTotp}>Verify</Button>
        </div>)}
        {err && <div className="mt-3 rounded-lg border border-destructive bg-destructive/10 p-2 px-3 text-sm text-destructive">{err}</div>}
      </Card>
    </div>
  </div>);
}

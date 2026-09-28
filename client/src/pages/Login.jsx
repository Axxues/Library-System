import { useState } from 'react';
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
  return (<div className="loginpage">
    <button className="iconbtn logintoggle" title="Toggle light / dark" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? '◐' : '◑'}</button>
    <div className="loginhero">
      <span className="orb orb-a" /><span className="orb orb-b" /><span className="orb orb-c" />
      <div className="qrdeco" aria-hidden="true">
        <span className="finder tl" /><span className="finder tr" /><span className="finder bl" />
        <span className="modules" />
        <span className="laser" />
      </div>
      <div className="hero-inner">
        <img className="hero-logo" src="/STLU-Logo-PNG-1024x1536.png" alt="Santo Tomas, La Union seal" />
        <div className="brand">STO.TOMAS<span> LIBRARY</span></div>
        <h1>Borrow in one scan.</h1>
        <p>Staff scan a patron and a book. The loan, the inventory, and the next recommendation land on the receipt — no ledgers, no queues.</p>
        <div className="recs">
          <span className="rec">Dual-QR checkout</span>
          <span className="rec">Live availability</span>
          <span className="rec">Personal picks</span>
        </div>
      </div>
    </div>
    <div className="loginform">
      <div className="card">
        <p className="eyebrow">Staff only</p>
        <h2>Sign in</h2>
        <p className="desc">Front desk of the Sto. Tomas Municipal Library.</p>
        {step === 'pw' ? (<div>
          <div className="field"><label>Username</label><input placeholder="staff1" onChange={(e) => setF({ ...f, username: e.target.value })} /></div>
          <div className="field"><label>Password</label><input type="password" placeholder="••••••••" onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
          <button onClick={() => go()}>Sign in</button>
          <div style={{ marginTop: 8 }}><button className="secondary" onClick={() => go({ username: 'staff1', password: 'staff123' })}>Use test staff account</button></div>
        </div>) : (<div>
          <p className="desc">Enter the 6-digit code from your authenticator app.</p>
          <div className="field"><label>Code</label><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" /></div>
          <button onClick={goTotp}>Verify</button>
        </div>)}
        {err && <div className="alert">{err}</div>}
      </div>
    </div>
  </div>);
}

import { useState } from 'react';
export default function Login({ theme, setTheme }) {
  const [f, setF] = useState({ username: '', password: '' });
  const go = async (creds = f) => {
    const r = await (await fetch('http://localhost:4000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(creds) })).json();
    if (r.token) { localStorage.setItem('token', r.token); location.href = '/desk'; } else alert(r.error);
  };
  return (<div className="loginpage">
    <div className="loginhero">
      <span className="orb orb-a" /><span className="orb orb-b" /><span className="orb orb-c" />
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
      <button className="iconbtn themetoggle" title="Toggle light / dark" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? '◐' : '◑'}</button>
      <div className="card">
        <p className="eyebrow">Staff only</p>
        <h2>Sign in</h2>
        <p className="desc">Front desk of the Sto. Tomas Municipal Library.</p>
        <div className="field"><label>Username</label><input placeholder="staff1" onChange={(e) => setF({ ...f, username: e.target.value })} /></div>
        <div className="field"><label>Password</label><input type="password" placeholder="••••••••" onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        <button onClick={() => go()}>Sign in</button>
        <div style={{ marginTop: 8 }}><button className="secondary" onClick={() => go({ username: 'staff1', password: 'staff123' })}>Use test staff account</button></div>
      </div>
    </div>
  </div>);
}

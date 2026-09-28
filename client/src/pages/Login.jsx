import { useState } from 'react';
const slipRows = [
  ['Noli Me Tangere', 'Oct 06'],
  ['Clean Code', 'Oct 06'],
  ['Dune', 'Oct 13'],
];
export default function Login({ theme, setTheme }) {
  const [f, setF] = useState({ username: '', password: '' });
  const go = async (creds = f) => {
    const r = await (await fetch('http://localhost:4000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(creds) })).json();
    if (r.token) { localStorage.setItem('token', r.token); location.href = '/desk'; } else alert(r.error);
  };
  return (<div className="loginpage">
    <div className="scanhero">
      <div className="qrdeco" aria-hidden="true">
        <span className="finder tl" /><span className="finder tr" /><span className="finder bl" />
        <span className="modules" />
        <span className="laser" />
      </div>
      <div className="hero-copy">
        <img className="hero-seal" src="/STLU-Logo-PNG-1024x1536.png" alt="Santo Tomas, La Union seal" />
        <p className="kicker">Sto. Tomas Municipal Library</p>
        <h1>Borrow in one scan.</h1>
        <p>Staff scan a patron and a book. The loan, the inventory, and the next recommendation land on the receipt.</p>
      </div>
      <div className="dueslip">
        <p className="slip-head">Date due</p>
        {slipRows.map(([t, d]) => <div key={t} className="slip-row"><span>{t}</span><span className="mono">{d}</span></div>)}
        <span className="stamp">Due Oct 06</span>
      </div>
    </div>
    <div className="loginform">
      <div className="card">
        <p className="eyebrow">Staff only</p>
        <h2>Sign in</h2>
        <p className="desc">Front desk of the Sto. Tomas Municipal Library.</p>
        <div className="field"><label>Username</label><input placeholder="staff1" onChange={(e) => setF({ ...f, username: e.target.value })} /></div>
        <div className="field"><label>Password</label><input type="password" placeholder="••••••••" onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        <button onClick={() => go()}>Sign in</button>
        <div style={{ marginTop: 8 }}><button className="secondary" onClick={() => go({ username: 'staff1', password: 'staff123' })}>Use test staff account</button></div>
      </div>
      <button className="iconbtn modestoggle" title="Toggle light / dark" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>{theme === 'light' ? '◐' : '◑'}</button>
    </div>
  </div>);
}

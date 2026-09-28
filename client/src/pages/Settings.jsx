import { useEffect, useState } from 'react';
import { api } from '../api.js';
const swatches = ['#f97316', '#5e6ad2', '#16a34a', '#0284c7'];
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
    <div className="crumbs">Dashboard / Settings</div>
    <div className="page-head"><h2>Settings</h2><p>Appearance, password, and two-factor sign-in.</p></div>
    {msg && <div className="card" style={{ marginBottom: 16 }}>{msg}</div>}
    <div className="grid two">
      <div className="card"><h3>Appearance</h3><p className="desc">System accent. Applies instantly.</p>
        <div className="row" style={{ marginBottom: 12 }}>
          {swatches.map((s) => <button key={s} title={s} onClick={() => apply(s)} style={{ width: 36, height: 36, borderRadius: '50%', padding: 0, background: s, border: accent === s ? '3px solid var(--ink)' : '1px solid var(--line)' }} />)}
          <input type="color" value={accent || '#f97316'} onChange={(e) => apply(e.target.value)} style={{ width: 44, height: 36, padding: 2 }} />
        </div>
        <div className="actions"><button onClick={saveAccent}>Save appearance</button><button className="secondary" onClick={async () => { apply(''); localStorage.removeItem('accent'); try { await api('/api/settings/accent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accent: null }) }); } catch {} }}>Reset</button></div>
      </div>
      <div className="card"><h3>Password</h3><p className="desc">Min 6 characters.</p>
        <div className="field"><label>Current</label><input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></div>
        <div className="field"><label>New</label><input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
        <div className="field"><label>Confirm new</label><input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></div>
        <div className="actions"><button onClick={savePw}>Change password</button></div>
      </div>
    </div>
    <div className="card" style={{ marginTop: 16 }}><h3>Two-factor authentication</h3>
      <p className="desc">Status: {totp.enabled ? <span className="pill ok">On</span> : <span className="pill">Off</span>}</p>
      {!totp.enabled && !totp.qr && <div className="actions"><button onClick={setupTotp}>Enable with authenticator app</button></div>}
      {!totp.enabled && totp.qr && (<div>
        <p className="desc">Scan with Google/Microsoft Authenticator, then enter the 6-digit code.</p>
        <img src={totp.qr} alt="totp qr" style={{ width: 180, height: 180 }} />
        <div className="row" style={{ marginTop: 8 }}><div className="grow" style={{ maxWidth: 160 }}><input value={totp.code} onChange={(e) => setTotp({ ...totp, code: e.target.value })} placeholder="123456" /></div><button onClick={verifyTotp}>Verify</button></div>
      </div>)}
      {totp.enabled && <div className="actions"><button className="secondary" onClick={disableTotp}>Disable</button></div>}
    </div>
  </div>);
}

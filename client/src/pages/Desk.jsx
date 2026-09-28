import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
function useCamera(set) {
  const v = useRef(null); const c = useRef(null);
  const start = async () => {
    const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    v.current.srcObject = s;
    await v.current.play();
    const tick = () => {
      const cv = c.current; if (!cv) return;
      cv.width = v.current.videoWidth; cv.height = v.current.videoHeight;
      const ctx = cv.getContext('2d'); ctx.drawImage(v.current, 0, 0);
      const d = ctx.getImageData(0, 0, cv.width, cv.height);
      const q = jsQR(d.data, cv.width, cv.height);
      if (q) { set(q.data); s.getTracks().forEach((t) => t.stop()); } else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  return { v, c, start };
}
function ScanBox({ label, code, setCode, cam, hint }) {
  return (<div className="scanbox">
    <div className="field"><label>{label}</label>
      <div className="row"><div className="grow"><input className="mono" value={code} onChange={(e) => setCode(e.target.value)} placeholder={hint} /></div><button className="secondary" onClick={cam.start}>Camera</button></div>
    </div>
    <video ref={cam.v} className="preview" /><canvas ref={cam.c} hidden />
  </div>);
}
const H = () => ({ Authorization: 'Bearer ' + localStorage.getItem('token') });
export default function Desk() {
  const [patronCode, setP] = useState('P-0001');
  const [copyCode, setC] = useState('B-COPY-001');
  const [out, setOut] = useState(null);
  const [stats, setStats] = useState({ books: '—', active: '—', overdue: '—' });
  const cam1 = useCamera(setP); const cam2 = useCamera(setC);
  useEffect(() => {
    Promise.all([
      fetch('http://localhost:4000/api/catalog', { headers: H() }).then((r) => r.json()),
      fetch('http://localhost:4000/api/loans?status=active', { headers: H() }).then((r) => r.json()),
      fetch('http://localhost:4000/api/loans?status=overdue', { headers: H() }).then((r) => r.json()),
    ]).then(([cat, active, overdue]) => setStats({ books: new Set(cat.map((b) => b.id)).size, active: active.length, overdue: overdue.length })).catch(() => {});
  }, []);
  const act = async (action) => {
    const r = await (await fetch('http://localhost:4000/api/circulation', { method: 'POST', headers: { ...H(), 'Content-Type': 'application/json' }, body: JSON.stringify({ patronCode, copyCode, action }) })).json();
    if (r.error) alert(r.error); else setOut(r);
  };
  const tiles = [
    { t: '▤', bg: '#5e6ad2', num: stats.books, lbl: 'Titles in catalog' },
    { t: '≣', bg: '#f97316', num: stats.active, lbl: 'Currently borrowed' },
    { t: '!', bg: '#dc2626', num: stats.overdue, lbl: 'Overdue books' },
  ];
  return (<div>
    <div className="crumbs">Dashboard / Desk</div>
    <div className="page-head"><h2>Front desk</h2><p>Scan or type both QR codes — one request verifies, commits, and recommends.</p></div>
    <div className="grid three" style={{ marginBottom: 16 }}>
      {tiles.map((s) => <div key={s.lbl} className="card stat"><span className="tile" style={{ background: s.bg, color: '#fff' }}>{s.t}</span><span><span className="num">{s.num}</span><br /><span className="lbl">{s.lbl}</span></span></div>)}
    </div>
    <div className="grid two">
      <div className="card"><h3>Scan</h3><p className="desc">Patron first, then the book copy.</p>
        <ScanBox label="Patron QR" code={patronCode} setCode={setP} cam={cam1} hint="P-0001" />
        <ScanBox label="Book copy QR" code={copyCode} setCode={setC} cam={cam2} hint="B-COPY-001" />
        <div className="actions"><button onClick={() => act('checkout')}>Checkout</button><button className="secondary" onClick={() => act('return')}>Return</button></div>
      </div>
      <div className="card"><h3>Receipt</h3>
        {!out && <p className="desc">No transaction yet — checkout or return to print a receipt with recommendations.</p>}
        {out && (<div>
          <div className="receipt-meta"><span className="pill busy">{out.ms}ms</span><span className="subtle mono">{out.loan.checkoutAt ? new Date(out.loan.checkoutAt).toLocaleString() : ''}</span></div>
          <dl className="kv">
            <dt>Patron</dt><dd className="mono">{patronCode}</dd>
            <dt>Copy</dt><dd className="mono">{copyCode}</dd>
            <dt>Due</dt><dd>{out.loan.dueAt ? new Date(out.loan.dueAt).toLocaleDateString() : '—'}</dd>
            <dt>Returned</dt><dd>{out.loan.returnAt ? new Date(out.loan.returnAt).toLocaleString() : 'On loan'}</dd>
          </dl>
          <p className="eyebrow">Recommended for this reader</p>
          <div className="recs">{out.recommendations.map((r) => <span key={r.id} className="rec">{r.title}</span>)}</div>
          <button className="secondary" onClick={() => window.print()}>Print receipt</button>
        </div>)}
      </div>
    </div>
  </div>);
}

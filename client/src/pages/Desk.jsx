import { useRef, useState } from 'react';
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
export default function Desk() {
  const [patronCode, setP] = useState('P-0001');
  const [copyCode, setC] = useState('B-COPY-001');
  const [out, setOut] = useState(null);
  const cam1 = useCamera(setP); const cam2 = useCamera(setC);
  const H = () => ({ 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('token') });
  const act = async (action) => {
    const r = await (await fetch('http://localhost:4000/api/circulation', { method: 'POST', headers: H(), body: JSON.stringify({ patronCode, copyCode, action }) })).json();
    if (r.error) alert(r.error); else setOut(r);
  };
  return (<div style={{ display: 'grid', gap: 16 }}>
    <div className="card"><h3>Circulation — scan or type both codes</h3>
      <input value={patronCode} onChange={(e) => setP(e.target.value)} placeholder="patron P-0001" /> <button className="secondary" onClick={cam1.start}>Camera</button>
      <video ref={cam1.v} style={{ width: 220 }} /><canvas ref={cam1.c} hidden /><br /><br />
      <input value={copyCode} onChange={(e) => setC(e.target.value)} placeholder="copy B-COPY-001" /> <button className="secondary" onClick={cam2.start}>Camera</button>
      <video ref={cam2.v} style={{ width: 220 }} /><canvas ref={cam2.c} hidden /><br /><br />
      <button onClick={() => act('checkout')}>Checkout</button> <button className="secondary" onClick={() => act('return')}>Return</button>
    </div>
    {out && <div className="card"><h4>Receipt ({out.ms}ms)</h4><pre>{JSON.stringify(out.loan, null, 2)}</pre><p>Recommendations: {out.recommendations.join(', ')}</p><button onClick={() => window.print()}>Print</button></div>}
  </div>);
}

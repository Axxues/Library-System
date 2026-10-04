import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { api } from '../api.js';
function useCamera(set) {
  const v = useRef(null); const c = useRef(null);
  const [denied, setDenied] = useState(false);
  const stop = () => {
    const el = v.current;
    if (el && el.srcObject) { el.srcObject.getTracks().forEach((t) => t.stop()); el.srcObject = null; }
  };
  const start = async () => {
    setDenied(false);
    let s;
    try {
      s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    } catch {
      setDenied(true);
      return;
    }
    v.current.srcObject = s;
    await v.current.play();
    const tick = () => {
      const cv = c.current; const el = v.current; if (!cv || !el || !el.srcObject) return;
      cv.width = el.videoWidth; cv.height = el.videoHeight;
      const ctx = cv.getContext('2d'); ctx.drawImage(el, 0, 0);
      const d = ctx.getImageData(0, 0, cv.width, cv.height);
      const q = jsQR(d.data, cv.width, cv.height);
      if (q) { set(q.data); stop(); } else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  return { v, c, start, stop, denied };
}
function ScanBox({ label, code, setCode, cam, hint }) {
  return (<div className="scanbox">
    <div className="field"><label>{label}</label>
      <div className="row"><div className="grow"><input className="mono" value={code} onChange={(e) => setCode(e.target.value)} placeholder={hint} /></div><button className="secondary" onClick={cam.start} type="button">Camera</button></div>
    </div>
    {cam.denied && <p className="desc">Camera unavailable — type the code instead.</p>}
  </div>);
}
const STEPS = ['Patron', 'Book', 'Confirm'];
export default function Scan() {
  const [step, setStep] = useState(0);
  const [camActive, setCamActive] = useState(false);
  const [patronCode, setP] = useState('P-0001');
  const [copyCode, setC] = useState('B-COPY-001');
  const [out, setOut] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const cam1 = useCamera(setP); const cam2 = useCamera(setC);
  useEffect(() => () => { cam1.stop(); cam2.stop(); }, []);
  const act = async (action) => {
    setBusy(true); setErr('');
    let r;
    try {
      r = await api('/api/circulation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patronCode, copyCode, action }) });
    } catch (e) {
      setErr(e.message === 'unreachable' ? 'Cannot reach the server at localhost:4000.' : e.message);
      setBusy(false);
      return;
    }
    setBusy(false);
    if (r.error) setErr(r.error); else setOut({ ...r, action });
  };
  const stopCams = () => { cam1.stop(); cam2.stop(); setCamActive(false); };
  const next = () => { stopCams(); setOut(null); setErr(''); setStep((s) => Math.min(2, s + 1)); };
  const back = () => { stopCams(); setErr(''); setStep((s) => Math.max(0, s - 1)); };
  const restart = () => { stopCams(); setOut(null); setErr(''); setC(''); setStep(1); };
  const cam = step === 0 ? cam1 : cam2;
  const gated = (c) => ({ ...c, start: () => { setCamActive(true); c.start(); } });
  const due = out?.loan?.dueAt ? new Date(out.loan.dueAt).toLocaleDateString() : '—';
  return (<div className="scanwrap">
    <div className="crumbs">Dashboard / Scan</div>
    <div className="page-head"><h2>Scan and circulate</h2><p>One scan at a time — patron first, then the book.</p></div>
    <ol className="scansteps">
      {STEPS.map((s, i) => (
        <li key={s} className={i === step ? 'now' : i < step ? 'done' : ''} aria-current={i === step ? 'step' : undefined}>
          <span className="dot">{i < step ? '✓' : i + 1}</span> {s}
        </li>
      ))}
    </ol>
    <div className="scanlayout"><div className="scanslip">
    {step === 0 && (<div className="card"><h3>Who is borrowing?</h3><p className="desc">Scan the patron QR or type the code.</p>
      <ScanBox label="Patron QR" code={patronCode} setCode={setP} cam={gated(cam1)} hint="P-0001" />
      <div className="actions"><span className="grow" /><button onClick={next} disabled={!patronCode.trim()} type="button">Continue</button></div>
    </div>)}
    {step === 1 && (<div className="card"><h3>Which copy?</h3><p className="desc">Scan the book copy QR.</p>
      <p className="chip">Patron <span className="mono">{patronCode}</span> <button className="linklike" onClick={() => { cam2.stop(); setCamActive(false); setStep(0); }} type="button">Change</button></p>
      <ScanBox label="Book copy QR" code={copyCode} setCode={setC} cam={gated(cam2)} hint="B-COPY-001" />
      <div className="actions"><button className="secondary" onClick={back} type="button">Back</button><span className="grow" /><button onClick={next} disabled={!copyCode.trim()} type="button">Review</button></div>
    </div>)}
    {step === 2 && !out && (<div className="card"><h3>Confirm loan</h3><p className="desc">Check both codes, then choose what happens.</p>
      <dl className="kv">
        <dt>Patron</dt><dd className="mono">{patronCode}</dd>
        <dt>Copy</dt><dd className="mono">{copyCode}</dd>
      </dl>
      {err && <p className="formerr" role="alert">{err}</p>}
      <div className="actions"><button className="secondary" onClick={back} type="button">Back</button><span className="grow" /><button className="secondary" onClick={() => act('return')} disabled={busy} type="button">Return</button><button onClick={() => act('checkout')} disabled={busy} type="button">{busy ? 'Working…' : 'Checkout'}</button></div>
    </div>)}
    {step === 2 && out && (<div className="card ticket"><h3>{out.action === 'return' ? 'Returned' : 'Checked out'}</h3>
       <div className="receipt-meta"><span className="pill busy">{out.ms}ms</span><span className="subtle mono">{out?.loan?.checkoutAt ? new Date(out.loan.checkoutAt).toLocaleString() : ''}</span></div>
      <dl className="kv">
        <dt>Patron</dt><dd className="mono">{patronCode}</dd>
        <dt>Copy</dt><dd className="mono">{copyCode}</dd>
        <dt>Due</dt><dd>{out?.loan?.dueAt ? new Date(out.loan.dueAt).toLocaleDateString() : '—'}</dd>
        <dt>Returned</dt><dd>{out?.loan?.returnAt ? new Date(out.loan.returnAt).toLocaleString() : 'On loan'}</dd>
      </dl>
      <p className="eyebrow">Recommended for this reader</p>
      <div className="recs">{Array.isArray(out?.recommendations) ? out.recommendations.map((r) => <span key={r.id} className="rec">{r.title}</span>) : null}</div>
      <div className="actions"><button className="secondary" onClick={() => window.print()} type="button">Print receipt</button><span className="grow" /><button onClick={restart} type="button">Scan next book</button></div>
    </div>)}
    </div><aside className="scanvisual">
  <div className="card statuscard">
    <p className="eyebrow">Reading now</p>
    {!patronCode.trim()
      ? <p className="desc">Scan a patron to begin.</p>
      : (<dl className="kv">
        <dt>Patron</dt><dd className="mono">{patronCode}</dd>
        <dt>Copy</dt><dd className="mono">{copyCode || '—'}</dd>
        <dt>Due</dt><dd>{due}</dd>
      </dl>)}
  </div>
  {step < 2 && (
    <div className="camerastage">
      {!camActive && (<><p className="desc">Point the camera at the QR, or type the code.</p><button className="secondary" onClick={() => { setCamActive(true); cam.start(); }} type="button">Start camera</button></>)}
      <video ref={cam.v} className="preview" hidden={!camActive} /><canvas ref={cam.c} hidden />
      {cam.denied && <p className="desc">Camera unavailable — type the code instead.</p>}
    </div>
  )}
</aside></div>
  </div>);
}

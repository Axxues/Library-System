import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { api } from '../api.js';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
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
  return (<div className="rounded-lg border border-border bg-secondary p-3.5">
    <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2"><div className="min-w-0 flex-1"><Input className="font-mono" value={code} onChange={(e) => setCode(e.target.value)} placeholder={hint} /></div><Button variant="secondary" onClick={cam.start} type="button">Camera</Button></div>
    </div>
    {cam.denied && <p className="text-sm text-muted-foreground">Camera unavailable — type the code instead.</p>}
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
  return (<div>
    <p className="mb-1.5 text-xs text-muted-foreground">Dashboard / Scan</p>
    <div className="mb-5"><h2 className="heading-2">Scan and circulate</h2><p className="text-sm text-muted-foreground">One scan at a time — patron first, then the book.</p></div>
    <ol className="mb-4 flex items-center gap-3">
      {STEPS.map((s, i) => (
        <li key={s} className={`flex items-center gap-1.5 text-sm ${i === step ? 'font-semibold text-foreground' : 'text-muted-foreground'}`} aria-current={i === step ? 'step' : undefined}>
          <span className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${i === step ? 'bg-primary text-primary-foreground' : i < step ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>{i < step ? '✓' : i + 1}</span> {s}
        </li>
      ))}
    </ol>
    <div className="grid items-start gap-5 lg:grid-cols-[1.15fr_.85fr]"><div>
    {step === 0 && (<div className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover"><h3 className="font-semibold">Who is borrowing?</h3><p className="text-sm text-muted-foreground">Scan the patron QR or type the code.</p>
      <ScanBox label="Patron QR" code={patronCode} setCode={setP} cam={gated(cam1)} hint="P-0001" />
      <div className="mt-3.5 flex gap-2"><span className="min-w-0 flex-1" /><Button onClick={next} disabled={!patronCode.trim()} type="button">Continue</Button></div>
    </div>)}
    {step === 1 && (<div className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover"><h3 className="font-semibold">Which copy?</h3><p className="text-sm text-muted-foreground">Scan the book copy QR.</p>
      <p className="flex items-center gap-2 text-sm text-muted-foreground">Patron <span className="font-mono text-xs text-foreground">{patronCode}</span> <button className="text-sm text-primary underline-offset-4 hover:underline" onClick={() => { cam2.stop(); setCamActive(false); setStep(0); }} type="button">Change</button></p>
      <ScanBox label="Book copy QR" code={copyCode} setCode={setC} cam={gated(cam2)} hint="B-COPY-001" />
      <div className="mt-3.5 flex gap-2"><Button variant="secondary" onClick={back} type="button">Back</Button><span className="min-w-0 flex-1" /><Button onClick={next} disabled={!copyCode.trim()} type="button">Review</Button></div>
    </div>)}
    {step === 2 && !out && (<div className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover"><h3 className="font-semibold">Confirm loan</h3><p className="text-sm text-muted-foreground">Check both codes, then choose what happens.</p>
      <dl className="my-3 grid grid-cols-[130px_1fr] gap-x-3 gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">Patron</dt><dd className="font-mono text-xs">{patronCode}</dd>
        <dt className="text-muted-foreground">Copy</dt><dd className="font-mono text-xs">{copyCode}</dd>
      </dl>
      {err && <p className="mt-3 rounded-lg border border-destructive bg-destructive/10 p-2 px-3 text-sm text-destructive" role="alert">{err}</p>}
      <div className="mt-3.5 flex gap-2"><Button variant="secondary" onClick={back} type="button">Back</Button><span className="min-w-0 flex-1" /><Button variant="secondary" onClick={() => act('return')} disabled={busy} type="button">Return</Button><Button onClick={() => act('checkout')} disabled={busy} type="button">{busy ? 'Working…' : 'Checkout'}</Button></div>
    </div>)}
    {step === 2 && out && (<div className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover"><h3 className="font-semibold">{out.action === 'return' ? 'Returned' : 'Checked out'}</h3>
       <div className="flex items-center gap-2"><Badge variant="default">{out.ms}ms</Badge><span className="font-mono text-xs text-muted-foreground">{out?.loan?.checkoutAt ? new Date(out.loan.checkoutAt).toLocaleString() : ''}</span></div>
      <dl className="my-3 grid grid-cols-[130px_1fr] gap-x-3 gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">Patron</dt><dd className="font-mono text-xs">{patronCode}</dd>
        <dt className="text-muted-foreground">Copy</dt><dd className="font-mono text-xs">{copyCode}</dd>
        <dt className="text-muted-foreground">Due</dt><dd>{out?.loan?.dueAt ? new Date(out.loan.dueAt).toLocaleDateString() : '—'}</dd>
        <dt className="text-muted-foreground">Returned</dt><dd>{out?.loan?.returnAt ? new Date(out.loan.returnAt).toLocaleString() : 'On loan'}</dd>
      </dl>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recommended for this reader</p>
      <div className="mt-2 flex flex-wrap gap-2">{Array.isArray(out?.recommendations) ? out.recommendations.map((r) => <span key={r.id} className="rounded-full border border-input bg-secondary px-3.5 py-1.5 text-[13px] font-medium">{r.title}</span>) : null}</div>
      <div className="mt-3.5 flex gap-2"><Button variant="secondary" onClick={() => window.print()} type="button">Print receipt</Button><span className="min-w-0 flex-1" /><Button onClick={restart} type="button">Scan next book</Button></div>
    </div>)}
    </div><aside className="grid content-start gap-4">
  <div className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover">
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reading now</p>
    {!patronCode.trim()
      ? <p className="mt-2 text-sm text-muted-foreground">Scan a patron to begin.</p>
      : (<dl className="my-3 grid grid-cols-[130px_1fr] gap-x-3 gap-y-1.5 text-sm">
        <dt className="text-muted-foreground">Patron</dt><dd className="font-mono text-xs">{patronCode}</dd>
        <dt className="text-muted-foreground">Copy</dt><dd className="font-mono text-xs">{copyCode || '—'}</dd>
        <dt className="text-muted-foreground">Due</dt><dd>{due}</dd>
      </dl>)}
  </div>
  {step < 2 && (
    <div className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover">
      {!camActive && (<><p className="text-sm text-muted-foreground">Point the camera at the QR, or type the code.</p><Button variant="secondary" className="mt-2" onClick={() => { setCamActive(true); cam.start(); }} type="button">Start camera</Button></>)}
      <video ref={cam.v} className="preview mt-2 w-full rounded-lg bg-black" hidden={!camActive} /><canvas ref={cam.c} hidden />
      {cam.denied && <p className="mt-2 text-sm text-muted-foreground">Camera unavailable — type the code instead.</p>}
    </div>
  )}
</aside></div>
  </div>);
}

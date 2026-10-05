import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Camera,
  CameraOff,
  CheckCircle2,
  Clock,
  CornerDownLeft,
  ExternalLink,
  FileText,
  Layers,
  Printer,
  QrCode,
  RotateCcw,
  Sparkles,
  Tag,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { api } from '../api.js';
import { Cover } from '../cover.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';

function useCamera() {
  const v = useRef(null);
  const c = useRef(null);
  const target = useRef(null);
  const [denied, setDenied] = useState(false);
  const [active, setActive] = useState(false);

  const stop = () => {
    const el = v.current;
    if (el && el.srcObject) {
      el.srcObject.getTracks().forEach((t) => t.stop());
      el.srcObject = null;
    }
    setActive(false);
  };

  const start = async (set) => {
    target.current = set;
    setDenied(false);
    let s;
    try {
      s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
    } catch {
      setDenied(true);
      return;
    }
    if (!v.current) return;
    v.current.srcObject = s;
    await v.current.play();
    setActive(true);
    const tick = () => {
      const cv = c.current;
      const el = v.current;
      if (!cv || !el || !el.srcObject) return;
      cv.width = el.videoWidth;
      cv.height = el.videoHeight;
      const ctx = cv.getContext('2d');
      ctx.drawImage(el, 0, 0);
      const d = ctx.getImageData(0, 0, cv.width, cv.height);
      const q = jsQR(d.data, cv.width, cv.height);
      if (q) {
        target.current?.(q.data);
        stop();
      } else {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
  };

  return { v, c, start, stop, denied, active };
}

const STEPS = [
  { id: 'patron', label: '1. Patron Identity', hint: 'Scan membership QR or type patron ID.' },
  { id: 'copy', label: '2. Book Copy Barcode', hint: 'Scan the accession barcode on the book.' },
  { id: 'confirm', label: '3. Authorize Transaction', hint: 'Verify records and choose Checkout or Return.' },
];

export default function Scan() {
  const [step, setStep] = useState(0);
  const [patronCode, setP] = useState('P-0001');
  const [copyCode, setC] = useState('B-COPY-001');
  const [out, setOut] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [dir, setDir] = useState({ patrons: [], catalog: [], recent: [] });
  const cam = useCamera();

  const setForStep = step === 0 ? setP : setC;

  useEffect(() => () => cam.stop(), []);

  useEffect(() => {
    Promise.all([api('/api/catalog'), api('/api/patrons'), api('/api/loans')])
      .then(([cat, pats, loans]) => {
        setDir({
          catalog: Array.isArray(cat) ? cat : [],
          patrons: Array.isArray(pats) ? pats : [],
          recent: Array.isArray(loans) ? loans.slice(0, 5) : [],
        });
      })
      .catch(() => {});
  }, []);

  const patron = dir.patrons.find((x) => x.code === patronCode.trim()) || null;
  const book = dir.catalog.find((x) => x.copyCode === copyCode.trim()) || null;

  const act = async (action) => {
    setBusy(true);
    setErr('');
    let r;
    try {
      r = await api('/api/circulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patronCode, copyCode, action }),
      });
    } catch (e) {
      setErr(e.message === 'unreachable' ? 'Cannot reach the server at localhost:4000.' : e.message);
      setBusy(false);
      return;
    }
    setBusy(false);
    if (r.error) {
      setErr(r.error);
    } else {
      setOut({ ...r, action });
      api('/api/loans').then((loans) => {
        if (Array.isArray(loans)) setDir((d) => ({ ...d, recent: loans.slice(0, 5) }));
      }).catch(() => {});
    }
  };

  const next = () => {
    cam.stop();
    setOut(null);
    setErr('');
    setStep((s) => Math.min(2, s + 1));
  };

  const back = () => {
    cam.stop();
    setErr('');
    setStep((s) => Math.max(0, s - 1));
  };

  const restart = () => {
    cam.stop();
    setOut(null);
    setErr('');
    setC('');
    setStep(1);
  };

  const due = out?.loan?.dueAt
    ? new Date(out.loan.dueAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <div className="space-y-6">
      {/* Station Command Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-border/70 bg-gradient-to-r from-card via-card to-primary/5 p-6 shadow-card sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
              Dual-QR Station · Console 01
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Circulation Scanner Terminal
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Automated Dual-QR optical scan station for borrower cards and book barcodes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={cam.active ? "success" : "neutral"} statusDot={true}>
            {cam.active ? "Optical Sensor Active" : "Scanner Ready"}
          </Badge>
        </div>
      </div>

      {/* 3-Stage Connected Workflow Breadcrumb */}
      <div className="grid gap-3 sm:grid-cols-3">
        {STEPS.map((s, idx) => {
          const isActive = idx === step;
          const isDone = idx < step;
          return (
            <div
              key={s.id}
              onClick={() => {
                if (idx < step) {
                  cam.stop();
                  setStep(idx);
                }
              }}
              className={`flex items-center gap-3 rounded-2xl border p-4 transition-all duration-150 ${
                idx < step ? 'cursor-pointer hover:bg-muted/40' : ''
              } ${
                isActive
                  ? 'border-primary/60 bg-primary/5 shadow-xs'
                  : isDone
                  ? 'border-border/80 bg-card'
                  : 'border-border/40 bg-card/40 opacity-70'
              }`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-primary-sm'
                    : isDone
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {isDone ? '✓' : idx + 1}
              </span>
              <div className="min-w-0">
                <p className={`text-xs font-bold ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {s.label}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">{s.hint}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Split Console Grid */}
      <div className="grid items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Left Console: Viewfinder + Input */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <QrCode className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {step === 0 ? "Identify Patron" : step === 1 ? "Identify Book Copy" : "Authorize Transaction"}
                  </h3>
                  <p className="text-xs text-muted-foreground">{STEPS[step].hint}</p>
                </div>
              </div>
              {step > 0 && !out && (
                <Button variant="outline" size="sm" onClick={back} className="text-xs rounded-xl">
                  Back
                </Button>
              )}
            </div>

            {/* Input & Camera Area */}
            {!out && (
              <div className="space-y-4 pt-1">
                {step === 0 && (
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                        <span>Patron Membership Code</span>
                        <span className="text-[11px] font-mono text-muted-foreground">Default: P-0001</span>
                      </label>
                      <div className="relative">
                        <Input
                          className="font-mono text-sm pl-9"
                          value={patronCode}
                          onChange={(e) => setP(e.target.value)}
                          placeholder="Type or scan patron QR code…"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && patronCode.trim()) next();
                          }}
                        />
                        <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    {patronCode.trim() && (
                      patron ? (
                        <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
                          <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-sm">
                              {patron.name.trim()[0]}
                            </span>
                            <div>
                              <p className="text-sm font-bold text-foreground">{patron.name}</p>
                              <p className="text-xs font-mono text-muted-foreground">{patron.code} · {patron.role || 'Active Member'}</p>
                            </div>
                          </div>
                          <Badge variant="success" statusDot={true}>Verified</Badge>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-50/60 p-3 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>Unregistered patron code. Check barcode on ID pass.</span>
                        </div>
                      )
                    )}
                  </div>
                )}

                {step === 1 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3.5 py-2 text-xs">
                      <span className="text-muted-foreground">Assigned Borrower:</span>
                      <div className="flex items-center gap-2 font-semibold text-foreground">
                        <span>{patron?.name || patronCode}</span>
                        <button
                          type="button"
                          onClick={() => { cam.stop(); setStep(0); }}
                          className="text-xs text-primary underline hover:text-primary-hover"
                        >
                          Change
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="mb-1.5 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                        <span>Book Accession / Barcode</span>
                        <span className="text-[11px] font-mono text-muted-foreground">Default: B-COPY-001</span>
                      </label>
                      <div className="relative">
                        <Input
                          className="font-mono text-sm pl-9"
                          value={copyCode}
                          onChange={(e) => setC(e.target.value)}
                          placeholder="Type or scan book copy barcode…"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && copyCode.trim()) next();
                          }}
                        />
                        <BookOpen className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    {copyCode.trim() && (
                      book ? (
                        <div className="flex items-center justify-between rounded-2xl border border-blue-500/30 bg-blue-50/50 p-4 dark:bg-blue-950/20">
                          <div className="flex items-center gap-3">
                            <Cover title={book.title} size="md" />
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-foreground truncate">{book.title}</p>
                              <p className="text-xs text-muted-foreground">{book.author} · {book.genre}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Badge variant={book.status === 'Available' ? 'success' : 'default'} statusDot={true}>
                              {book.status}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-50/60 p-3 text-xs text-rose-700 dark:bg-rose-950/30 dark:text-rose-300">
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>Unknown copy barcode. Verify spine label in catalog.</span>
                        </div>
                      )
                    )}
                  </div>
                )}

                {/* Viewfinder Console */}
                {step < 2 && (
                  <div className="overflow-hidden rounded-2xl border border-border/80 bg-muted/20">
                    {!cam.active ? (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
                          <Camera className="h-7 w-7" />
                        </div>
                        <p className="text-sm font-bold text-foreground">
                          Optical Sensor Ready
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                          Align patron ID card or book barcode inside the viewfinder window.
                        </p>
                        <Button
                          onClick={() => cam.start(setForStep)}
                          size="sm"
                          className="mt-4 rounded-xl shadow-primary-sm"
                        >
                          <Camera className="mr-2 h-4 w-4" />
                          Activate Scanner Camera
                        </Button>
                      </div>
                    ) : (
                      <div className="relative aspect-[4/3] w-full bg-black overflow-hidden flex items-center justify-center">
                        <video ref={cam.v} className="h-full w-full object-cover" />
                        {/* Target Crosshair Corners */}
                        <div className="absolute inset-8 pointer-events-none">
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl" />
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr" />
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl" />
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br" />
                          <div className="absolute left-0 right-0 h-0.5 bg-primary/90 shadow-[0_0_12px_hsl(var(--primary))] animate-laser-scan" />
                        </div>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={cam.stop}
                          className="absolute bottom-3 right-3 rounded-xl bg-black/60 text-white backdrop-blur-sm hover:bg-black/80"
                        >
                          <CameraOff className="mr-1.5 h-3.5 w-3.5" />
                          Stop Camera
                        </Button>
                      </div>
                    )}
                    <canvas ref={cam.c} hidden />
                    {cam.denied && (
                      <div className="p-3 text-xs text-muted-foreground text-center border-t border-border/50">
                        Camera access unavailable or denied. Type barcode numbers manually.
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2 Authorization Console */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-border/50">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Borrower Identification
                        </span>
                        <Badge variant="neutral">{patron?.role || 'Member'}</Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-sm">
                          {(patron?.name || 'P')[0]}
                        </span>
                        <div>
                          <p className="text-sm font-bold text-foreground">{patron?.name || '—'}</p>
                          <p className="text-xs font-mono text-muted-foreground">{patronCode}</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-border/50">
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Book Copy Barcode
                        </span>
                        <Badge variant={book?.status === 'Available' ? 'success' : 'default'} statusDot={true}>
                          {book?.status || 'Unknown'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <Cover title={book?.title} size="md" />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground truncate">{book?.title || '—'}</p>
                          <p className="text-xs text-muted-foreground">{book?.author} · {copyCode}</p>
                        </div>
                      </div>
                    </div>

                    {err && (
                      <div className="flex items-center gap-2.5 rounded-2xl border border-rose-500/40 bg-rose-50 p-3.5 text-xs text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{err}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                      <Button
                        variant="secondary"
                        onClick={() => act('return')}
                        disabled={busy}
                        className="flex-1 rounded-xl"
                      >
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Process Return
                      </Button>
                      <Button
                        onClick={() => act('checkout')}
                        disabled={busy}
                        className="flex-1 rounded-xl shadow-primary-sm"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        {busy ? 'Authorizing…' : 'Complete Checkout'}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Continue button for steps 0 and 1 */}
                {step < 2 && (
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={next}
                      disabled={step === 0 ? !patronCode.trim() : !copyCode.trim()}
                      className="rounded-xl shadow-primary-sm"
                    >
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Output Transaction Confirmation Receipt */}
            {out && (
              <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between rounded-2xl border border-emerald-500/40 bg-emerald-50 p-4 dark:bg-emerald-950/30">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    <div>
                      <h4 className="text-base font-bold text-foreground">
                        {out.action === 'return' ? 'Book Return Confirmed' : 'Checkout Authorized'}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Processed at {new Date().toLocaleTimeString()} · Latency {out.ms}ms
                      </p>
                    </div>
                  </div>
                  <Badge variant="success" statusDot={true}>Success</Badge>
                </div>

                <div className="rounded-2xl border border-border/70 bg-card p-4 space-y-2 text-sm">
                  <div className="flex justify-between py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground text-xs">Patron Name</span>
                    <span className="font-semibold text-foreground">{patron?.name || patronCode}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground text-xs">Book Title</span>
                    <span className="font-semibold text-foreground">{book?.title || copyCode}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-border/40">
                    <span className="text-muted-foreground text-xs">Due Date</span>
                    <span className="font-mono font-bold text-primary">{due}</span>
                  </div>
                </div>

                {Array.isArray(out?.recommendations) && out.recommendations.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      Recommended for this Patron
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {out.recommendations.map((r) => (
                        <span
                          key={r.id}
                          className="flex items-center gap-2 rounded-full border border-border/80 bg-muted/40 py-1 pl-1.5 pr-3 text-xs font-medium text-foreground"
                        >
                          <Cover title={r.title} />
                          {r.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => window.print()}
                    className="flex-1 rounded-xl"
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print Receipt
                  </Button>
                  <Button
                    onClick={restart}
                    className="flex-1 rounded-xl shadow-primary-sm"
                  >
                    Scan Next Item
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Console: Dual Smart Dock & Shift Feed */}
        <div className="space-y-6">
          {/* Dual Smart Dock Card */}
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <h3 className="text-sm font-bold text-foreground">Circulation Smart Dock</h3>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="space-y-4">
              {/* Slot 1: Patron Dock */}
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider">Slot 1 · Patron Pass</span>
                  {patron ? <Badge variant="success" statusDot={true}>Active</Badge> : <Badge variant="neutral">Standby</Badge>}
                </div>
                {patron ? (
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xs">
                      {patron.name[0]}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{patron.name}</p>
                      <p className="text-[11px] font-mono text-muted-foreground">{patron.code}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Waiting for patron QR scan…</p>
                )}
              </div>

              {/* Slot 2: Book Copy Dock */}
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold uppercase tracking-wider">Slot 2 · Book Copy</span>
                  {book ? <Badge variant="info" statusDot={true}>Mounted</Badge> : <Badge variant="neutral">Standby</Badge>}
                </div>
                {book ? (
                  <div className="flex items-center gap-3">
                    <Cover title={book.title} size="md" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{book.title}</p>
                      <p className="text-[11px] text-muted-foreground">{book.copyCode} · {book.genre}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">Waiting for copy barcode scan…</p>
                )}
              </div>
            </div>
          </div>

          {/* Shift Circulation Feed */}
          <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <h3 className="text-sm font-bold text-foreground">Shift Activity Feed</h3>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="divide-y divide-border/40">
              {dir.recent.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  No activity processed this shift.
                </p>
              ) : (
                dir.recent.map((l) => (
                  <div key={l.id} className="py-3 first:pt-1 last:pb-1 flex items-center gap-3">
                    <Cover title={l.title} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {l.title || l.copyCode}
                      </p>
                      <p className="text-[11px] font-mono text-muted-foreground">
                        {l.patronCode}
                      </p>
                    </div>
                    {l.returnAt ? (
                      <Badge variant="success" className="text-[10px]" statusDot={true}>Returned</Badge>
                    ) : (
                      <Badge variant="default" className="text-[10px]" statusDot={true}>Loan</Badge>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

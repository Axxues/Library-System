// client/src/pages/Lookup.jsx — public, no login: type ID or camera
import { useState } from 'react';
export default function Lookup() {
  const [code, setCode] = useState('P-0001'); const [out, setOut] = useState(null);
  const go = async () => setOut(await (await fetch(`http://localhost:4000/api/patrons/${code}/recommendations`)).json());
  return (<div>
    <div className="page-head"><p className="eyebrow">Self-service</p><h2>Find my books</h2><p>Type your patron ID or scan your QR — see your loans and personal picks.</p></div>
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="row"><div className="grow"><input className="mono" value={code} onChange={(e) => setCode(e.target.value)} placeholder="P-0001 or scan" /></div><button onClick={go}>View</button></div>
      {out && out.error && <div className="alert">{out.error}</div>}
    </div>
    {out && !out.error && (<div className="grid two">
      <div className="card"><h3>{out.patron.name}</h3><p className="desc mono">{out.patron.code}</p>
        {out.activeLoans.length === 0 && <p className="desc">No books on loan right now.</p>}
        {out.activeLoans.map((l) => <div key={l.id} className="row" style={{ padding: '6px 0', borderTop: '1px solid var(--line)' }}><span className="grow">{l.title}</span><span className="pill busy">Due {l.dueAt ? new Date(l.dueAt).toLocaleDateString() : '—'}</span></div>)}
      </div>
      <div className="card"><h3>Picked for you</h3><p className="desc">Based on what you and similar readers borrow.</p>
        <div className="recs">{out.recommendations.map((r) => <span key={r.id} className="rec">{r.title}</span>)}</div>
      </div>
    </div>)}
  </div>);
}

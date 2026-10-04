// client/src/pages/Lookup.jsx — public, no login: type ID or camera
import { useState } from 'react';
import { Cover } from '../cover.jsx';
import { api } from '../api.js';
export default function Lookup() {
  const [code, setCode] = useState('P-0001'); const [out, setOut] = useState(null);
  const go = async () => {
    try {
      setOut(await api(`/api/patrons/${code}/recommendations`));
    } catch (e) {
      setOut({ error: e.message === 'unreachable' ? 'Cannot reach the server at localhost:4000.' : e.message });
    }
  };
  return (<div>
    <div className="crumbs">Lookup</div>
    <div className="page-head"><h2>Find my books</h2><p>Type your patron ID or scan your QR — see your loans and personal picks.</p></div>
    <div className="card" style={{ marginBottom: 16 }}>
      <div className="row"><div className="grow"><input className="mono" value={code} onChange={(e) => setCode(e.target.value)} placeholder="P-0001 or scan" /></div><button onClick={go}>View</button></div>
      {out && out.error && <div className="alert">{out.error}</div>}
    </div>
    {out && !out.error && (<div className="grid two">
      <div className="card"><div className="loanrow"><Cover title={out.patron.name} size="lg" /><span className="grow"><h3 style={{margin:0}}>{out.patron.name}</h3><span className="subtle mono">{out.patron.code}</span></span></div>
        {out.activeLoans.length === 0 && <p className="desc">No books on loan right now.</p>}
        {out.activeLoans.map((l) => <div key={l.id} className="loanrow"><Cover title={l.title} /><span className="grow">{l.title}</span><span className="stamp busy">Due {l.dueAt ? new Date(l.dueAt).toLocaleDateString() : '—'}</span></div>)}
      </div>
      <div className="card"><h3>Picked for you</h3><p className="desc">Based on what you and similar readers borrow.</p>
        <div className="shelf">{out.recommendations.map((r) => <div key={r.id} className="shelfcard"><Cover title={r.title} size="lg" /><span className="t">{r.title}</span></div>)}</div>
      </div>
    </div>)}
  </div>);
}

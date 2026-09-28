// client/src/pages/Lookup.jsx — public, no login: type ID or camera
import { useState } from 'react';
export default function Lookup() {
  const [code, setCode] = useState('P-0001'); const [out, setOut] = useState(null);
  const go = async () => setOut(await (await fetch(`http://localhost:4000/api/patrons/${code}/recommendations`)).json());
  return (<div className="card"><h3>Patron lookup — my loans + personal recommendations</h3><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="P-0001 or scan" /> <button onClick={go}>View</button>{out && (out.error ? <div className="alert">{out.error}</div> : <div><p>{out.patron.name}</p><pre>{JSON.stringify(out.activeLoans, null, 2)}</pre><p>For you: {out.recommendations.join(', ')}</p></div>)}</div>);
}

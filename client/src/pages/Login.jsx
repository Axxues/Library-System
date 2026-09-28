import { useState } from 'react';
export default function Login() {
  const [f, setF] = useState({ username: '', password: '' });
  const go = async () => {
    const r = await (await fetch('http://localhost:4000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) })).json();
    if (r.token) { localStorage.setItem('token', r.token); location.href = '/desk'; } else alert(r.error);
  };
  return (<div className="card" style={{ maxWidth: 360 }}><h2>Staff login</h2>
    <input placeholder="username" onChange={(e) => setF({ ...f, username: e.target.value })} /><br /><br />
    <input type="password" placeholder="password" onChange={(e) => setF({ ...f, password: e.target.value })} /><br /><br />
    <button onClick={go}>Sign in</button></div>);
}

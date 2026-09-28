import { useEffect, useState } from 'react';
import { api } from '../api.js';
const empty = { firstName: '', middleName: '', lastName: '', dob: '', email: '', phone: '', addrStreet: '', addrBarangay: '', addrCity: '', addrProvince: '', addrPostal: '', avatar: null };
function downscale(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      const s = 128 / Math.max(img.width, img.height);
      c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
export default function Profile() {
  const [form, setForm] = useState(empty);
  const [role, setRole] = useState('');
  const [msg, setMsg] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  useEffect(() => {
    api('/api/profile').then((p) => {
      setRole(p.role || '');
      const f = { ...empty };
      for (const key of Object.keys(empty)) if (p[key] !== null && p[key] !== undefined) f[key] = key === 'dob' && p.dob ? String(p.dob).slice(0, 10) : p[key];
      setForm(f);
    }).catch((e) => setMsg(e.message === 'unreachable' ? 'Cannot reach the server.' : e.message));
  }, []);
  const pick = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const dataUrl = await downscale(file);
      if (dataUrl.length > 50000) { setMsg('Picture still too large after shrink.'); return; }
      setForm({ ...form, avatar: dataUrl });
    } catch { setMsg('Could not read that image.'); }
  };
  const save = async () => {
    setMsg('');
    if (!form.firstName || !form.lastName) { setMsg('First and last name required.'); return; }
    try {
      await api('/api/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      localStorage.setItem('staff', JSON.stringify({ ...(JSON.parse(localStorage.getItem('staff') || '{}')), avatar: form.avatar || null }));
      setMsg('Saved.');
    } catch (e) { setMsg(e.message === 'unreachable' ? 'Cannot reach the server.' : e.message); }
  };
  return (<div>
    <div className="crumbs">Dashboard / Profile</div>
    <div className="page-head"><h2>Profile</h2><p>Your staff details. Role is set by an admin.</p></div>
    <div className="grid two">
      <div className="card"><h3>Photo</h3><p className="desc">Square works best; shrunk to 128px on save.</p>
        <div style={{ marginBottom: 12 }}>{form.avatar ? <img src={form.avatar} alt="preview" style={{ width: 128, height: 128, borderRadius: '50%', objectFit: 'cover' }} /> : <span className="avatar" style={{ width: 64, height: 64, fontSize: 24 }}>?</span>}</div>
        <input type="file" accept="image/*" onChange={pick} />
      </div>
      <div className="card"><h3>Identity</h3>
        <div className="field"><label>First name</label><input value={form.firstName} onChange={set('firstName')} /></div>
        <div className="field"><label>Middle name</label><input value={form.middleName} onChange={set('middleName')} /></div>
        <div className="field"><label>Last name</label><input value={form.lastName} onChange={set('lastName')} /></div>
        <div className="field"><label>Date of birth</label><input type="date" value={form.dob} onChange={set('dob')} /></div>
        <div className="field"><label>Email</label><input value={form.email} onChange={set('email')} /></div>
        <div className="field"><label>Phone</label><input value={form.phone} onChange={set('phone')} /></div>
        <div className="field"><label>Role</label><div><span className="pill busy">{role || '—'}</span></div></div>
      </div>
    </div>
    <div className="card" style={{ marginTop: 16 }}><h3>Address</h3><p className="desc">One value per field.</p>
      <div className="field"><label>Street</label><input value={form.addrStreet} onChange={set('addrStreet')} /></div>
      <div className="grid two">
        <div className="field"><label>Barangay</label><input value={form.addrBarangay} onChange={set('addrBarangay')} /></div>
        <div className="field"><label>City / Municipality</label><input value={form.addrCity} onChange={set('addrCity')} /></div>
        <div className="field"><label>Province</label><input value={form.addrProvince} onChange={set('addrProvince')} /></div>
        <div className="field"><label>Postal code</label><input value={form.addrPostal} onChange={set('addrPostal')} /></div>
      </div>
      <div className="actions"><button onClick={save}>Save profile</button></div>
      {msg && <div className="alert" style={{ borderColor: msg === 'Saved.' ? 'var(--success)' : undefined, color: msg === 'Saved.' ? 'var(--success)' : undefined }}>{msg}</div>}
    </div>
  </div>);
}

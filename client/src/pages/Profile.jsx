import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Input } from '../components/ui/input.jsx';
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
    <p className="mb-1.5 text-xs text-muted-foreground">Dashboard / Profile</p>
    <div className="mb-5"><h2 className="heading-2">Profile</h2><p className="text-sm text-muted-foreground">Your staff details. Role is set by an admin.</p></div>
    <div className="grid gap-4 md:grid-cols-2">
      <div className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover"><h3 className="font-semibold">Photo</h3><p className="text-sm text-muted-foreground">Square works best; shrunk to 128px on save.</p>
        <div className="mb-3">{form.avatar ? <img src={form.avatar} alt="preview" style={{ width: 128, height: 128, borderRadius: '50%', objectFit: 'cover' }} /> : <span className="flex items-center justify-center rounded-full bg-secondary text-muted-foreground" style={{ width: 64, height: 64, fontSize: 24 }}>?</span>}</div>
        <input type="file" accept="image/*" onChange={pick} className="text-sm" />
      </div>
      <div className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover"><h3 className="font-semibold">Identity</h3>
        <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">First name</label><Input value={form.firstName} onChange={set('firstName')} /></div>
        <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Middle name</label><Input value={form.middleName} onChange={set('middleName')} /></div>
        <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Last name</label><Input value={form.lastName} onChange={set('lastName')} /></div>
        <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Date of birth</label><Input type="date" value={form.dob} onChange={set('dob')} /></div>
        <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Email</label><Input value={form.email} onChange={set('email')} /></div>
        <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Phone</label><Input value={form.phone} onChange={set('phone')} /></div>
        <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Role</label><div><Badge variant="default">{role || '—'}</Badge></div></div>
      </div>
    </div>
    <div className="bg-card text-card-foreground rounded-xl border shadow-card p-6 card-hover mt-4"><h3 className="font-semibold">Address</h3><p className="text-sm text-muted-foreground">One value per field.</p>
      <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Street</label><Input value={form.addrStreet} onChange={set('addrStreet')} /></div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Barangay</label><Input value={form.addrBarangay} onChange={set('addrBarangay')} /></div>
        <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">City / Municipality</label><Input value={form.addrCity} onChange={set('addrCity')} /></div>
        <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Province</label><Input value={form.addrProvince} onChange={set('addrProvince')} /></div>
        <div className="mb-3"><label className="mb-1.5 block text-[13px] font-semibold text-muted-foreground">Postal code</label><Input value={form.addrPostal} onChange={set('addrPostal')} /></div>
      </div>
      <div className="mt-3.5 flex gap-2"><Button onClick={save}>Save profile</Button></div>
      {msg && (msg === 'Saved.' ? <Badge variant="success" className="mt-3">Saved</Badge> : <div className="mt-3 rounded-lg border border-destructive bg-destructive/10 p-2 px-3 text-sm text-destructive">{msg}</div>)}
    </div>
  </div>);
}

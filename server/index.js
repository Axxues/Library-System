// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const { authenticator } = require('otplib');
const { getPool } = require('./db');
const { recommend } = require('./recommender');
const app = express();
app.use(cors()); app.use(express.json({ limit: '1mb' })); // ponytail: covers send ~150KB base64 bodies; default 100KB would 413 them
const auth = (req, res, next) => {
  try { req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: 'login required' }); }
};
app.post('/api/auth/login', async (req, res) => {
  const pool = await getPool();
  const r = await pool.request().input('u', req.body.username).query('SELECT * FROM Users WHERE username=@u');
  const u = r.recordset[0];
  if (!u || !(await bcrypt.compare(req.body.password || '', u.hash))) return res.status(401).json({ error: 'bad credentials' });
  if (u.totpEnabled) return res.json({ totpRequired: true, userId: u.id });
  res.json({ token: jwt.sign({ id: u.id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '8h' }), role: u.role });
});
app.get('/api/catalog', auth, async (req, res) => {
  const pool = await getPool();
  const r = await pool.request().query('SELECT b.id, b.title, b.author, b.genre, b.cover, c.copyCode, c.status, c.condition, c.conditionNote FROM Books b LEFT JOIN BookCopies c ON c.bookId=b.id ORDER BY b.title');
  res.json(r.recordset);
});
app.post('/api/catalog', auth, async (req, res) => {
  const { title, author, genre, classification, copies, cover } = req.body || {};
  if (!title || !author || !genre) return res.status(400).json({ error: 'title, author, genre required' });
  if (cover !== undefined && cover !== null && (typeof cover !== 'string' || !cover.startsWith('data:image/') || cover.length > 200000)) return res.status(400).json({ error: 'cover must be an image under ~150KB' });
  const n = Number(copies);
  if (!Number.isInteger(n) || n < 1 || n > 50) return res.status(400).json({ error: 'copies must be 1-50' });
  const pool = await getPool(); const tx = pool.transaction();
  try {
    await tx.begin();
    const b = await tx.request().input('t', title).input('a', author).input('g', genre).input('c', classification || null).input('v', cover || null)
      .query('INSERT INTO Books (title, author, genre, classification, cover) OUTPUT INSERTED.id VALUES (@t,@a,@g,@c,@v)');
    const bookId = b.recordset[0].id;
    const maxR = await tx.request().query("SELECT MAX(CAST(SUBSTRING(copyCode, 8, 10) AS INT)) AS m FROM BookCopies WHERE copyCode LIKE 'B-COPY-%'");
    let next = (maxR.recordset[0].m || 0) + 1;
    const out = [];
    for (let i = 0; i < n; i++) {
      const code = 'B-COPY-' + String(next).padStart(3, '0');
      try {
        await tx.request().input('c', code).input('b', bookId).query('INSERT INTO BookCopies (copyCode, bookId) VALUES (@c,@b)');
      } catch (e) {
        if (e.number === 2627 || e.number === 2601) {
          const retry = await tx.request().query("SELECT MAX(CAST(SUBSTRING(copyCode, 8, 10) AS INT)) AS m FROM BookCopies WHERE copyCode LIKE 'B-COPY-%'");
          next = (retry.recordset[0].m || 0) + 1;
          const code2 = 'B-COPY-' + String(next).padStart(3, '0');
          await tx.request().input('c', code2).input('b', bookId).query('INSERT INTO BookCopies (copyCode, bookId) VALUES (@c,@b)');
          out.push({ copyCode: code2, qrUrl: '/api/qr/' + code2 });
          next++;
          continue;
        }
        throw e;
      }
      out.push({ copyCode: code, qrUrl: '/api/qr/' + code });
      next++;
    }
    await tx.commit();
    res.json({ book: { id: bookId, title, author, genre, classification: classification || null }, copies: out });
  } catch (e) { try { await tx.rollback(); } catch {} res.status(500).json({ error: 'could not allocate copy codes' }); }
});
app.patch('/api/copies/:code/condition', auth, async (req, res) => {
  const { condition, note } = req.body || {};
  if (condition !== 'Good' && condition !== 'Worn' && condition !== 'Damaged') return res.status(400).json({ error: 'condition must be Good, Worn, or Damaged' });
  const cleanNote = typeof note === 'string' && note.trim() ? note.trim() : null;
  if (cleanNote && cleanNote.length > 500) return res.status(400).json({ error: 'note must be 500 characters or less' });
  const pool = await getPool();
  const r = await pool.request().input('c', req.params.code).input('v', condition).input('n', cleanNote).query('UPDATE BookCopies SET condition=@v, conditionNote=@n WHERE copyCode=@c');
  if (r.rowsAffected[0] === 0) return res.status(404).json({ error: 'unknown copy code' });
  res.json({ copyCode: req.params.code, condition, note: cleanNote });
});
app.get('/api/patrons', auth, async (req, res) => {
  const pool = await getPool();
  res.json((await pool.request().query('SELECT * FROM Patrons ORDER BY code')).recordset);
});
app.post('/api/patrons', auth, async (req, res) => {
  const b = req.body || {};
  const trim = (v) => String(v || '').trim() || null;
  const hasParts = !!(b.firstName || b.middleName || b.lastName);
  let name = String(b.name || '').trim();
  if (hasParts) {
    if (!String(b.firstName || '').trim() || !String(b.lastName || '').trim()) return res.status(400).json({ error: 'first and last name required' });
    name = [b.firstName, b.middleName, b.lastName].map((x) => String(x || '').trim()).filter(Boolean).join(' ');
  }
  if (!name) return res.status(400).json({ error: 'name required' });
  if (b.avatar && String(b.avatar).length > 50000) return res.status(400).json({ error: 'picture too large (50KB max)' });
  const pool = await getPool();
  const pad = (n) => 'P-' + String(n).padStart(4, '0');
  const cols = { fn: trim(b.firstName), mn: trim(b.middleName), ln: trim(b.lastName), em: trim(b.email), t: trim(b.contact), t2: trim(b.contact2), st: trim(b.addrStreet), br: trim(b.addrBarangay), ct: trim(b.addrCity), pv: trim(b.addrProvince), pc: trim(b.addrPostal), av: b.avatar || null };
  const insert = (code) => pool.request().input('c', code).input('n', name)
    .input('fn', cols.fn).input('mn', cols.mn).input('ln', cols.ln).input('em', cols.em)
    .input('t', cols.t).input('t2', cols.t2).input('st', cols.st).input('br', cols.br)
    .input('ct', cols.ct).input('pv', cols.pv).input('pc', cols.pc).input('av', cols.av)
    .query('INSERT INTO Patrons (code, name, firstName, middleName, lastName, email, contact, contact2, addrStreet, addrBarangay, addrCity, addrProvince, addrPostal, avatar) OUTPUT INSERTED.* VALUES (@c,@n,@fn,@mn,@ln,@em,@t,@t2,@st,@br,@ct,@pv,@pc,@av)');
  try {
    const maxR = await pool.request().query("SELECT MAX(CAST(SUBSTRING(code, 3, 10) AS INT)) AS m FROM Patrons WHERE code LIKE 'P-%'");
    try {
      return res.json((await insert(pad((maxR.recordset[0].m || 0) + 1))).recordset[0]);
    } catch (e) {
      if (e.number !== 2627 && e.number !== 2601) throw e;
      const retry = await pool.request().query("SELECT MAX(CAST(SUBSTRING(code, 3, 10) AS INT)) AS m FROM Patrons WHERE code LIKE 'P-%'");
      return res.json((await insert(pad((retry.recordset[0].m || 0) + 1))).recordset[0]);
    }
  } catch (e) { res.status(500).json({ error: 'could not register patron' }); }
});
app.put('/api/patrons/:code', auth, async (req, res) => {
  const b = req.body || {};
  const trim = (v) => String(v || '').trim() || null;
  const hasParts = !!(b.firstName || b.middleName || b.lastName);
  let name = String(b.name || '').trim();
  if (hasParts) {
    if (!String(b.firstName || '').trim() || !String(b.lastName || '').trim()) return res.status(400).json({ error: 'first and last name required' });
    name = [b.firstName, b.middleName, b.lastName].map((x) => String(x || '').trim()).filter(Boolean).join(' ');
  }
  if (!name) return res.status(400).json({ error: 'name required' });
  if (b.avatar && String(b.avatar).length > 50000) return res.status(400).json({ error: 'picture too large (50KB max)' });
  const pool = await getPool();
  const r = await pool.request().input('c', req.params.code).input('n', name)
    .input('fn', trim(b.firstName)).input('mn', trim(b.middleName)).input('ln', trim(b.lastName)).input('em', trim(b.email))
    .input('t', trim(b.contact)).input('t2', trim(b.contact2)).input('st', trim(b.addrStreet)).input('br', trim(b.addrBarangay))
    .input('ct', trim(b.addrCity)).input('pv', trim(b.addrProvince)).input('pc', trim(b.addrPostal)).input('av', b.avatar || null)
    .query('UPDATE Patrons SET name=@n, firstName=@fn, middleName=@mn, lastName=@ln, email=@em, contact=@t, contact2=@t2, addrStreet=@st, addrBarangay=@br, addrCity=@ct, addrProvince=@pv, addrPostal=@pc, avatar=@av OUTPUT INSERTED.* WHERE code=@c');
  if (!r.recordset[0]) return res.status(404).json({ error: 'unknown patron' });
  res.json(r.recordset[0]);
});
app.get('/api/loans', auth, async (req, res) => {
  const pool = await getPool();
  const where = req.query.status === 'overdue' ? 'WHERE l.returnAt IS NULL AND l.dueAt < SYSDATETIME()' : req.query.status === 'active' ? 'WHERE l.returnAt IS NULL' : '';
  const r = await pool.request().query(`SELECT l.*, p.code AS patronCode, p.name AS patronName, c.copyCode, b.id AS bookId, b.title, b.genre FROM Loans l JOIN Patrons p ON p.id=l.patronId JOIN BookCopies c ON c.id=l.copyId JOIN Books b ON b.id=c.bookId ${where} ORDER BY l.checkoutAt DESC`);
  res.json(r.recordset);
});
app.get('/api/qr/:code', async (req, res) => {
  res.type('image/png').send(await QRCode.toBuffer(req.params.code));
});
async function buildRecs(tx, patronId, scannedBookId) {
  const cat = (await tx.request().query('SELECT id, author, genre, title FROM Books')).recordset;
  const hist = (await tx.request().input('p', patronId).query('SELECT DISTINCT b.id FROM Loans l JOIN BookCopies c ON c.id=l.copyId JOIN Books b ON b.id=c.bookId WHERE l.patronId=@p')).recordset.map((x) => x.id);
  const co = (await tx.request().input('p', patronId).input('s', scannedBookId).query(`SELECT b2.id AS id, COUNT(*) AS n FROM Loans l1 JOIN Loans l2 ON l1.patronId=l2.patronId AND l1.id<>l2.id JOIN BookCopies c2 ON c2.id=l2.copyId JOIN Books b2 ON b2.id=c2.bookId JOIN BookCopies cs ON cs.id=l1.copyId WHERE l1.patronId<>@p AND cs.bookId=@s GROUP BY b2.id`)).recordset;
  const pop = (await tx.request().query('SELECT b.id AS id, COUNT(l.id) AS n FROM Books b LEFT JOIN BookCopies c ON c.bookId=b.id LEFT JOIN Loans l ON l.copyId=c.id GROUP BY b.id')).recordset;
  const coMap = Object.fromEntries(co.map((x) => [x.id, x.n]));
  const popMap = Object.fromEntries(pop.map((x) => [x.id, x.n]));
  const scanned = cat.find((b) => b.id === scannedBookId) || null;
  return recommend(hist, scanned, cat, coMap, popMap, 5).map((id) => ({ id, title: cat.find((b) => b.id === id).title }));
}
app.post('/api/circulation', auth, async (req, res) => {
  const t0 = Date.now();
  const { patronCode, copyCode, action } = req.body;
  if (action !== 'checkout' && action !== 'return') return res.status(400).json({ error: 'unknown action' });
  const pool = await getPool(); const tx = pool.transaction();
  try {
    await tx.begin();
    const p = (await tx.request().input('c', patronCode).query('SELECT * FROM Patrons WHERE code=@c')).recordset[0];
    if (!p || !p.active) throw new Error('unknown or inactive patron');
    const cp = (await tx.request().input('c', copyCode).query('SELECT c.id, c.copyCode, c.status, c.condition, b.id AS bookId FROM BookCopies c JOIN Books b ON b.id=c.bookId WHERE copyCode=@c')).recordset[0];
    if (!cp) throw new Error('unknown book copy');
    let loan;
    if (action === 'checkout') {
      if (cp.status !== 'Available') throw new Error('copy already borrowed');
      const due = new Date(Date.now() + 7 * 864e5);
      const r = await tx.request().input('p', p.id).input('c', cp.id).input('d', due).query('INSERT INTO Loans (patronId, copyId, dueAt) OUTPUT INSERTED.* VALUES (@p,@c,@d)');
      loan = r.recordset[0];
      await tx.request().input('c', cp.id).query("UPDATE BookCopies SET status='Borrowed' WHERE id=@c");
    } else {
      const r = await tx.request().input('p', p.id).input('c', cp.id).query('SELECT TOP 1 * FROM Loans WHERE patronId=@p AND copyId=@c AND returnAt IS NULL ORDER BY checkoutAt DESC');
      loan = r.recordset[0];
      if (!loan) throw new Error('no active loan for this pair');
      await tx.request().input('id', loan.id).query('UPDATE Loans SET returnAt=SYSDATETIME() WHERE id=@id');
      await tx.request().input('c', cp.id).query("UPDATE BookCopies SET status='Available' WHERE id=@c");
      loan = { ...loan, returnAt: new Date() };
    }
    const recs = await buildRecs(tx, p.id, cp.bookId);
    const ms = Date.now() - t0;
    await tx.request().input('a', action).input('d', `${patronCode}/${copyCode}`).input('m', ms).query('INSERT INTO Logs (action, detail, ms) VALUES (@a,@d,@m)');
    await tx.commit();
    res.json({ loan, recommendations: recs, ms, condition: cp.condition });
  } catch (e) { try { await tx.rollback(); } catch {} res.status(400).json({ error: e.message }); }
});
app.get('/api/patrons/:code/recommendations', async (req, res) => {
  const pool = await getPool(); const tx = pool.transaction();
  try {
    await tx.begin();
    const p = (await tx.request().input('c', req.params.code).query('SELECT * FROM Patrons WHERE code=@c')).recordset[0];
    if (!p) throw new Error('unknown patron');
    const last = (await tx.request().input('p', p.id).query('SELECT TOP 1 b.id AS bookId FROM Loans l JOIN BookCopies c ON c.id=l.copyId JOIN Books b ON b.id=c.bookId WHERE l.patronId=@p ORDER BY l.checkoutAt DESC')).recordset[0];
    const recs = await buildRecs(tx, p.id, last ? last.bookId : null);
    const loans = (await tx.request().input('p', p.id).query('SELECT l.*, c.copyCode, b.title FROM Loans l JOIN BookCopies c ON c.id=l.copyId JOIN Books b ON b.id=c.bookId WHERE l.patronId=@p AND l.returnAt IS NULL')).recordset;
    await tx.commit();
    res.json({ patron: { code: p.code, name: p.name }, activeLoans: loans, recommendations: recs });
  } catch (e) { try { await tx.rollback(); } catch {} res.status(404).json({ error: e.message }); }
});
const PROFILE_COLS = 'id, username, role, firstName, middleName, lastName, dob, email, phone, addrStreet, addrBarangay, addrCity, addrProvince, addrPostal, avatar, totpEnabled, accent';
app.post('/api/settings/password', auth, async (req, res) => {
  const { current, next } = req.body || {};
  if (!next || next.length < 6) return res.status(400).json({ error: 'new password min 6 chars' });
  const pool = await getPool();
  const u = (await pool.request().input('id', req.user.id).query('SELECT hash FROM Users WHERE id=@id')).recordset[0];
  if (!u || !(await bcrypt.compare(current || '', u.hash))) return res.status(400).json({ error: 'current password wrong' });
  const hash = await bcrypt.hash(next, 10);
  await pool.request().input('id', req.user.id).input('h', hash).query('UPDATE Users SET hash=@h WHERE id=@id');
  res.json({ ok: true });
});
app.post('/api/settings/accent', auth, async (req, res) => {
  const { accent } = req.body || {};
  if (accent !== null && accent !== undefined && !/^#[0-9a-fA-F]{6}$/.test(accent)) return res.status(400).json({ error: 'accent must be #rrggbb' });
  const pool = await getPool();
  await pool.request().input('id', req.user.id).input('a', accent || null).query('UPDATE Users SET accent=@a WHERE id=@id');
  res.json({ ok: true });
});
app.get('/api/profile', auth, async (req, res) => {
  const pool = await getPool();
  const r = await pool.request().input('id', req.user.id).query(`SELECT ${PROFILE_COLS} FROM Users WHERE id=@id`);
  res.json(r.recordset[0] || {});
});
app.put('/api/profile', auth, async (req, res) => {
  const b = req.body || {};
  if (!b.firstName || !b.lastName) return res.status(400).json({ error: 'first and last name required' });
  if (b.avatar && b.avatar.length > 50000) return res.status(400).json({ error: 'picture too large (50KB max)' });
  const pool = await getPool();
  await pool.request()
    .input('id', req.user.id).input('fn', b.firstName).input('mn', b.middleName || null)
    .input('ln', b.lastName).input('dob', b.dob || null).input('em', b.email || null)
    .input('ph', b.phone || null).input('st', b.addrStreet || null).input('br', b.addrBarangay || null)
    .input('ct', b.addrCity || null).input('pv', b.addrProvince || null).input('pc', b.addrPostal || null)
    .input('av', b.avatar || null)
    .query('UPDATE Users SET firstName=@fn, middleName=@mn, lastName=@ln, dob=@dob, email=@em, phone=@ph, addrStreet=@st, addrBarangay=@br, addrCity=@ct, addrProvince=@pv, addrPostal=@pc, avatar=@av WHERE id=@id');
  res.json({ ok: true });
});
app.post('/api/settings/totp/setup', auth, async (req, res) => {
  const secret = authenticator.generateSecret();
  const pool = await getPool();
  const u = (await pool.request().input('id', req.user.id).query('SELECT username FROM Users WHERE id=@id')).recordset[0];
  await pool.request().input('id', req.user.id).input('s', secret).query('UPDATE Users SET totpSecret=@s WHERE id=@id');
  const otpauth_url = authenticator.keyuri(u.username, 'StoTomasLibrary', secret);
  res.json({ secret, otpauth_url, qr: await QRCode.toDataURL(otpauth_url) });
});
app.post('/api/settings/totp/verify', auth, async (req, res) => {
  const pool = await getPool();
  const u = (await pool.request().input('id', req.user.id).query('SELECT totpSecret FROM Users WHERE id=@id')).recordset[0];
  if (!u || !u.totpSecret || !authenticator.check((req.body || {}).code || '', u.totpSecret)) return res.status(400).json({ error: 'bad code' });
  await pool.request().input('id', req.user.id).query('UPDATE Users SET totpEnabled=1 WHERE id=@id');
  res.json({ ok: true });
});
app.post('/api/settings/totp/disable', auth, async (req, res) => {
  const pool = await getPool();
  const u = (await pool.request().input('id', req.user.id).query('SELECT hash FROM Users WHERE id=@id')).recordset[0];
  if (!u || !(await bcrypt.compare((req.body || {}).password || '', u.hash))) return res.status(400).json({ error: 'password wrong' });
  await pool.request().input('id', req.user.id).query('UPDATE Users SET totpEnabled=0, totpSecret=NULL WHERE id=@id');
  res.json({ ok: true });
});
app.post('/api/auth/totp', async (req, res) => {
  const { userId, code } = req.body || {};
  const pool = await getPool();
  const u = (await pool.request().input('id', userId).query('SELECT * FROM Users WHERE id=@id')).recordset[0];
  if (!u || !u.totpEnabled || !authenticator.check(code || '', u.totpSecret || '')) return res.status(401).json({ error: 'bad code' });
  res.json({ token: jwt.sign({ id: u.id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '8h' }), role: u.role });
});
app.listen(process.env.PORT || 4000, () => console.log('API on ' + (process.env.PORT || 4000)));

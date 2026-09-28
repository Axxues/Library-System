// server/index.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const { getPool } = require('./db');
const { recommend } = require('./recommender');
const app = express();
app.use(cors()); app.use(express.json());
const auth = (req, res, next) => {
  try { req.user = jwt.verify((req.headers.authorization || '').replace('Bearer ', ''), process.env.JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: 'login required' }); }
};
app.post('/api/auth/login', async (req, res) => {
  const pool = await getPool();
  const r = await pool.request().input('u', req.body.username).query('SELECT * FROM Users WHERE username=@u');
  const u = r.recordset[0];
  if (!u || !(await bcrypt.compare(req.body.password || '', u.hash))) return res.status(401).json({ error: 'bad credentials' });
  res.json({ token: jwt.sign({ id: u.id, role: u.role }, process.env.JWT_SECRET, { expiresIn: '8h' }), role: u.role });
});
app.get('/api/catalog', auth, async (req, res) => {
  const pool = await getPool();
  const r = await pool.request().query('SELECT b.id, b.title, b.author, b.genre, c.copyCode, c.status FROM Books b LEFT JOIN BookCopies c ON c.bookId=b.id ORDER BY b.title');
  res.json(r.recordset);
});
app.get('/api/patrons', auth, async (req, res) => {
  const pool = await getPool();
  res.json((await pool.request().query('SELECT * FROM Patrons ORDER BY code')).recordset);
});
app.get('/api/loans', auth, async (req, res) => {
  const pool = await getPool();
  const where = req.query.status === 'overdue' ? 'WHERE l.returnAt IS NULL AND l.dueAt < SYSDATETIME()' : req.query.status === 'active' ? 'WHERE l.returnAt IS NULL' : '';
  const r = await pool.request().query(`SELECT l.*, p.code AS patronCode, c.copyCode FROM Loans l JOIN Patrons p ON p.id=l.patronId JOIN BookCopies c ON c.id=l.copyId ${where} ORDER BY l.checkoutAt DESC`);
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
    const cp = (await tx.request().input('c', copyCode).query('SELECT c.id, c.copyCode, c.status, b.id AS bookId FROM BookCopies c JOIN Books b ON b.id=c.bookId WHERE copyCode=@c')).recordset[0];
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
    res.json({ loan, recommendations: recs, ms });
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
app.listen(process.env.PORT || 4000, () => console.log('API on ' + (process.env.PORT || 4000)));

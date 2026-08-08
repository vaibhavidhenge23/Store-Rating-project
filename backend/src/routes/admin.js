const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validateName, validateAddress, validatePassword, validateEmail } = require('../utils/validators');

router.use(requireAuth, requireRole('admin'));

const SORTABLE_USER_FIELDS = ['name', 'email', 'address', 'role'];
const SORTABLE_STORE_FIELDS = ['name', 'email', 'address', 'rating'];

router.get('/dashboard', async (req, res) => {
  try {
    const [users, stores, ratings] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM stores'),
      pool.query('SELECT COUNT(*) FROM ratings'),
    ]);
    res.json({
      totalUsers: Number(users.rows[0].count),
      totalStores: Number(stores.rows[0].count),
      totalRatings: Number(ratings.rows[0].count),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/users', async (req, res) => {
  const { name, email, password, address, role } = req.body;

  if (!validateName(name)) return res.status(400).json({ message: 'Name must be between 20 and 60 characters' });
  if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid email' });
  if (!validateAddress(address)) return res.status(400).json({ message: 'Address must be under 400 characters' });
  if (!validatePassword(password)) return res.status(400).json({ message: 'Password must be 8-16 chars with an uppercase letter and a special character' });
  if (!['admin', 'user', 'store_owner'].includes(role)) return res.status(400).json({ message: 'Invalid role' });

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) return res.status(409).json({ message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, address, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, address, role`,
      [name, email, hashed, address, role]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users', async (req, res) => {
  const { name, email, address, role, sortBy = 'name', order = 'asc' } = req.query;
  const sortField = SORTABLE_USER_FIELDS.includes(sortBy) ? sortBy : 'name';
  const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  const conditions = [];
  const values = [];

  if (name) { values.push(`%${name}%`); conditions.push(`name ILIKE $${values.length}`); }
  if (email) { values.push(`%${email}%`); conditions.push(`email ILIKE $${values.length}`); }
  if (address) { values.push(`%${address}%`); conditions.push(`address ILIKE $${values.length}`); }
  if (role) { values.push(role); conditions.push(`role = $${values.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const result = await pool.query(
      `SELECT id, name, email, address, role FROM users ${where} ORDER BY ${sortField} ${sortOrder}`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, address, role FROM users WHERE id = $1', [req.params.id]);
    const user = result.rows[0];
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'store_owner') {
      const ratingResult = await pool.query(
        `SELECT AVG(r.rating) AS avg_rating
         FROM ratings r JOIN stores s ON r.store_id = s.id
         WHERE s.owner_id = $1`,
        [user.id]
      );
      user.rating = ratingResult.rows[0].avg_rating ? Number(ratingResult.rows[0].avg_rating).toFixed(1) : null;
    }

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/stores', async (req, res) => {
  const { name, email, address, ownerId } = req.body;

  if (!validateName(name)) return res.status(400).json({ message: 'Name must be between 20 and 60 characters' });
  if (!validateEmail(email)) return res.status(400).json({ message: 'Invalid email' });
  if (!validateAddress(address)) return res.status(400).json({ message: 'Address must be under 400 characters' });

  try {
    if (ownerId) {
      const owner = await pool.query('SELECT id FROM users WHERE id = $1 AND role = $2', [ownerId, 'store_owner']);
      if (owner.rows.length === 0) return res.status(400).json({ message: 'ownerId must reference a store_owner user' });
    }

    const result = await pool.query(
      `INSERT INTO stores (name, email, address, owner_id) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name, email, address, ownerId || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/stores', async (req, res) => {
  const { name, email, address, sortBy = 'name', order = 'asc' } = req.query;
  const sortField = SORTABLE_STORE_FIELDS.includes(sortBy) ? sortBy : 'name';
  const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  const conditions = [];
  const values = [];

  if (name) { values.push(`%${name}%`); conditions.push(`s.name ILIKE $${values.length}`); }
  if (email) { values.push(`%${email}%`); conditions.push(`s.email ILIKE $${values.length}`); }
  if (address) { values.push(`%${address}%`); conditions.push(`s.address ILIKE $${values.length}`); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const orderColumn = sortField === 'rating' ? 'rating' : `s.${sortField}`;

  try {
    const result = await pool.query(
      `SELECT s.id, s.name, s.email, s.address,
              COALESCE(AVG(r.rating), 0)::numeric(3,1) AS rating
       FROM stores s
       LEFT JOIN ratings r ON r.store_id = s.id
       ${where}
       GROUP BY s.id
       ORDER BY ${orderColumn} ${sortOrder}`,
      values
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

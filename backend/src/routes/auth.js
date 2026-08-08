const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { validateName, validateAddress, validatePassword, validateEmail } = require('../utils/validators');
const { requireAuth } = require('../middleware/auth');

router.post('/signup', async (req, res) => {
  const { name, email, address, password } = req.body;

  if (!validateName(name)) {
    return res.status(400).json({ message: 'Name must be between 20 and 60 characters' });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ message: 'Invalid email' });
  }
  if (!validateAddress(address)) {
    return res.status(400).json({ message: 'Address must be under 400 characters' });
  }
  if (!validatePassword(password)) {
    return res.status(400).json({ message: 'Password must be 8-16 chars with an uppercase letter and a special character' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, address, role)
       VALUES ($1, $2, $3, $4, 'user') RETURNING id, name, email, address, role`,
      [name, email, hashed, address]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1d' });
    res.status(201).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '1d' });
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, address: user.address, role: user.role },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/password', requireAuth, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!validatePassword(newPassword)) {
    return res.status(400).json({ message: 'New password must be 8-16 chars with an uppercase letter and a special character' });
  }

  try {
    const result = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];
    const match = await bcrypt.compare(oldPassword, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Old password is incorrect' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.id]);
    res.json({ message: 'Password updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

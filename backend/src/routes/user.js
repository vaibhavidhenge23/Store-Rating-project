const router = require('express').Router();
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('user'));

router.get('/stores', async (req, res) => {
  const { name, address, sortBy = 'name', order = 'asc' } = req.query;
  const allowedSort = ['name', 'address', 'rating'];
  const sortField = allowedSort.includes(sortBy) ? sortBy : 'name';
  const sortOrder = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  const conditions = [];
  const values = [req.user.id];

  if (name) { values.push(`%${name}%`); conditions.push(`s.name ILIKE $${values.length}`); }
  if (address) { values.push(`%${address}%`); conditions.push(`s.address ILIKE $${values.length}`); }

  const where = conditions.length ? `AND ${conditions.join(' AND ')}` : '';
  const orderColumn = sortField === 'rating' ? 'overall_rating' : `s.${sortField}`;

  try {
    const result = await pool.query(
      `SELECT s.id, s.name, s.address,
              COALESCE(AVG(r.rating), 0)::numeric(3,1) AS overall_rating,
              MAX(CASE WHEN r.user_id = $1 THEN r.rating END) AS my_rating
       FROM stores s
       LEFT JOIN ratings r ON r.store_id = s.id
       WHERE 1=1 ${where}
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

router.post('/ratings/:storeId', async (req, res) => {
  const { rating } = req.body;
  const storeId = req.params.storeId;

  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
  }

  try {
    const store = await pool.query('SELECT id FROM stores WHERE id = $1', [storeId]);
    if (store.rows.length === 0) return res.status(404).json({ message: 'Store not found' });

    const result = await pool.query(
      `INSERT INTO ratings (user_id, store_id, rating)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, store_id)
       DO UPDATE SET rating = $3, updated_at = NOW()
       RETURNING *`,
      [req.user.id, storeId, rating]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

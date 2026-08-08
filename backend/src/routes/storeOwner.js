const router = require('express').Router();
const pool = require('../db/pool');
const { requireAuth, requireRole } = require('../middleware/auth');

router.use(requireAuth, requireRole('store_owner'));

router.get('/dashboard', async (req, res) => {
  try {
    const store = await pool.query('SELECT id, name FROM stores WHERE owner_id = $1', [req.user.id]);
    if (store.rows.length === 0) {
      return res.status(404).json({ message: 'No store linked to this account' });
    }
    const storeId = store.rows[0].id;

    const raters = await pool.query(
      `SELECT u.id, u.name, u.email, r.rating, r.created_at
       FROM ratings r JOIN users u ON r.user_id = u.id
       WHERE r.store_id = $1
       ORDER BY r.created_at DESC`,
      [storeId]
    );

    const avg = await pool.query(
      `SELECT COALESCE(AVG(rating), 0)::numeric(3,1) AS avg_rating FROM ratings WHERE store_id = $1`,
      [storeId]
    );

    res.json({
      store: store.rows[0],
      averageRating: Number(avg.rows[0].avg_rating),
      raters: raters.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

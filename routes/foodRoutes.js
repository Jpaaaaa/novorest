// routes/foodRoutes.js
import express from 'express';
import { addFood, getFoods } from '../controllers/foodController.js';
import { getDB } from '../utils/db.js';

export default function(upload) {
  const router = express.Router();

  // Add new food
  router.post('/foods', upload.single('image'), addFood);

  // Get all foods
  router.get('/foods', getFoods);

// Delete food by ID
router.delete('/foods/:id', async (req, res) => {
  const db = getDB();
  const { id } = req.params;

  try {
    const result = await db.run(`DELETE FROM foods WHERE id = ?`, [id]);
    console.log('🧹 Food delete result:', result);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Food not found or already deleted' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Failed to delete food:', err.message);
    res.status(500).json({ error: 'Failed to delete food' });
  }
});


  // ✅ Get orders (filter by status)
  router.get('/orders', async (req, res) => {
    const db = getDB();
    const { status } = req.query;

    try {
      let query = 'SELECT * FROM orders';
      const params = [];

      if (status) {
        query += ' WHERE status = ?';
        params.push(status);
      }

      query += ' ORDER BY created_at DESC';

      const orders = await db.all(query, params);
      res.json(orders);
    } catch (err) {
      console.error('❌ Failed to fetch orders:', err);
      res.status(500).json({ error: 'Failed to fetch orders' });
    }
  });

  // ✅ PATCH: Update order status (e.g. pending → live → done)
  router.patch('/orders/:id/status', async (req, res) => {
    const db = getDB();
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'live', 'done', 'canceled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    try {
      await db.run(`UPDATE orders SET status = ? WHERE id = ?`, [status, id]);
      res.json({ success: true });
    } catch (err) {
      console.error('❌ Failed to update status:', err);
      res.status(500).json({ error: 'Failed to update order status' });
    }
  });

  // ✅ PATCH: Mark order as paid



  return router;
}

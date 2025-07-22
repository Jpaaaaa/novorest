import express from 'express'
import { getDB } from '../utils/db.js'

const router = express.Router()

// ✅ GET: Orders (with optional ?status filter)
router.get('/orders', async (req, res) => {
  try {
    const db = getDB()
    const { status } = req.query

    let query = 'SELECT * FROM orders'
    const params = []

    if (status) {
      query += ' WHERE status = ?'
      params.push(status)
    }

    query += ' ORDER BY created_at DESC'
    const orders = await db.all(query, params)

    // ✅ Attach order items from order_items table
    for (const order of orders) {
      const items = await db.all('SELECT * FROM order_items WHERE order_id = ?', [order.id])
      order.items = items
    }

    res.json(orders)
  } catch (err) {
    console.error('❌ Error fetching orders:', err)
    res.status(500).json({ error: 'Failed to fetch orders' })
  }
})


// ✅ PATCH: Update order status
router.patch('/orders/:id/status', async (req, res) => {
  const db = getDB()
  const { id } = req.params
  const { status, cancel_reason } = req.body

  try {
    if (!['pending', 'done', 'canceled', 'live'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' })
    }

    const query = cancel_reason
      ? `UPDATE orders SET status = ?, cancel_reason = ? WHERE id = ?`
      : `UPDATE orders SET status = ? WHERE id = ?`

    const values = cancel_reason ? [status, cancel_reason, id] : [status, id]
    await db.run(query, values)
    if (status === 'done') {
  const io = req.app.get('io')
  io.emit('order:done', { id: Number(id), status })
}


    res.status(200).json({ success: true })
  } catch (err) {
    console.error('❌ Failed to update order status:', err)
    res.status(500).json({ error: 'Failed to update order status' })
  }
})

// ✅ POST: Create a new order
router.post('/order', async (req, res) => {
  const db = getDB()
  const { type, items, note, tableNumber, status } = req.body

  try {
    const createdAt = new Date().toISOString()
    const finalStatus = status || 'pending'

   await db.run(
  `INSERT INTO orders (type, items, note, table_number, status, created_at, paid)
   VALUES (?, ?, ?, ?, ?, ?, 0)`,
  [type, items, note, tableNumber || null, finalStatus, createdAt]
)

// 🔥 Emit 'order:new'
const io = req.app.get('io')
io.emit('order:new', { type, status: finalStatus }) // or send full info if needed


    res.status(201).json({ success: true })
  } catch (err) {
    console.error('❌ Failed to create order:', err)
    res.status(500).json({ error: 'Failed to create order' })
  }
})

// ✅ PATCH: Edit existing order (type, note, items)
router.patch('/orders/:id', async (req, res) => {
  const db = getDB()
  const { id } = req.params
  const { items, note, type } = req.body

  try {
    await db.run(
      `UPDATE orders SET items = ?, note = ?, type = ? WHERE id = ?`,
      [items, note, type, id]
    )

    res.status(200).json({ success: true })
  } catch (err) {
    console.error('❌ Failed to edit order:', err)
    res.status(500).json({ error: 'Failed to update order' })
  }
})

// ✅ GET: Paid Orders
router.get('/orders/paid', async (req, res) => {
  try {
    const db = getDB()
    const rows = await db.all(`SELECT * FROM orders WHERE paid = 1 ORDER BY created_at DESC`)
    res.json(rows)
  } catch (err) {
    console.error('❌ Failed to fetch paid orders:', err)
    res.status(500).json({ error: 'Failed to fetch paid orders' })
  }
})

// ✅ GET: Total Paid Revenue
router.get('/orders/paid/total', async (req, res) => {
  try {
    const db = getDB()
    const orders = await db.all(`SELECT items FROM orders WHERE paid = 1`)
    let total = 0

    const foods = await db.all(`SELECT id, price FROM foods`)
    const foodMap = Object.fromEntries(foods.map(f => [f.id, f.price]))

    for (const order of orders) {
      try {
        const parsed = JSON.parse(order.items)
        parsed.forEach(item => {
          const price = foodMap[item.id] || 0
          total += price * item.qty
        })
      } catch (e) {
        console.error('❌ Error parsing order items:', order.items)
      }
    }

    res.json({ total })
  } catch (err) {
    console.error('❌ Failed to calculate total revenue:', err)
    res.status(500).json({ error: 'Failed to calculate total' })
  }
})

import fetch from 'node-fetch' // ✅ Add at the top of the file if not already

// ✅ PATCH: Mark as paid + Auto-print
router.patch('/orders/:id/paid', async (req, res) => {
  try {
    const db = getDB()
    const { id } = req.params

    const result = await db.run(
      `UPDATE orders SET paid = 1, status = 'paid' WHERE id = ?`,
      [id]
    )

    console.log('🧾 DB update result:', result)

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Order not found or already paid' })
    }

    // 🔥 Auto-print logic
    const { print } = req.body
    const order = await db.get(`SELECT * FROM orders WHERE id = ?`, [id])

    if (order && print === true) {
      try {
        await fetch('http://192.168.101.12:8989/print', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(order),
        })
        console.log('🖨️ Order sent to local printer')
      } catch (printErr) {
        console.error('❌ Failed to send to local printer:', printErr)
      }
    } else {
      console.log('📄 Skipped printing')
    }

    res.json({ success: true, id: Number(id), paid: 1 })
  } catch (err) {
    console.error('❌ Failed to mark order as paid or print:', err)
    res.status(500).json({ error: 'Failed to update payment status or print' })
  }
})



// ✅ GET: All pending orders
router.get('/orders/pending', async (req, res) => {
  try {
    const db = getDB()
    const rows = await db.all(`SELECT * FROM orders WHERE status = 'pending' ORDER BY created_at DESC`)
    res.json(rows)
  } catch (err) {
    console.error('❌ Failed to get pending orders:', err)
    res.status(500).json({ error: 'Failed to get pending orders' })
  }
})

// ✅ PATCH: Accept a pending order (mark live)
router.patch('/orders/:id/accept', async (req, res) => {
  try {
    const db = getDB()
    const { id } = req.params

    await db.run(`UPDATE orders SET status = 'live' WHERE id = ?`, [id])
    res.json({ success: true })
  } catch (err) {
    console.error('❌ Failed to accept order:', err)
    res.status(500).json({ error: 'Failed to accept order' })
  }
})

// ✅ DELETE: Remove order by ID
router.delete('/orders/:id', async (req, res) => {
  try {
    const db = getDB()
    const { id } = req.params

    await db.run(`DELETE FROM orders WHERE id = ?`, [id])
    res.json({ success: true })
  } catch (err) {
    console.error('❌ Failed to delete order:', err)
    res.status(500).json({ error: 'Failed to delete order' })
  }
})

// ✅ DELETE: All paid orders
router.delete('/orders/paid/all', async (req, res) => {
  try {
    const db = getDB()
    await db.run(`DELETE FROM orders WHERE paid = 1`)
    res.json({ success: true })
  } catch (err) {
    console.error('❌ Failed to delete all paid orders:', err)
    res.status(500).json({ error: 'Failed to delete all paid orders' })
  }
})


// ✅ NEW: Order status counts (for dashboard badges)
router.get('/orders/counts', async (req, res) => {
  try {
    const db = getDB()

    const [{ count: pending }] = await db.all(`SELECT COUNT(*) AS count FROM orders WHERE status = 'pending'`)
    const [{ count: live }] = await db.all(`SELECT COUNT(*) AS count FROM orders WHERE status = 'live'`)
    const [{ count: finished }] = await db.all(`SELECT COUNT(*) AS count FROM orders WHERE status = 'finished'`)

    res.json({ pending, live, finished })
  } catch (err) {
    console.error('❌ Failed to fetch order counts:', err)
    res.status(500).json({ error: 'Failed to fetch counts' })
  }
})

export default router

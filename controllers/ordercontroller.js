// controllers/orderController.js
import { db } from '../utils/db.js'
import { v4 as uuidv4 } from 'uuid'

export async function createOrder(req, res) {
  try {
    const { type, note, items, tableNumber } = req.body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' })
    }

    const orderId = uuidv4()
    const itemsJson = JSON.stringify(items)

    const timestamp = new Date().toISOString()
    const status = 'pending'

    const result = await db.run(
      `INSERT INTO orders (id, type, note, table_number, items, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderId, type, note, tableNumber, itemsJson, status, timestamp]
    )

    const newOrder = {
      id: orderId,
      type,
      note,
      table_number: tableNumber,
      items: itemsJson,
      status,
      created_at: timestamp
    }

    // Emit to socket clients
    req.app.get('io').emit('newOrder', newOrder)

    res.status(201).json(newOrder)
  } catch (err) {
    console.error('❌ Order creation failed:', err)
    res.status(500).json({ error: 'Failed to create order' })
  }
}

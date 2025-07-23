// routes/print.js (on VPS)
import express from 'express'
import fetch from 'node-fetch' // if not already imported

const router = express.Router()

router.post('/', async (req, res) => {
  const order = req.body

  try {
    // 🔥 Forward the order to your print listener
    const response = await fetch('http://LOCAL_PC_IP:8989/print', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    })

    const result = await response.text()

    res.status(200).json({ success: true, printer: result })
  } catch (err) {
    console.error('❌ Failed to forward to printer:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router

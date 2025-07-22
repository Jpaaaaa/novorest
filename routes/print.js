// routes/print.js
import express from 'express'
import { printOrderReceipt } from '../utils/printerService.js'

const router = express.Router()

router.post('/', async (req, res) => {
  const order = req.body

  try {
    await printOrderReceipt(order)
    res.json({ success: true })
  } catch (err) {
    console.error('❌ Print failed:', err)
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router

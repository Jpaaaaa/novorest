import express from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { getDB } from '../utils/db.js'

const router = express.Router()

const uploadDir = path.join(process.cwd(), 'uploads/expenses')
fs.mkdirSync(uploadDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
})

const upload = multer({ storage })

// ✅ POST expense
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { amount, note } = req.body
    const imagePath = `uploads/expenses/${req.file.filename}`

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    const db = getDB()
    await db.run(
      `INSERT INTO expenses (image_path, amount, note) VALUES (?, ?, ?)`,
      [imagePath, parseFloat(amount), note || null]
    )

    res.status(201).json({ message: 'Expense saved successfully' })
  } catch (err) {
    console.error('❌ Error saving expense:', err)
    res.status(500).json({ error: 'Failed to save expense' })
  }
})

// ✅ GET all expenses
router.get('/', async (req, res) => {
  try {
    const db = getDB()
    const expenses = await db.all(`SELECT * FROM expenses ORDER BY created_at DESC`)
    const total = expenses.reduce((sum, e) => sum + e.amount, 0)
    res.json({ expenses, total })
  } catch (err) {
    console.error('❌ Error fetching expenses:', err)
    res.status(500).json({ error: 'Failed to fetch expenses' })
  }
})


// ✅ FILTER by date & return total
router.get('/filter', async (req, res) => {
  try {
    const { start, end } = req.query
    if (!start || !end) {
      return res.status(400).json({ error: 'Missing start or end date' })
    }

    const db = getDB()
    const expenses = await db.all(
      `SELECT * FROM expenses
       WHERE DATE(created_at) BETWEEN DATE(?) AND DATE(?)
       ORDER BY created_at DESC`,
      [start, end]
    )

    const total = expenses.reduce((sum, e) => sum + e.amount, 0)

    res.json({ expenses, total })
  } catch (err) {
    console.error('❌ Error filtering expenses:', err)
    res.status(500).json({ error: 'Failed to filter expenses' })
  }
})

// ✅ DELETE expense by ID
router.delete('/:id', async (req, res) => {
  try {
    const db = getDB()
    const { id } = req.params

    // 1. Get the expense first to find the image path
    const expense = await db.get('SELECT * FROM expenses WHERE id = ?', [id])
    if (!expense) return res.status(404).json({ error: 'Expense not found' })

    // 2. Delete the image file if it exists
    const fullImagePath = path.join(process.cwd(), expense.image_path)
    if (fs.existsSync(fullImagePath)) {
      fs.unlinkSync(fullImagePath)
    }

    // 3. Delete the expense from DB
    await db.run('DELETE FROM expenses WHERE id = ?', [id])

    res.json({ success: true })
  } catch (err) {
    console.error('❌ Failed to delete expense:', err)
    res.status(500).json({ error: 'Failed to delete expense' })
  }
})



export default router

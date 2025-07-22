import express from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import { getDB } from '../utils/db.js'

const router = express.Router()
const SECRET = 'supersecret123'

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  const db = getDB()

  console.log('🔐 Login attempt:', { username, password })

  const user = await db.get('SELECT * FROM users WHERE username = ?', [username])
  console.log('👤 Fetched from DB:', user)

  if (!user) {
    console.log('❌ User not found')
    return res.status(401).json({ error: 'User not found' })
  }

  const valid = await bcrypt.compare(password, user.password)
  console.log('🔑 Password valid:', valid)

  if (!valid) {
    console.log('❌ Wrong password')
    return res.status(403).json({ error: 'Wrong password' })
  }

  const token = jwt.sign({ id: user.id, role: user.role }, SECRET, { expiresIn: '8h' })
  console.log('✅ Token generated')

  res.json({ token, role: user.role })
})

export default router

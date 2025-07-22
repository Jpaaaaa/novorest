import bcrypt from 'bcrypt'
import { getDB, initDB } from './utils/db.js'

const users = [
  { username: 'admin', password: 'admin123', role: 'admin' },
  { username: 'hall', password: 'hall123', role: 'hall' }
]

async function seed() {
  await initDB()
  const db = getDB()

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 10)
    try {
      await db.run(
        `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
        [user.username, hash, user.role]
      )
      console.log(`✅ Added user: ${user.username}`)
    } catch (e) {
      console.warn(`⚠️ Could not add user ${user.username} (might already exist)`)
    }
  }

  process.exit()
}

seed()

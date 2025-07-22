import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import path from 'path'
import bcrypt from 'bcrypt'

let db

export async function initDB() {
  db = await open({
    filename: path.join(process.cwd(), 'novo.db'),
    driver: sqlite3.Database
  })

  // ✅ Enforce foreign keys (MUST be here, after opening)
  await db.exec(`PRAGMA foreign_keys = ON`)

  // your other table setup...



  // ✅ Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS foods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      price INTEGER,
      image_url TEXT,
      section_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (section_id) REFERENCES sections(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      items TEXT NOT NULL,
      note TEXT,
      table_number TEXT, -- ✅ Now part of the base schema
      status TEXT DEFAULT 'pending',
      cancel_reason TEXT,
      paid BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS expenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_path TEXT,
  amount REAL NOT NULL,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);


    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT CHECK(role IN ('admin', 'hall')) NOT NULL
    );
  `)

  // ✅ Auto-seed admin and hall user if none exist
  const existingUsers = await db.get(`SELECT COUNT(*) as count FROM users`)
  if (existingUsers.count === 0) {
    const adminPassword = await bcrypt.hash('admin123', 10)
    const hallPassword = await bcrypt.hash('hall123', 10)

    await db.run(
      `INSERT INTO users (username, password, role)
       VALUES (?, ?, ?), (?, ?, ?)`,
      ['admin', adminPassword, 'admin', 'hallstaff', hallPassword, 'hall']
    )

    console.log('✅ Admin and hall staff users auto-seeded')
  }

  // ✅ Auto-seed default sections if none exist
  const existingSections = await db.get(`SELECT COUNT(*) as count FROM sections`)
  if (existingSections.count === 0) {
    await db.run(`INSERT INTO sections (name) VALUES ('وجبة'), ('مشروب')`)
    console.log('✅ Default sections seeded: وجبة, مشروب')
  }

  console.log('✅ SQLite DB initialized')
}

export function getDB() {
  return db
}

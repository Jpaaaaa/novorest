// 📁 controllers/sectionController.js
import { getDB } from '../utils/db.js'

// GET all sections
export async function getSections(req, res) {
  try {
    const db = getDB()
    const sections = await db.all('SELECT * FROM sections')
    res.json(sections)
  } catch (err) {
    console.error('❌ Failed to fetch sections:', err)
    res.status(500).json({ error: 'Failed to fetch sections' })
  }
}

// POST new section
export async function addSection(req, res) {
  try {
    const { name } = req.body
    const db = getDB()
    await db.run('INSERT INTO sections (name) VALUES (?)', [name])
    res.status(201).json({ success: true })
  } catch (err) {
    console.error('❌ Failed to add section:', err)
    res.status(500).json({ error: 'Failed to add section' })
  }
}

// ✅ DELETE section (with validation & logging)
export async function deleteSection(req, res) {
  try {
    const { id } = req.params
    const db = getDB()

    // Prevent deletion if foods exist in section
    const linkedFoods = await db.get('SELECT COUNT(*) as count FROM foods WHERE section_id = ?', [id])
    if (linkedFoods.count > 0) {
      return res.status(400).json({ error: 'Cannot delete section with foods inside' })
    }

    const result = await db.run('DELETE FROM sections WHERE id = ?', [id])
    console.log('🧹 Section delete result:', result)

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Section not found or already deleted' })
    }

    res.json({ success: true })
  } catch (err) {
    console.error('❌ Failed to delete section:', err.message)
    res.status(500).json({ error: 'Failed to delete section' })
  }
}


import { getDB } from '../utils/db.js'

// ✅ Add new food
export async function addFood(req, res) {
  try {
    const { name, price, section_id } = req.body
    const image_url = req.file ? `/uploads/${req.file.filename}` : ''
    const db = getDB()

    if (!name || !price || !section_id) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    console.log('🔥 New Food:', { name, price, section_id })

   await db.run(
  `INSERT INTO foods (name, price, image_url, section_id) VALUES (?, ?, ?, ?)`,
  [name, parseInt(price), image_url, parseInt(section_id)]
)


    res.status(201).json({ success: true })
  } catch (err) {
    console.error('❌ Failed to add food:', err)
    res.status(500).json({ error: 'Failed to add food' })
  }
}

// ✅ Get all foods with section names
export async function getFoods(req, res) {
  try {
    const db = getDB()
    const foods = await db.all(`
  SELECT foods.*, sections.name AS section_name
  FROM foods
  LEFT JOIN sections ON foods.section_id = sections.id
  ORDER BY sections.name, foods.created_at DESC
`)

    // Rename section_name to category before sending response
const formattedFoods = foods.map(food => ({
  ...food,
  category: food.section_name
}))

res.json(formattedFoods)

  } catch (err) {
    console.error('❌ Failed to get foods:', err)
    res.status(500).json({ error: 'Failed to fetch foods' })
  }
}

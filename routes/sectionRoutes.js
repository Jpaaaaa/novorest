// 📁 routes/sectionRoutes.js
import express from 'express'
import { getSections, addSection, deleteSection } from '../controllers/sectionController.js'

const router = express.Router()

router.get('/sections', getSections)
router.post('/sections', addSection)
router.delete('/sections/:id', deleteSection) // ✅ NEW

export default router

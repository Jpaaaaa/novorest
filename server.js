// server.js
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import http from 'http'
import { Server as SocketIO } from 'socket.io'

// Routes
import foodRoutes from './routes/foodRoutes.js'
import orderRoutes from './routes/orderRoutes.js'
import authRoutes from './routes/authRoutes.js'
import sectionRoutes from './routes/sectionRoutes.js'
import expensesRoutes from './routes/expenses.js'
import printRoutes from './routes/print.js'


// DB
import { initDB } from './utils/db.js'

const app = express()
const server = http.createServer(app)
const io = new SocketIO(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true
  }
})

const PORT = process.env.PORT || 3000

// ✅ Ensure uploads folder exists
const uploadDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir)
  console.log('📁 Created uploads folder')
}

// ✅ Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
})
const upload = multer({ storage })

// ✅ Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true
}))
app.use(express.json())

// ✅ Static uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// ✅ Routes
app.use('/api', authRoutes)
app.use('/api', foodRoutes(upload))
app.use('/api', orderRoutes)
app.use('/api', sectionRoutes)
app.use('/expenses', expensesRoutes)
app.use('/api/print', printRoutes)


// ✅ Pass Socket.IO to routes
app.set('io', io)

// ✅ Socket.IO events
io.on('connection', (socket) => {
  console.log('⚡ User connected:', socket.id)

  socket.on('disconnect', () => {
    console.log('🔥 User disconnected:', socket.id)
  })
})

// ✅ Start everything
initDB()
server.listen(PORT, '0.0.0.0', () => {
  console.log('✅ SQLite DB initialized')
  console.log(`🚀 Novo backend running at http://localhost:${PORT}`)
})

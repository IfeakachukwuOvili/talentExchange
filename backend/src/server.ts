import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { prisma } from './lib/prisma'
import authRoutes from './routes/authRoutes'
import serviceRoutes from './routes/serviceRoutes'
import bookingRoutes from './routes/bookingRoutes'
import providerRoutes from './routes/providerRoutes'
import { initializeWebSocket } from './services/websocketService'
import { addRequestId } from './middleware/requestId'
import logger from './utils/logger'
import { authenticateToken, authenticateProvider } from './middleware/auth'


dotenv.config()

const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 3001

// Initialize WebSocket
const io = initializeWebSocket(server)

// Enhanced CORS configuration to fix the OPTIONS error
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://talents-exchange.onrender.com',
    process.env.FRONTEND_URL || 'http://localhost:5173'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}))

// Middleware
app.use(express.json())
app.use(addRequestId) 

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    logger.http(`${req.method} ${req.originalUrl}`, {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      requestId: req.headers['x-request-id']
    })
  })
  
  next()
})

// Make io available to routes
app.set('io', io)

// Database connection
prisma.$connect()
  .then(() => {
    logger.info('Connected to MongoDB via Prisma')
  })
  .catch((err: any) => {
    logger.error('Database connection error', { error: err.message, stack: err.stack })
    process.exit(1)
  })

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/services', serviceRoutes)
app.use('/api/bookings', authenticateToken, bookingRoutes)
app.use('/api/provider', authenticateToken, authenticateProvider, providerRoutes)

app.get('/', (req, res) => {
  res.json({ message: 'Talent Exchange API is running!' })
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    requestId: req.headers['x-request-id']
  })
  
  res.status(500).json({ 
    message: 'Internal server error',
    requestId: req.headers['x-request-id']
  })
})

server.listen(PORT, () => {
  logger.info(`Server started successfully`, {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  })
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  await prisma.$disconnect()
  server.close(() => {
    logger.info('Server closed')
    process.exit(0)
  })
})
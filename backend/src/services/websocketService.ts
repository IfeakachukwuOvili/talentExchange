import { Server, Socket } from 'socket.io'
import { Server as HttpServer } from 'http'
import jwt from 'jsonwebtoken'
import { redisService } from './redisService' 
import { prisma } from '../lib/prisma'

const FRONTEND_URL = process.env.FRONTEND_URL 
interface AuthenticatedSocket extends Socket {
  userId?: string
}

export const initializeWebSocket = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: FRONTEND_URL,
      methods: ["GET", "POST"]
    }
  })

  // Authentication middleware
  io.use((socket: any, next) => {
    try {
      const token = socket.handshake.auth.token
      
      if (!token) {
        return next(new Error('Authentication token required'))
      }

      jwt.verify(token, process.env.JWT_SECRET!, (err: any, decoded: any) => {
        if (err) {
          return next(new Error('Invalid token'))
        }
        
        socket.userId = decoded.userId
        next()
      })
    } catch (error) {
      next(new Error('Authentication failed'))
    }
  })

  io.on('connection', (socket: AuthenticatedSocket) => {
    
    // Join user-specific room
    socket.join(`user:${socket.userId}`)
    
    // Subscribe to Redis updates for this user
    redisService.subscribeToUserUpdates(socket.userId!, (message) => {
      socket.emit('booking_update', message)
    })

    // Handle booking status requests
    socket.on('request_booking_status', async (bookingId: string) => {
      try {
        
        // Fetch current booking status from database
        const booking = await prisma.booking.findFirst({
          where: { 
            id: bookingId,
            userId: socket.userId 
          },
          include: { service: true }
        })
        
        if (booking) {
          socket.emit('booking_status', {
            bookingId: booking.id,
            status: booking.status,
            service: booking.service.name,
            startTime: booking.startTime
          })
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to fetch booking status' })
      }
    })

    socket.on('disconnect', () => {
      redisService.unsubscribeFromUserUpdates(socket.userId!)
    })
  })

  return io
}
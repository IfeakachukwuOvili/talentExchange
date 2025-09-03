import { io, Socket } from 'socket.io-client'

class WebSocketService {
  private socket: Socket | null = null
  private listeners: Map<string, Function[]> = new Map()
  private connecting: boolean = false

  connect(token: string) {
    // Prevent multiple connection attempts
    if (this.socket?.connected || this.connecting) {
      console.log('🔌 WebSocket already connected or connecting')
      return
    }

    this.connecting = true
    console.log('🔌 Connecting to WebSocket...')
    
    this.socket = io('http://localhost:3001', {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 3000
    })

    this.setupEventListeners()
  }

  private setupEventListeners() {
    if (!this.socket) return

    this.socket.on('connect', () => {
      console.log(' WebSocket connected')
      this.connecting = false
    })

    this.socket.on('disconnect', (reason) => {
      console.log(' WebSocket disconnected:', reason)
      this.connecting = false
    })

    this.socket.on('booking_update', (data) => {
      console.log(' Received booking update:', data)
      this.emit('booking_update', data)
    })

    this.socket.on('booking_status', (data) => {
      console.log(' Received booking status:', data)
      this.emit('booking_status', data)
    })

    this.socket.on('error', (error) => {
      console.error(' WebSocket error:', error)
      this.connecting = false
      this.emit('error', error)
    })
  }

  disconnect() {
    if (this.socket) {
      console.log(' Disconnecting WebSocket...')
      this.socket.disconnect()
      this.socket = null
      this.connecting = false
    }
  }

  requestBookingStatus(bookingId: string) {
    if (this.socket?.connected) {
      console.log(' Requesting booking status for:', bookingId)
      this.socket.emit('request_booking_status', bookingId)
    }
  }

  // Event listener management
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback?: Function) {
    if (!callback) {
      this.listeners.delete(event)
      return
    }
    
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      const index = eventListeners.indexOf(callback)
      if (index > -1) {
        eventListeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event)
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data))
    }
  }
}

// Create a single instance
export const websocketService = new WebSocketService()
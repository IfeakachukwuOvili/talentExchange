import { EventEmitter } from 'events'
import logger from '../utils/logger'

// Import Upstash Redis
let Redis: any = null
try {
  Redis = require('@upstash/redis').Redis
} catch (error) {
  logger.warn('Upstash Redis package not found')
}

class RedisService {
  private redis: any = null
  private fallbackEmitter: EventEmitter
  private isConnected: boolean = false
  private initializationPromise: Promise<void>

  constructor() {
    this.fallbackEmitter = new EventEmitter()
    this.initializationPromise = this.initializeRedis()
  }

  private async initializeRedis(): Promise<void> {
    try {
      // Check if we have Redis package
      if (!Redis) {
        throw new Error('Upstash Redis package not available')
      }

      // Check environment variables
      if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
        throw new Error('Upstash Redis environment variables missing')
      }

      // Initialize Redis client
      this.redis = Redis.fromEnv()
      
      // Test connection
      const result = await this.redis.ping()
      if (result !== 'PONG') {
        throw new Error('Redis ping failed')
      }
      
      this.isConnected = true
      logger.info(' Connected to Upstash Redis successfully')
      
    } catch (error) {
      logger.warn(`Redis connection failed: ${(error instanceof Error ? error.message : String(error))}`)
      logger.info('Using fallback messaging (EventEmitter)')
      this.isConnected = false
    }
  }

  private async ensureInitialized(): Promise<void> {
    await this.initializationPromise
  }

  async publishBookingUpdate(userId: string, bookingData: any) {
    try {
      await this.ensureInitialized()
      
      const message = {
        type: 'BOOKING_UPDATE',
        userId,
        data: bookingData,
        timestamp: new Date().toISOString()
      }

      if (this.isConnected && this.redis) {
        // Store in Redis with expiration
        const key = `booking_update:${userId}:${Date.now()}`
        await this.redis.setex(key, 30, JSON.stringify(message)) // 30 seconds expiry
        logger.info(`Booking update published to Redis for user: ${userId}`)
      } else {
        // Fallback to EventEmitter
        this.fallbackEmitter.emit(`user:${userId}:updates`, JSON.stringify(message))
        logger.info(` Booking update published to fallback for user: ${userId}`)
      }
    } catch (error) {
      logger.error(' Error publishing booking update:', error)
      // Always fallback on error
      const message = JSON.stringify({
        type: 'BOOKING_UPDATE',
        userId,
        data: bookingData,
        timestamp: new Date().toISOString()
      })
      this.fallbackEmitter.emit(`user:${userId}:updates`, message)
    }
  }

  async subscribeToUserUpdates(userId: string, callback: (message: any) => void) {
    try {
      await this.ensureInitialized()
      
      if (this.isConnected && this.redis) {
        // For Upstash, we'll use polling since it doesn't support pub/sub
        const pollInterval = setInterval(async () => {
          try {
            // Look for messages for this user
            const keys = await this.redis.keys(`booking_update:${userId}:*`)
            
            for (const key of keys) {
              const messageStr = await this.redis.get(key)
              if (messageStr) {
                const message = JSON.parse(messageStr)
                callback(message)
                // Delete message after processing
                await this.redis.del(key)
              }
            }
          } catch (error) {
            logger.error('Error polling Redis for updates:', error)
          }
        }, 1000) // Poll every second

        logger.info(` Subscribed to Redis updates for user: ${userId}`)
        
        // Return cleanup function
        return () => {
          clearInterval(pollInterval)
          logger.info(` Unsubscribed from Redis updates for user: ${userId}`)
        }
      } else {
        // Fallback to EventEmitter
        this.fallbackEmitter.on(`user:${userId}:updates`, (message: string) => {
          const parsedMessage = JSON.parse(message)
          callback(parsedMessage)
        })
        logger.info(` Subscribed to fallback updates for user: ${userId}`)
        
        // Return cleanup function
        return () => {
          this.fallbackEmitter.removeAllListeners(`user:${userId}:updates`)
          logger.info(` Unsubscribed from fallback updates for user: ${userId}`)
        }
      }
    } catch (error) {
      logger.error(' Error subscribing to user updates:', error)
      return () => {} // Return empty cleanup function
    }
  }

  async unsubscribeFromUserUpdates(userId: string) {
    try {
      // This method is less useful with the polling approach
      // The cleanup is handled in the subscribe method's return function
      this.fallbackEmitter.removeAllListeners(`user:${userId}:updates`)
      logger.info(` Unsubscribed from user updates: ${userId}`)
    } catch (error) {
      logger.error(' Error unsubscribing from user updates:', error)
    }
  }

  isRedisConnected(): boolean {
    return this.isConnected
  }

  // Additional utility methods for general Redis usage
  async set(key: string, value: any, expiration?: number): Promise<void> {
    try {
      await this.ensureInitialized()
      
      if (this.isConnected && this.redis) {
        const serializedValue = JSON.stringify(value)
        if (expiration) {
          await this.redis.setex(key, expiration, serializedValue)
        } else {
          await this.redis.set(key, serializedValue)
        }
      }
    } catch (error) {
      logger.error(' Error setting Redis key:', error)
    }
  }

  async get(key: string): Promise<any> {
    try {
      await this.ensureInitialized()
      
      if (this.isConnected && this.redis) {
        const value = await this.redis.get(key)
        return value ? JSON.parse(value) : null
      }
      return null
    } catch (error) {
      logger.error(' Error getting Redis key:', error)
      return null
    }
  }
}

export const redisService = new RedisService()
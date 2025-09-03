import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import logger from '../utils/logger'

interface AuthenticatedRequest extends Request {
  userId?: string
  userRole?: string
}

export const getAllServices = async (req: Request, res: Response) => {
  const startTime = Date.now()
  
  try {
    const { category, search, isActive } = req.query

    logger.info('Services list request', {
      category,
      search,
      isActive,
      requestId: req.headers['x-request-id'],
      ip: req.ip
    })

    const whereClause: any = {}

    if (category && category !== 'all') {
      whereClause.category = category as string
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ]
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true'
    } else {
      // By default, only show active services to customers
      whereClause.isActive = true
    }

    const services = await prisma.service.findMany({
      where: whereClause,
      include: {
        provider: {
          select: { name: true, email: true }
        },
        _count: {
          select: { bookings: true }
        }
      },
      orderBy: { id: 'desc' }
    })

    logger.info('Services list retrieved', {
      servicesCount: services.length,
      filters: { category, search, isActive },
      duration: Date.now() - startTime
    })

    res.json(services)
  } catch (error: any) {
    logger.error('Services list retrieval failed', {
      error: error.message,
      stack: error.stack,
      filters: { category: req.query.category, search: req.query.search },
      duration: Date.now() - startTime
    })
    
    res.status(500).json({ message: 'Failed to fetch services' })
  }
}

export const getServiceById = async (req: Request, res: Response) => {
  const startTime = Date.now()
  
  try {
    const serviceId = req.params.id

    logger.info('Service details request', {
      serviceId,
      requestId: req.headers['x-request-id'],
      ip: req.ip
    })

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        provider: {
          select: { name: true, email: true }
        },
        _count: {
          select: { bookings: true }
        }
      }
    })

    if (!service) {
      logger.warn('Service not found', {
        serviceId,
        ip: req.ip
      })
      res.status(404).json({ message: 'Service not found' })
      return
    }

    if (!service.isActive) {
      logger.warn('Inactive service accessed', {
        serviceId,
        serviceName: service.name,
        ip: req.ip
      })
      res.status(404).json({ message: 'Service not available' })
      return
    }

    logger.info('Service details retrieved', {
      serviceId,
      serviceName: service.name,
      providerName: service.provider?.name,
      totalBookings: service._count.bookings,
      duration: Date.now() - startTime
    })

    res.json(service)
  } catch (error: any) {
    logger.error('Service details retrieval failed', {
      serviceId: req.params.id,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    })
    
    res.status(500).json({ message: 'Failed to fetch service details' })
  }
}

export const getServiceCategories = async (req: Request, res: Response) => {
  const startTime = Date.now()
  
  try {
    logger.info('Service categories request', {
      requestId: req.headers['x-request-id'],
      ip: req.ip
    })

    const categories = await prisma.service.findMany({
      where: { isActive: true },
      select: { category: true },
      distinct: ['category']
    })

    const categoryList = categories.map(c => c.category).sort()

    logger.info('Service categories retrieved', {
      categoriesCount: categoryList.length,
      categories: categoryList,
      duration: Date.now() - startTime
    })

    res.json({
      categories: categoryList,
      count: categoryList.length
    })
  } catch (error: any) {
    logger.error('Service categories retrieval failed', {
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    })
    
    res.status(500).json({ message: 'Failed to fetch service categories' })
  }
}

export const searchServices = async (req: Request, res: Response) => {
  const startTime = Date.now()
  
  try {
    const { q, category, minPrice, maxPrice, sortBy } = req.query

    logger.info('Service search request', {
      query: q,
      category,
      minPrice,
      maxPrice,
      sortBy,
      requestId: req.headers['x-request-id'],
      ip: req.ip
    })

    const whereClause: any = { isActive: true }

    if (q) {
      whereClause.OR = [
        { name: { contains: q as string, mode: 'insensitive' } },
        { description: { contains: q as string, mode: 'insensitive' } },
        { category: { contains: q as string, mode: 'insensitive' } }
      ]
    }

    if (category && category !== 'all') {
      whereClause.category = category as string
    }

    if (minPrice) {
      whereClause.price = { ...whereClause.price, gte: parseFloat(minPrice as string) }
    }

    if (maxPrice) {
      whereClause.price = { ...whereClause.price, lte: parseFloat(maxPrice as string) }
    }

    let orderBy: any = { id: 'desc' }
    
    if (sortBy === 'price_asc') orderBy = { price: 'asc' }
    if (sortBy === 'price_desc') orderBy = { price: 'desc' }
    if (sortBy === 'name') orderBy = { name: 'asc' }
    if (sortBy === 'popular') orderBy = { bookings: { _count: 'desc' } }

    const services = await prisma.service.findMany({
      where: whereClause,
      include: {
        provider: {
          select: { name: true }
        },
        _count: {
          select: { bookings: true }
        }
      },
      orderBy
    })

    logger.info('Service search completed', {
      query: q,
      resultsCount: services.length,
      filters: { category, minPrice, maxPrice, sortBy },
      duration: Date.now() - startTime
    })

    res.json({
      services,
      count: services.length,
      query: {
        search: q,
        category,
        minPrice,
        maxPrice,
        sortBy
      }
    })
  } catch (error: any) {
    logger.error('Service search failed', {
      query: req.query.q,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    })
    
    res.status(500).json({ message: 'Failed to search services' })
  }
}

export const getAvailableSlots = async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const { date } = req.query

    if (!date || typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
       res.status(400).json({ message: 'A valid date in YYYY-MM-DD format is required.' })
       return
    }

    const queryDate = new Date(`${date}T00:00:00.000Z`)
    const service = await prisma.service.findUnique({ where: { id } })

    if (!service) {
       res.status(404).json({ message: 'Service not found' })
       return
    }
    if (!service.isActive) {
       res.json({ availableSlots: [] })
       return
    }

    const dayOfWeek = queryDate.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }).toLowerCase()
    const workingHours = service.workingHours as any
    const daySchedule = workingHours[dayOfWeek]

    if (!daySchedule || !daySchedule.enabled) {
       res.json({ availableSlots: [] })
       return
    }

    const allSlots = []
    const [startHour, startMinute] = daySchedule.start.split(':').map(Number)
    const [endHour, endMinute] = daySchedule.end.split(':').map(Number)

    const slotIterator = new Date(queryDate)
    slotIterator.setUTCHours(startHour, startMinute, 0, 0)

    const endTime = new Date(queryDate)
    endTime.setUTCHours(endHour, endMinute, 0, 0)

    while (slotIterator < endTime) {
      const slotStart = new Date(slotIterator)
      const slotEnd = new Date(slotStart)
      slotEnd.setUTCMinutes(slotEnd.getUTCMinutes() + service.duration)
      
      if (slotEnd > endTime) break

      allSlots.push({ start: slotStart, end: slotEnd })
      slotIterator.setUTCMinutes(slotIterator.getUTCMinutes() + service.duration)
    }

    const startOfDay = new Date(queryDate)
    const endOfDay = new Date(queryDate)
    endOfDay.setUTCHours(23, 59, 59, 999)

    const existingBookings = await prisma.booking.findMany({
      where: {
        serviceId: id,
        startTime: { gte: startOfDay, lt: endOfDay },
        status: { notIn: ['CANCELLED'] }
      },
      select: { startTime: true },
    })

    const bookedStartTimes = new Set(
      existingBookings.map(b => b.startTime.toISOString())
    )

    // FIX: Format the data exactly as the frontend expects
    const availableSlots = allSlots
      .filter(slot => !bookedStartTimes.has(slot.start.toISOString()))
      .map(slot => {
        const startTimeStr = slot.start.toISOString().substr(11, 5)
        const endTimeStr = slot.end.toISOString().substr(11, 5)
        const displayTime = new Date(slot.start).toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit', 
          hour12: true, 
          timeZone: 'UTC' 
        })

        return {
          startTime: startTimeStr,
          endTime: endTimeStr,
          display: displayTime,
        }
      })

    res.json({ availableSlots })
  } catch (error) {
    console.error('Error fetching available slots:', error)
    res.status(500).json({ message: 'An internal error occurred.' })
  }
}
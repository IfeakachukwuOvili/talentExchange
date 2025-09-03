import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import logger from '../utils/logger'
import { logAuditEvent } from '../utils/auditLogger'

interface AuthenticatedRequest extends Request {
  userId?: string
  userRole?: string
}

export const getProviderDashboard = async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now()
  
  try {
    const providerId = req.userId
    
    logger.info('Provider dashboard request', {
      providerId,
      requestId: req.headers['x-request-id']
    })
    
    // Get provider stats
    const [totalBookings, activeBookings, completedBookings, completedBookingsWithServices] = await Promise.all([
      prisma.booking.count({ where: { providerId } }),
      prisma.booking.count({ where: { providerId, status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] } } }),
      prisma.booking.count({ where: { providerId, status: 'COMPLETED' } }),
      // Get completed bookings with service prices to calculate earnings
      prisma.booking.findMany({
        where: { providerId, status: 'COMPLETED' },
        include: { service: { select: { price: true } } }
      })
    ])

    // Calculate total earnings from completed bookings
    const totalEarnings = completedBookingsWithServices.reduce((sum, booking) => {
      return sum + (booking.service?.price || 0)
    }, 0)

    // Get recent bookings
    const recentBookings = await prisma.booking.findMany({
      where: { providerId },
      include: { 
        service: true, 
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    })

    logger.info('Provider dashboard data retrieved', {
      providerId,
      totalBookings,
      activeBookings,
      completedBookings,
      totalEarnings,
      recentBookingsCount: recentBookings.length,
      duration: Date.now() - startTime
    })

    res.json({
      stats: {
        totalBookings,
        activeBookings,
        completedBookings,
        totalEarnings
      },
      recentBookings
    })
  } catch (error: any) {
    logger.error('Provider dashboard error', {
      providerId: req.userId,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    })
    
    res.status(500).json({ message: 'Failed to fetch dashboard data' })
  }
}

export const getProviderServices = async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now()
  
  try {
    const providerId = req.userId
    
    logger.info('Provider services request', {
      providerId,
      requestId: req.headers['x-request-id']
    })
    
    const services = await prisma.service.findMany({
      where: { providerId },
      include: {
        _count: {
          select: { bookings: true }
        }
      },
      orderBy: { id: 'desc' }
    })

    logger.info('Provider services retrieved', {
      providerId,
      servicesCount: services.length,
      duration: Date.now() - startTime
    })

    res.json(services)
  } catch (error: any) {
    logger.error('Provider services retrieval failed', {
      providerId: req.userId,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    })
    
    res.status(500).json({ message: 'Failed to fetch services' })
  }
}

export const createService = async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now()
  
  try {
    const providerId = req.userId
    const { name, description, price, duration, category, isActive, workingHours } = req.body

    logger.info('Service creation started', {
      providerId,
      serviceName: name,
      category,
      price,
      requestId: req.headers['x-request-id']
    })

    const service = await prisma.service.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        duration: parseInt(duration),
        category,
        isActive: isActive !== undefined ? isActive : true,
        providerId,
        workingHours: workingHours || {
          "monday": {"enabled": true, "start": "09:00", "end": "17:00"},
          "tuesday": {"enabled": true, "start": "09:00", "end": "17:00"},
          "wednesday": {"enabled": true, "start": "09:00", "end": "17:00"},
          "thursday": {"enabled": true, "start": "09:00", "end": "17:00"},
          "friday": {"enabled": true, "start": "09:00", "end": "17:00"},
          "saturday": {"enabled": false, "start": "09:00", "end": "17:00"},
          "sunday": {"enabled": false, "start": "09:00", "end": "17:00"}
        }
      },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    })

    logger.info('Service created successfully', {
      serviceId: service.id,
      providerId,
      serviceName: name,
      category,
      price: service.price,
      duration: Date.now() - startTime
    })

    logAuditEvent({
      action: 'SERVICE_CREATED',
      userId: providerId,
      userRole: 'SERVICE_PROVIDER',
      resourceType: 'service',
      resourceId: service.id,
      details: {
        serviceName: name,
        category,
        price: service.price,
        duration: service.duration,
        isActive: service.isActive
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    })

    res.status(201).json({
      success: true,
      data: service,
      message: 'Service created successfully'
    })
  } catch (error: any) {
    logger.error('Service creation failed', {
      providerId: req.userId,
      serviceName: req.body.name,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    })

    logAuditEvent({
      action: 'SERVICE_CREATION_FAILED',
      userId: req.userId,
      userRole: 'SERVICE_PROVIDER',
      resourceType: 'service',
      details: {
        serviceName: req.body.name,
        error: error.message
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      errorMessage: error.message
    })

    res.status(400).json({ 
      success: false,
      message: error.message || 'Failed to create service'
    })
  }
}

export const updateService = async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now()
  
  try {
    const providerId = req.userId
    const serviceId = req.params.id
    const { name, description, price, duration, category, isActive } = req.body

    logger.info('Service update started', {
      serviceId,
      providerId,
      requestId: req.headers['x-request-id']
    })

    // Verify service belongs to provider
    const existingService = await prisma.service.findFirst({
      where: { id: serviceId, providerId }
    })

    if (!existingService) {
      logger.warn('Service update failed - service not found or unauthorized', {
        serviceId,
        providerId
      })
      res.status(404).json({ 
        success: false,
        message: 'Service not found'
      })
      return
    }

    const service = await prisma.service.update({
      where: { id: serviceId },
      data: {
        name,
        description,
        price: parseFloat(price),
        duration: parseInt(duration),
        category,
        isActive: isActive !== undefined ? isActive : existingService.isActive
      },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    })

    logger.info('Service updated successfully', {
      serviceId,
      providerId,
      serviceName: name,
      changes: {
        name: existingService.name !== name,
        price: existingService.price !== parseFloat(price),
        isActive: existingService.isActive !== isActive
      },
      duration: Date.now() - startTime
    })

    logAuditEvent({
      action: 'SERVICE_UPDATED',
      userId: providerId,
      userRole: 'SERVICE_PROVIDER',
      resourceType: 'service',
      resourceId: serviceId,
      details: {
        serviceName: name,
        previousData: {
          name: existingService.name,
          price: existingService.price,
          isActive: existingService.isActive
        },
        newData: {
          name,
          price: service.price,
          isActive: service.isActive
        }
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    })

    res.json({
      success: true,
      data: service,
      message: 'Service updated successfully'
    })
  } catch (error: any) {
    logger.error('Service update failed', {
      serviceId: req.params.id,
      providerId: req.userId,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    })

    logAuditEvent({
      action: 'SERVICE_UPDATE_FAILED',
      userId: req.userId,
      userRole: 'SERVICE_PROVIDER',
      resourceType: 'service',
      resourceId: req.params.id,
      details: { error: error.message },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      errorMessage: error.message
    })

    res.status(400).json({ 
      success: false,
      message: error.message || 'Failed to update service'
    })
  }
}

export const deleteService = async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now()
  
  try {
    const providerId = req.userId
    const serviceId = req.params.id

    logger.info('Service deletion started', {
      serviceId,
      providerId,
      requestId: req.headers['x-request-id']
    })

    // Verify service belongs to provider and get details for audit
    const existingService = await prisma.service.findFirst({
      where: { id: serviceId, providerId },
      include: {
        _count: {
          select: { bookings: true }
        }
      }
    })

    if (!existingService) {
      logger.warn('Service deletion failed - service not found or unauthorized', {
        serviceId,
        providerId
      })
      res.status(404).json({ 
        success: false,
        message: 'Service not found'
      })
      return
    }

    // Check for active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        serviceId,
        status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] }
      }
    })

    if (activeBookings > 0) {
      logger.warn('Service deletion failed - has active bookings', {
        serviceId,
        providerId,
        activeBookings
      })
      res.status(400).json({ 
        success: false,
        message: `Cannot delete service with ${activeBookings} active booking(s)` 
      })
      return
    }

    await prisma.service.delete({
      where: { id: serviceId }
    })

    logger.info('Service deleted successfully', {
      serviceId,
      providerId,
      serviceName: existingService.name,
      totalBookings: existingService._count.bookings,
      duration: Date.now() - startTime
    })

    logAuditEvent({
      action: 'SERVICE_DELETED',
      userId: providerId,
      userRole: 'SERVICE_PROVIDER',
      resourceType: 'service',
      resourceId: serviceId,
      details: {
        serviceName: existingService.name,
        category: existingService.category,
        totalBookings: existingService._count.bookings,
        price: existingService.price
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    })

    res.json({ 
      success: true,
      message: 'Service deleted successfully'
    })
  } catch (error: any) {
    logger.error('Service deletion failed', {
      serviceId: req.params.id,
      providerId: req.userId,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    })

    logAuditEvent({
      action: 'SERVICE_DELETION_FAILED',
      userId: req.userId,
      userRole: 'SERVICE_PROVIDER',
      resourceType: 'service',
      resourceId: req.params.id,
      details: { error: error.message },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      errorMessage: error.message
    })

    res.status(500).json({ 
      success: false,
      message: 'Failed to delete service'
    })
  }
}

export const getProviderBookings = async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now()
  
  try {
    const providerId = req.userId

    logger.info('Provider bookings request', {
      providerId,
      requestId: req.headers['x-request-id']
    })

    const bookings = await prisma.booking.findMany({
      where: { providerId },
      include: {
        service: true,
        user: { select: { name: true, email: true } }
      },
      orderBy: { startTime: 'desc' }
    })

    logger.info('Provider bookings retrieved', {
      providerId,
      bookingsCount: bookings.length,
      duration: Date.now() - startTime
    })

    res.json(bookings)
  } catch (error: any) {
    logger.error('Provider bookings retrieval failed', {
      providerId: req.userId,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    })
    
    res.status(500).json({ message: 'Failed to fetch bookings' })
  }
}

export const updateBookingStatus = async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now()
  
  try {
    const providerId = req.userId
    const bookingId = req.params.id
    const { status, notes } = req.body

    logger.info('Booking status update started', {
      bookingId,
      providerId,
      newStatus: status,
      requestId: req.headers['x-request-id']
    })

    // Verify booking belongs to provider
    const existingBooking = await prisma.booking.findFirst({
      where: { id: bookingId, providerId },
      include: { service: true, user: { select: { name: true } } }
    })

    if (!existingBooking) {
      logger.warn('Booking status update failed - booking not found or unauthorized', {
        bookingId,
        providerId
      })
      res.status(404).json({ message: 'Booking not found' })
      return
    }

    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status, notes },
      include: {
        service: true,
        user: { select: { name: true, email: true } }
      }
    })

    logger.info('Booking status updated successfully', {
      bookingId,
      providerId,
      previousStatus: existingBooking.status,
      newStatus: status,
      customerName: booking.user.name,
      serviceName: booking.service.name,
      duration: Date.now() - startTime
    })

    logAuditEvent({
      action: 'BOOKING_STATUS_UPDATED',
      userId: providerId,
      userRole: 'SERVICE_PROVIDER',
      resourceType: 'booking',
      resourceId: bookingId,
      details: {
        previousStatus: existingBooking.status,
        newStatus: status,
        customerName: booking.user.name,
        serviceName: booking.service.name,
        notes
      },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    })

    res.json(booking)
  } catch (error: any) {
    logger.error('Booking status update failed', {
      bookingId: req.params.id,
      providerId: req.userId,
      status: req.body.status,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    })

    logAuditEvent({
      action: 'BOOKING_STATUS_UPDATE_FAILED',
      userId: req.userId,
      userRole: 'SERVICE_PROVIDER',
      resourceType: 'booking',
      resourceId: req.params.id,
      details: { error: error.message, attemptedStatus: req.body.status },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      errorMessage: error.message
    })

    res.status(400).json({ message: error.message || 'Failed to update booking status' })
  }
}
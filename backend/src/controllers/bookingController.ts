import { Request, Response } from 'express'
import { prisma } from '../lib/prisma'
import { bookingSchema } from '../types/validation'
import { redisService } from '../services/redisService'
import { BookingStatus } from '@prisma/client'
import logger from '../utils/logger'
import { logAuditEvent } from '../utils/auditLogger'


interface AuthenticatedRequest extends Request {
  user: any
  userId?: string
  userRole?: string
}

export const createBooking = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = bookingSchema.safeParse(req.body);
    if (!validation.success) {
       res.status(400).json({ message: "Invalid input", errors: validation.error.errors });
       return
    }

    const { serviceId, date, startTime, notes } = validation.data;

    // Combine date and time for the precise start time
    const bookingStartTime = new Date(`${date}T${startTime}:00.000Z`);

    // Find the service to get its duration
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) {
       res.status(404).json({ message: "Service not found." });
       return
    }
    
    // Calculate the booking end time
    const bookingEndTime = new Date(bookingStartTime.getTime() + service.duration * 60000);

    // Check for booking conflicts to prevent double-booking
    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        serviceId,
        status: { notIn: ['CANCELLED'] },
        AND: [
          { startTime: { lt: bookingEndTime } },
          { endTime: { gt: bookingStartTime } },
        ],
      },
    });

    if (conflictingBooking) {
       res.status(409).json({ message: "This time slot is no longer available. Please select another time." });
       return
    }
    // Create the booking
    const newBooking = await prisma.booking.create({
      data: {
        userId: req.user!.id, 
        serviceId,
        // FIX: Add the 'date' field back, but as a proper DateTime object
        date: new Date(`${date}T00:00:00.000Z`),
        startTime: bookingStartTime, 
        endTime: bookingEndTime,
        status: 'PENDING',
        notes,
      },
      include: {
        service: { select: { name: true, price: true } },
        // This should match the relation field name on your Booking model
        user: { select: { name: true } }, 
      },
    });
    // Here you would also emit a WebSocket event to the provider
    // io.to(service.providerId).emit('booking_update', newBooking);

    res.status(201).json({ message: "Booking created successfully!", booking: newBooking });
    return

  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ message: "An internal server error occurred." });
    return
  }
};

export const updateBookingStatus = async (
  bookingId: string, 
  status: BookingStatus, 
  message?: string,
  req?: AuthenticatedRequest
) => {
  try {    
    const booking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: {
        service: true,
        user: { select: { id: true, name: true } }
      }
    })

    logger.info('Booking status updated', {
      bookingId,
      newStatus: status,
      previousStatus: 'tracked_separately', // Could track this if needed
      message,
      updatedBy: req?.userId || 'system'
    })

    // Audit log for status updates
    if (req) {
      logAuditEvent({
        action: 'BOOKING_STATUS_UPDATED',
        userId: req.userId,
        userRole: req.userRole || 'SERVICE_PROVIDER',
        resourceType: 'booking',
        resourceId: bookingId,
        details: {
          newStatus: status,
          message,
          serviceName: booking.service.name
        },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: true
      })
    }
    
    // Publish real-time update
    try {
      await redisService.publishBookingUpdate(booking.userId, {
        type: 'STATUS_UPDATE',
        booking: {
          id: booking.id,
          serviceName: booking.service.name,
          status: booking.status,
          startTime: booking.startTime,
          message: message || `Booking status updated to ${status}`
        }
      })
      logger.debug('Real-time status update published', { bookingId, status })
    } catch (wsError) {
      logger.error('Failed to publish real-time status update', {
        bookingId,
        status,
        error: wsError
      })
    }
    
  } catch (error: any) {
    logger.error('Failed to update booking status', {
      bookingId,
      status,
      error: error.message,
      stack: error.stack
    })

    if (req) {
      logAuditEvent({
        action: 'BOOKING_STATUS_UPDATE_FAILED',
        userId: req.userId,
        userRole: req.userRole || 'SERVICE_PROVIDER',
        resourceType: 'booking',
        resourceId: bookingId,
        details: { error: error.message, attemptedStatus: status },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: error.message
      })
    }
  }
}

export const getUserBookings = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.userId) {
      logger.warn('Get user bookings attempted without authentication', {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      })
      res.status(401).json({ message: 'Authentication required' })
      return
    }
    
    const bookings = await prisma.booking.findMany({
      where: { userId: req.userId },
      include: { service: true },
      orderBy: { startTime: 'desc' }
    })

    logger.info('User bookings retrieved', {
      userId: req.userId,
      bookingCount: bookings.length
    })
    
    res.json(bookings)
    return
  } catch (error: any) {
    logger.error('Failed to fetch user bookings', {
      userId: req.userId,
      error: error.message,
      stack: error.stack
    })
    res.status(500).json({ message: 'Failed to fetch bookings' })
    return
  }
}

// Manual status update endpoint for testing
export const manualStatusUpdate = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { bookingId, status, message } = req.body
    
    // Validate status is a valid enum value
    if (!Object.values(BookingStatus).includes(status)) {
      logger.warn('Invalid booking status provided', { 
        bookingId, 
        invalidStatus: status,
        validStatuses: Object.values(BookingStatus)
      })
      res.status(400).json({ message: 'Invalid status value' })
      return
    }
    
    await updateBookingStatus(bookingId, status as BookingStatus, message, req)
    
    logger.info('Manual booking status update completed', {
      bookingId,
      status,
      message
    })
    
    res.json({ message: 'Status updated successfully' })
  } catch (error: any) {
    logger.error('Manual status update failed', {
      bookingId: req.body.bookingId,
      error: error.message,
      stack: error.stack
    })
    res.status(500).json({ message: error.message })
  }
}
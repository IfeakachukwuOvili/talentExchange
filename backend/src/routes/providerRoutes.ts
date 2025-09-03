import express from 'express'
import { 
  getProviderDashboard, 
  getProviderBookings, 
  updateBookingStatus,
  getProviderServices,
  createService,
  updateService,
  deleteService
} from '../controllers/providerController'
import { authenticateProvider, authenticateToken } from '../middleware/auth'

const router = express.Router()

// Dashboard
router.get('/dashboard', authenticateProvider, authenticateToken, getProviderDashboard)

// Bookings
router.get('/bookings', authenticateProvider, getProviderBookings)
router.put('/bookings/:id/status', authenticateProvider, updateBookingStatus)

// Services
router.get('/services', authenticateProvider, getProviderServices)
router.post('/create-services', authenticateProvider, createService)
router.put('/services/:id', authenticateProvider, updateService)
router.delete('/services/:id', authenticateProvider, deleteService)

export default router
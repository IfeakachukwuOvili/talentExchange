import express from 'express'
import { 
  getAllServices, 
  getServiceById, 
  getServiceCategories, 
  searchServices,
  getAvailableSlots
} from '../controllers/serviceController'

const router = express.Router()

// GET /api/services - Get all services
router.get('/', getAllServices)

// GET /api/services/categories - Get service categories
router.get('/categories', getServiceCategories)

// GET /api/services/search - Search services
router.get('/search', searchServices)

// GET /api/services/:id/slots - Get available time slots
router.get('/:id/slots', getAvailableSlots)


// GET /api/services/:id - Get service by ID
router.get('/:id', getServiceById)

export default router
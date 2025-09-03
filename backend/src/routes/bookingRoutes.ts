import express from 'express'
import { createBooking, getUserBookings } from '../controllers/bookingController'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

router.post('/', authenticateToken, createBooking as any)
router.get('/', authenticateToken, getUserBookings as any)

export default router
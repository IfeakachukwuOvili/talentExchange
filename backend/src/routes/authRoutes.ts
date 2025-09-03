import express from 'express'
import { register, customerLogin, providerLogin, providerRegister } from '../controllers/authController'
import { authenticateToken } from '../middleware/auth'

const router = express.Router()

// Customer routes
router.post('/register', register) // Default customer registration
router.post('/login', customerLogin) // Default customer login
router.post('/customer/login', customerLogin) // Explicit customer login

// Provider routes
router.post('/provider/register', providerRegister)
router.post('/provider/login', providerLogin)

export default router
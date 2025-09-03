import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '../lib/prisma'
import { loginSchema, registerSchema } from '../types/validation'
import logger from '../utils/logger'
import { logAuditEvent } from '../utils/auditLogger'

export const register = async (req: Request, res: Response) => {
  const startTime = Date.now()
  
  try {
    const { name, email, password } = registerSchema.parse(req.body)
    
    logger.info('Customer registration started', {
      email,
      name,
      requestId: req.headers['x-request-id'],
      ip: req.ip
    })
    
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      logger.warn('Registration failed - user already exists', {
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      })
      
      logAuditEvent({
        action: 'REGISTRATION_FAILED',
        resourceType: 'user',
        details: { email, reason: 'user_already_exists' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: 'User already exists'
      })
      
      res.status(400).json({ message: 'User already exists' })
      return
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'CUSTOMER'
      }
    })
    
    const token = jwt.sign(
      { userId: user.id, role: user.role }, 
      process.env.JWT_SECRET!, 
      { expiresIn: '24h' }
    )
    
    logger.info('Customer registered successfully', {
      userId: user.id,
      email: user.email,
      name: user.name,
      duration: Date.now() - startTime
    })
    
    logAuditEvent({
      action: 'USER_REGISTERED',
      userId: user.id,
      userRole: 'CUSTOMER',
      resourceType: 'user',
      resourceId: user.id,
      details: { email, name, role: 'CUSTOMER' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    })
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error: any) {
    logger.error('Customer registration failed', {
      email: req.body.email,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    })
    
    logAuditEvent({
      action: 'REGISTRATION_ERROR',
      resourceType: 'user',
      details: { email: req.body.email, error: error.message },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      errorMessage: error.message
    })
    
    res.status(400).json({ message: error.message || 'Registration failed' })
  }
}

export const customerLogin = async (req: Request, res: Response) => {
  const startTime = Date.now()
  
  try {
    const { email, password } = loginSchema.parse(req.body)
    
    logger.info('Customer login attempt', {
      email,
      requestId: req.headers['x-request-id'],
      ip: req.ip
    })
    
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      logger.warn('Login failed - user not found', {
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      })
      
      logAuditEvent({
        action: 'LOGIN_FAILED',
        resourceType: 'user',
        details: { email, reason: 'user_not_found' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: 'Invalid credentials'
      })
      
      res.status(401).json({ message: 'Invalid email or password' })
      return
    }
    
    if (user.role !== 'CUSTOMER') {
      logger.warn('Customer login failed - wrong role', {
        email,
        userRole: user.role,
        ip: req.ip
      })
      
      logAuditEvent({
        action: 'LOGIN_FAILED',
        userId: user.id,
        userRole: user.role,
        resourceType: 'user',
        details: { email, reason: 'wrong_role_access' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: 'Customer login required'
      })
      
      res.status(403).json({ message: 'Customer login required' })
      return
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password)
    
    if (!isValidPassword) {
      logger.warn('Login failed - invalid password', {
        userId: user.id,
        email,
        ip: req.ip
      })
      
      logAuditEvent({
        action: 'LOGIN_FAILED',
        userId: user.id,
        userRole: user.role,
        resourceType: 'user',
        details: { email, reason: 'invalid_password' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: 'Invalid credentials'
      })
      
      res.status(401).json({ message: 'Invalid email or password' })
      return
    }
    
    const token = jwt.sign(
      { userId: user.id, role: user.role }, 
      process.env.JWT_SECRET!, 
      { expiresIn: '24h' }
    )
    
    logger.info('Customer login successful', {
      userId: user.id,
      email: user.email,
      duration: Date.now() - startTime
    })
    
    logAuditEvent({
      action: 'USER_LOGIN',
      userId: user.id,
      userRole: 'CUSTOMER',
      resourceType: 'user',
      resourceId: user.id,
      details: { email, loginMethod: 'customer_portal' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    })
    
    res.json({
      message: 'Customer login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error: any) {
    logger.error('Customer login error', {
      email: req.body.email,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    })
    
    logAuditEvent({
      action: 'LOGIN_ERROR',
      resourceType: 'user',
      details: { email: req.body.email, error: error.message },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      errorMessage: error.message
    })
    
    res.status(400).json({ message: error.message || 'Login failed' })
  }
}

export const providerLogin = async (req: Request, res: Response) => {
  const startTime = Date.now()
  
  try {
    const { email, password } = loginSchema.parse(req.body)
    
    logger.info('Provider login attempt', {
      email,
      requestId: req.headers['x-request-id'],
      ip: req.ip
    })
    
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    if (!user) {
      logger.warn('Provider login failed - user not found', {
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      })
      
      logAuditEvent({
        action: 'PROVIDER_LOGIN_FAILED',
        resourceType: 'user',
        details: { email, reason: 'user_not_found' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: 'Invalid credentials'
      })
      
      res.status(401).json({ message: 'Invalid email or password' })
      return
    }
    
    if (user.role !== 'SERVICE_PROVIDER') {
      logger.warn('Provider login failed - wrong role', {
        email,
        userRole: user.role,
        ip: req.ip
      })
      
      logAuditEvent({
        action: 'PROVIDER_LOGIN_FAILED',
        userId: user.id,
        userRole: user.role,
        resourceType: 'user',
        details: { email, reason: 'wrong_role_access' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: 'Service provider login required'
      })
      
      res.status(403).json({ message: 'Service provider login required' })
      return
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password)
    
    if (!isValidPassword) {
      logger.warn('Provider login failed - invalid password', {
        userId: user.id,
        email,
        ip: req.ip
      })
      
      logAuditEvent({
        action: 'PROVIDER_LOGIN_FAILED',
        userId: user.id,
        userRole: user.role,
        resourceType: 'user',
        details: { email, reason: 'invalid_password' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: 'Invalid credentials'
      })
      
      res.status(401).json({ message: 'Invalid email or password' })
      return
    }
    
    const token = jwt.sign(
      { userId: user.id, role: user.role }, 
      process.env.JWT_SECRET!, 
      { expiresIn: '24h' }
    )
    
    logger.info('Provider login successful', {
      userId: user.id,
      email: user.email,
      duration: Date.now() - startTime
    })
    
    logAuditEvent({
      action: 'PROVIDER_LOGIN',
      userId: user.id,
      userRole: 'SERVICE_PROVIDER',
      resourceType: 'user',
      resourceId: user.id,
      details: { email, loginMethod: 'provider_portal' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    })
    
    res.json({
      message: 'Provider login successful',
      token:token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error: any) {
    logger.error('Provider login error', {
      email: req.body.email,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    })
    
    logAuditEvent({
      action: 'PROVIDER_LOGIN_ERROR',
      resourceType: 'user',
      details: { email: req.body.email, error: error.message },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      errorMessage: error.message
    })
    
    res.status(400).json({ message: error.message || 'Login failed' })
  }
}

export const providerRegister = async (req: Request, res: Response) => {
  const startTime = Date.now()
  
  try {
    const { name, email, password } = registerSchema.parse(req.body)
    
    logger.info('Provider registration started', {
      email,
      name,
      requestId: req.headers['x-request-id'],
      ip: req.ip
    })
    
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      logger.warn('Provider registration failed - user already exists', {
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      })
      
      logAuditEvent({
        action: 'PROVIDER_REGISTRATION_FAILED',
        resourceType: 'user',
        details: { email, reason: 'user_already_exists' },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        success: false,
        errorMessage: 'User already exists'
      })
      
      res.status(400).json({ message: 'User already exists' })
      return
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'SERVICE_PROVIDER'
      }
    })
    
    const token = jwt.sign(
      { userId: user.id, role: user.role }, 
      process.env.JWT_SECRET!, 
      { expiresIn: '24h' }
    )
    
    logger.info('Provider registered successfully', {
      userId: user.id,
      email: user.email,
      name: user.name,
      duration: Date.now() - startTime
    })
    
    logAuditEvent({
      action: 'PROVIDER_REGISTERED',
      userId: user.id,
      userRole: 'SERVICE_PROVIDER',
      resourceType: 'user',
      resourceId: user.id,
      details: { email, name, role: 'SERVICE_PROVIDER' },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: true
    })
    
    res.status(201).json({
      message: 'Service provider registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })
  } catch (error: any) {
    logger.error('Provider registration failed', {
      email: req.body.email,
      error: error.message,
      stack: error.stack,
      duration: Date.now() - startTime
    })
    
    logAuditEvent({
      action: 'PROVIDER_REGISTRATION_ERROR',
      resourceType: 'user',
      details: { email: req.body.email, error: error.message },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      success: false,
      errorMessage: error.message
    })
    
    res.status(400).json({ message: error.message || 'Registration failed' })
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user || !await bcrypt.compare(password, user.password)) {
       res.status(401).json({ message: 'Invalid credentials' })
       return
    }

    // Generate token
    const token = jwt.sign(
      { 
        userId: user.id, 
        role: user.role 
      },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    )

    // IMPORTANT: Return both token AND user data
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    })

  } catch (error: any) {
    logger.error('Login error', {
      error: error.message,
      stack: error.stack
    })
    res.status(500).json({ message: 'Login failed' })
  }
}

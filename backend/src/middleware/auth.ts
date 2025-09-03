import { Request, Response, NextFunction } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { prisma } from '../lib/prisma'
import logger from '../utils/logger' // Make sure you import your logger

interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
    name: string
  }
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
     res.status(401).json({ message: 'Access denied. No token provided.' })
     return
  }

  try {
    // 1. Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload

    // 2. Check if the user from the token still exists in the database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, role: true } // Select only needed fields
    })

    if (!user) {
      // This is a valid token for a user that no longer exists.
       res.status(401).json({ message: 'Authentication failed. User not found.' })
       return
    }

    // 3. SUCCESS: Attach the user payload to the request object
    req.user = user

    // 4. Proceed to the next middleware or route handler
    next()
  } catch (error) {
    // 5. CATCH THE ERROR: This is where the real problem is.
    // Log the specific error to see what's wrong (e.g., expired token)
    logger.error('Authentication middleware error', { 
      errorName: error instanceof Error ? error.name : 'UnknownError',
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof jwt.TokenExpiredError) {
       res.status(401).json({ message: 'Access token has expired. Please log in again.' });
       return
    }
    
    // For any other JWT error (malformed token, invalid signature, etc.)
    if (error instanceof jwt.JsonWebTokenError) {
       res.status(401).json({ message: 'Invalid access token.' });
       return
    }
    
    // For any other unexpected errors during the process
     res.status(500).json({ message: 'An internal authentication error occurred.' });
     return
  }
}

export const authenticateProvider = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  
  if (!req.user) {
     res.status(401).json({ message: 'Authentication required' })
     return
  }

  if (req.user.role !== 'SERVICE_PROVIDER') {
     res.status(403).json({ message: 'Provider access required' })
     return
  }

  next()
}
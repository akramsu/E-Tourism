const { verifyToken, extractTokenFromHeader } = require('../utils/auth')
const { prisma } = require('../config/database')

// Middleware to authenticate users
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = extractTokenFromHeader(authHeader)

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      })
    }

    // Verify token
    const decoded = verifyToken(token)
    
    // Get user from database with role information
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: true
      }
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      })
    }

    // Add user to request object
    req.user = user
    next()
  } catch (error) {
    console.error('Authentication error:', error)
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.'
    })
  }
}

// Middleware to authorize users based on roles
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Access denied. User not authenticated.'
        })
      }

      const userRole = req.user.role.roleName
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Insufficient permissions.'
        })
      }

      next()
    } catch (error) {
      console.error('Authorization error:', error)
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed.'
      })
    }
  }
}

// Optional authentication middleware (for public routes that can benefit from user context)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    const token = extractTokenFromHeader(authHeader)

    if (token) {
      const decoded = verifyToken(token)
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          role: true
        }
      })
      req.user = user
    }

    next()
  } catch (error) {
    // For optional auth, we don't send error response, just continue without user
    next()
  }
}

module.exports = {
  authenticate,
  authorize,
  optionalAuth
}

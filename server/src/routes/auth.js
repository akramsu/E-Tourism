const express = require('express')
const router = express.Router()
const { authenticate } = require('../middleware/auth')
const {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getRoles,
  logout
} = require('../controllers/authController')

// Public routes
router.post('/register', register)
router.post('/login', login)
router.get('/roles', getRoles)

// Protected routes
router.get('/profile', authenticate, getProfile)
router.put('/profile', authenticate, updateProfile)
router.put('/change-password', authenticate, changePassword)
router.post('/logout', authenticate, logout)

// Health check for auth routes
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Auth routes are working!',
    timestamp: new Date().toISOString()
  })
})

// Debug endpoint to check users (only in development)
router.get('/debug/users', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({ message: 'Not found' })
  }
  
  try {
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        phoneNumber: true,
        birthDate: true,
        postcode: true,
        gender: true,
        roleId: true,
        createdDate: true,
        role: {
          select: {
            roleName: true
          }
        }
      },
      orderBy: {
        createdDate: 'desc'
      },
      take: 10
    })
    
    res.status(200).json({
      success: true,
      count: users.length,
      users: users
    })
    
    await prisma.$disconnect()
  } catch (error) {
    console.error('Debug users error:', error)
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    })
  }
})

module.exports = router

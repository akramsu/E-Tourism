const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

// Load environment variables first
dotenv.config()

// Import database connection
const { connectDatabase } = require('./src/config/database')

// Import routes
const authRoutes = require('./src/routes/auth.js')
const attractionRoutes = require('./src/routes/attractions.js')
const dashboardRoutes = require('./src/routes/dashboard.js')
const visitRoutes = require('./src/routes/visits.js')
const authorityRoutes = require('./src/routes/authority.js')
const alertsRoutes = require('./src/routes/alerts.js')

const app = express()
const PORT = process.env.PORT || 5003

// Middleware
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3001', // Allow Next.js dev server on alternate port
    'http://localhost:3002'  // Allow additional ports if needed
  ],
  credentials: true
}))

app.use(express.json({ limit: '15mb' }))
app.use(express.urlencoded({ extended: true, limit: '15mb' }))

// Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'TourEase API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/attractions', attractionRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/visits', visitRoutes)
app.use('/api/authority', authorityRoutes)
app.use('/api/alerts', alertsRoutes)

// Database connection test endpoint
app.get('/api/database/test', async (req, res) => {
  try {
    res.status(200).json({
      status: 'success',
      message: 'Database connection test (placeholder)'
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error)
  
  const statusCode = error.statusCode || 500
  const message = error.message || 'Internal server error'
  
  res.status(statusCode).json({
    status: 'error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  })
})

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`
  })
})

// Start server
const startServer = async () => {
  try {
    // Connect to database first
    await connectDatabase()
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`TourEase API Server running on port ${PORT}`)
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`Health check: http://localhost:${PORT}/api/health`)
      console.log(`Client URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}`)
      console.log(`Auth endpoints: http://localhost:${PORT}/api/auth/health`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Start the server
startServer()

module.exports = app

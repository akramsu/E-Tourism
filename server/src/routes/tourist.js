const express = require('express')
const router = express.Router()
const { authenticate } = require('../middleware/auth')
const {
  // Attraction endpoints
  getAttractions,
  getAttraction,
  getFeaturedAttractions,
  getTrendingAttractions,
  getAttractionsByCategory,
  searchAttractions,
  getNearbyAttractions,
  getAttractionStats,
  
  // Review endpoints
  getAttractionReviews,
  submitReview,
  
  // Favorites endpoints
  getFavoriteAttractions,
  addToFavorites,
  removeFromFavorites,
  isFavorited,
  
  // Visit endpoints
  getUserVisits,
  recordVisit,
  
  // Booking endpoints
  createBooking,
  getUserBookings,
  getBooking,
  cancelBooking,
  updateBooking
} = require('../controllers/touristController')

// ===============================
// ATTRACTION ROUTES
// ===============================

// Public attraction routes (no authentication required)
router.get('/attractions', getAttractions)
router.get('/attractions/featured', getFeaturedAttractions)
router.get('/attractions/trending', getTrendingAttractions)
router.get('/attractions/stats', getAttractionStats)
router.get('/attractions/search', searchAttractions)
router.get('/attractions/nearby', getNearbyAttractions)
router.get('/attractions/category/:category', getAttractionsByCategory)
router.get('/attractions/:id', getAttraction)
router.get('/attractions/:id/reviews', getAttractionReviews)

// ===============================
// AUTHENTICATED ROUTES
// ===============================

// Review routes (require authentication)
router.post('/attractions/review', authenticate, submitReview)

// Favorites routes (require authentication)
router.get('/user/favorites', authenticate, getFavoriteAttractions)
router.post('/user/favorites', authenticate, addToFavorites)
router.delete('/user/favorites/:attractionId', authenticate, removeFromFavorites)
router.get('/user/favorites/:attractionId/status', authenticate, isFavorited)

// Visit routes (require authentication)
router.get('/visits/my-visits', authenticate, getUserVisits)
router.post('/visits', authenticate, recordVisit)

// Booking routes (require authentication)
router.post('/bookings', authenticate, createBooking)
router.get('/bookings/my-bookings', authenticate, getUserBookings)
router.get('/bookings/:bookingId', authenticate, getBooking)
router.put('/bookings/:bookingId/cancel', authenticate, cancelBooking)
router.put('/bookings/:bookingId', authenticate, updateBooking)

module.exports = router

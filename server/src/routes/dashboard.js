const express = require('express')
const router = express.Router()

// Placeholder dashboard routes
router.get('/stats', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Dashboard endpoint working',
    data: {
      totalUsers: 0,
      totalAttractions: 0,
      totalVisits: 0
    }
  })
})

module.exports = router

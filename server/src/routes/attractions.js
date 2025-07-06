const express = require('express')
const router = express.Router()

// Placeholder attractions routes
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Attractions endpoint working',
    data: []
  })
})

module.exports = router
